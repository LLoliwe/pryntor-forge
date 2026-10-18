/**
 * Optional local-only Rusteerio adapter for Pryntor OSIE.
 * Supplied HTML only: no fetching, crawling, telemetry, keys or paid API calls.
 */
import { open } from 'node:fs/promises';
import { constants } from 'node:fs';
import { isIP } from 'node:net';
import { pathToFileURL } from 'node:url';

export const LIMITS = Object.freeze({bytesPerPage: 2 * 1024 * 1024, batchPages: 16, headings: 32, links: 256, urlLength: 2048});

/** Filter known non-public IP literals and local hostnames from untrusted links.
 * This is NOT a DNS-resolution or SSRF-safe fetch authorisation policy. */
function publicHostname(value) {
  const h=String(value).toLowerCase().replace(/^\[|\]$/g,'').replace(/\.$/,'');
  if (!h || h==='localhost' || h.endsWith('.localhost') || h.endsWith('.local') ||
      h.endsWith('.internal') || h.endsWith('.home.arpa')) return false;
  const ip=isIP(h);
  if (ip===4) {
    const [a,b,c]=h.split('.').map(Number);
    if (a===0||a===10||a===127||a>=224||a===255||
        (a===100&&b>=64&&b<=127)||(a===169&&b===254)||
        (a===172&&b>=16&&b<=31)||(a===192&&(b===168||b===0))||
        (a===198&&(b===18||b===19))) return false;
    if ((a===192&&b===0&&c===2)||(a===198&&b===51&&c===100)||
        (a===203&&b===0&&c===113)) return false;
  }
  if (ip===6) {
    // Includes loopback, unspecified, link-local, ULA, multicast and all IPv4-mapped literals.
    if (h==='::'||h==='::1'||h.startsWith('::ffff:')||
        /^f[cd]/.test(h)||/^fe[89ab]/.test(h)||/^ff/.test(h)) return false;
  }
  return true;
}

function sourceUrlOf(value) {
  if (typeof value !== 'string' || value.length > LIMITS.urlLength) throw new TypeError('sourceUrl must be a short HTTPS URL');
  let u;
  try { u = new URL(value); } catch { throw new TypeError('Invalid sourceUrl'); }
  if (u.protocol !== 'https:' || !publicHostname(u.hostname) || u.username || u.password) throw new TypeError('sourceUrl must use HTTPS without credentials');
  return u.href;
}
function validateItem(item) {
  if (!item || typeof item !== 'object' || typeof item.html !== 'string') throw new TypeError('Expected {html, sourceUrl}');
  const sourceUrl = sourceUrlOf(item.sourceUrl);
  if (Buffer.byteLength(item.html, 'utf8') > LIMITS.bytesPerPage) throw new RangeError('HTML exceeds 2 MiB cap');
  return {html: item.html, sourceUrl};
}
function clean(s) { return String(s ?? '').replace(/\s+/g, ' ').trim(); }
function safeLink(href, base) {
  if (typeof href !== 'string' || href.length > LIMITS.urlLength || !href.trim()) return null;
  try {
    const u = new URL(href, base);
    return (u.protocol === 'https:' || u.protocol === 'http:') && publicHostname(u.hostname) && !u.username && !u.password && u.href.length <= LIMITS.urlLength ? u.href : null;
  } catch { return null; }
}
/** Bounded, provenance-preserving fields from a loaded Rusteerio CheerioAPI. */
export function collectDocument($, sourceUrl) {
  const title = clean($('title').first().text() || $('meta[property="og:title"]').first().attr('content'));
  const description = clean($('meta[name="description"]').first().attr('content') || $('meta[property="og:description"]').first().attr('content'));
  const headings = [];
  $('h1, h2, h3').each((_i, node) => {
    if (headings.length >= LIMITS.headings) return;
    const text = clean($(node).text());
    if (text) headings.push({level: String(node?.name || node?.tagName || '').toLowerCase() || 'heading', text});
  });
  const links = [];
  $('a[href]').each((_i, node) => {
    if (links.length >= LIMITS.links) return;
    const url = safeLink($(node).attr('href'), sourceUrl);
    if (url) links.push({url, text: clean($(node).text())});
  });
  return {source_url: sourceUrl, title, description, headings, links};
}
async function resolveParser(injected) {
  if (injected) return injected;
  try { return await import('rusteerio'); }
  catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') throw new Error('Rusteerio is opt-in: install a reviewed pinned version in an isolated sandbox first.', {cause: error});
    throw error;
  }
}
/** Extract one pre-obtained HTML page, without contacting its source URL. */
export async function extractHtml(item, {parser} = {}) {
  const page = validateItem(item);
  const runtime = await resolveParser(parser);
  if (typeof runtime.load !== 'function') throw new TypeError('Rusteerio parser.load is unavailable');
  return collectDocument(runtime.load(page.html), page.sourceUrl);
}
/** Batch: at most 16 pre-obtained pages, two native workers per batch. */
export async function extractBatch(items, {parser} = {}) {
  if (!Array.isArray(items) || items.length < 1 || items.length > LIMITS.batchPages) throw new RangeError('Batch must contain 1 to 16 pages');
  const pages = items.map(validateItem);
  const runtime = await resolveParser(parser);
  if (typeof runtime.loadAll !== 'function') throw new TypeError('Rusteerio parser.loadAll is unavailable');
  // Host process must configure any process-wide Rusteerio worker limit before other work begins.
  const doms = await runtime.loadAll(pages.map(p => p.html), {threads: 2});
  if (!Array.isArray(doms) || doms.length !== pages.length) throw new Error('Rusteerio returned a different document count');
  return doms.map((dom, i) => collectDocument(dom, pages[i].sourceUrl));
}
/**
 * Read a local HTML file via one bounded, no-symlink file descriptor.
 * The name may be replaced between calls; using the already opened file handle
 * prevents a pathname race. Non-regular files are rejected before reading.
 */
export async function readLocalHtmlFile(path) {
  if (!Number.isInteger(constants.O_NOFOLLOW) || constants.O_NOFOLLOW === 0)
    throw new Error('Secure no-symlink file opening unsupported on this platform');
  const flags = constants.O_RDONLY | constants.O_NOFOLLOW | (constants.O_NONBLOCK || 0);
  const handle = await open(path, flags);
  try {
    const entry = await handle.stat();
    if (!entry.isFile()) throw new Error('Input must be a regular HTML file');
    if (entry.size > LIMITS.bytesPerPage) throw new RangeError('HTML exceeds 2 MiB cap');
    // Bounded read also protects if the underlying regular file grows after fstat.
    const buffer = Buffer.alloc(LIMITS.bytesPerPage + 1);
    let total = 0;
    while (total < buffer.length) {
      const { bytesRead } = await handle.read(buffer, total, buffer.length - total, null);
      if (bytesRead === 0) break;
      total += bytesRead;
    }
    if (total > LIMITS.bytesPerPage) throw new RangeError('HTML exceeds 2 MiB cap');
    return buffer.toString('utf8', 0, total);
  } finally {
    await handle.close();
  }
}

// Explicit local-file CLI. Never follows network URLs.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [path, url, extra] = process.argv.slice(2);
  if (!path || !url || extra) {
    console.error('Usage: node tools/rusteerio_extract.mjs <local-html-file> <https-source-url>');
    process.exitCode = 2;
  } else {
    try {
      const html = await readLocalHtmlFile(path);
      console.log(JSON.stringify(await extractHtml({html, sourceUrl: url}), null, 2));
    } catch (err) {
      console.error(`Rusteerio probe failed: ${err.message}`);
      process.exitCode = 1;
    }
  }
}
