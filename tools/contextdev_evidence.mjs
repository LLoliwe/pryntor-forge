/** Optional, metered Context.dev public-web evidence client, disabled by default. */
import { isIP } from 'node:net';

export const ENDPOINT = 'https://api.context.dev/v1/web/search';
export const LIMITS = Object.freeze({ queryLength: 240, results: 10, creditsPerCall: 1 });

export function safeSourceUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const u = new URL(value);
    const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
    if (u.protocol !== 'https:' || u.username || u.password || !h.includes('.') ||
        isIP(h) || h.endsWith('.local') || h.endsWith('.internal') ||
        h.endsWith('.localhost') || h.endsWith('.home.arpa')) return null;
    return u.href;
  } catch { return null; }
}

export function planSearch(query, count = 5) {
  if (typeof query !== 'string' || !query.trim() || query.length > LIMITS.queryLength ||
      /[\u0000-\u001f\u007f]/u.test(query)) throw new TypeError('Invalid public-source query');
  if (!Number.isInteger(count) || count < 1 || count > LIMITS.results)
    throw new RangeError('Search count must be 1 to 10');
  return { query: query.trim(), numResults: count, estimatedCredits: 1 };
}

export function normalizeEvidence(response, query, observedAt) {
  if (!response || !Array.isArray(response.results)) throw new TypeError('Invalid Context.dev response');
  const { credits_consumed: used, credits_remaining: remaining } = response.key_metadata ?? {};
  if (!Number.isSafeInteger(used) || used < 0 || !Number.isSafeInteger(remaining) || remaining < 0)
    throw new Error('Missing or invalid Context.dev credit metadata');
  if (used > LIMITS.creditsPerCall) throw new Error('Unexpected credit consumption, stop pilot');
  const seen = new Set();
  const records = [];
  for (const entry of response.results.slice(0, LIMITS.results)) {
    const url = safeSourceUrl(entry?.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    records.push({source_url: url, title: String(entry.title ?? '').slice(0, 240),
      description: String(entry.description ?? '').slice(0, 600),
      relevance: ['high','medium','low'].includes(entry.relevance) ? entry.relevance : 'unrated',
      observed_at: observedAt, evidence_status: 'UNVERIFIED_WEB_SNIPPET',
      provenance: 'context.dev/web/search'});
  }
  return { query, provider_request_id: response.request_id ?? null,
    credits_consumed: used, credits_remaining: remaining, partial: response.partial === true,
    records, status: 'COLLECTED_NOT_FACT_CHECKED' };
}

/** Never call from production or CI. For offline tests, inject a fake transport. */
export async function searchPublicEvidence({query, count=5, enabled=false,
  apiKey=process.env.CONTEXT_DEV_API_KEY, transport=globalThis.fetch,
  observedAt=new Date().toISOString()} = {}) {
  const {numResults, query:cleanQuery} = planSearch(query, count);
  if (enabled !== true) throw new Error('Live Context.dev pilot disabled');
  if (typeof apiKey !== 'string' || !apiKey.trim()) throw new Error('Own-account API key missing');
  if (typeof transport !== 'function') throw new TypeError('Missing HTTP transport');
  const reply = await transport(ENDPOINT, {method:'POST',
    headers:{'Authorization':'Bearer ' + apiKey, 'Content-Type':'application/json'},
    body:JSON.stringify({query:cleanQuery,numResults})});
  if (reply?.ok !== true) throw new Error('Context.dev request failed: HTTP ' + String(reply?.status ?? 'unknown'));
  return normalizeEvidence(await reply.json(), cleanQuery, observedAt);
}
