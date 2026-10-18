/** Synthetic public-looking data only. No real client, child or personal content. */
export const fixturePages = [
  {
    sourceUrl: 'https://example.org/about',
    html: `<!doctype html><html><head><title>Example Cooperative &amp; Tools</title>
    <meta name="description" content="Research equipment &amp; learning supplies"></head>
    <body><h1>Example Cooperative</h1><h2>Equipment</h2>
    <p>Educational research and public product specifications.</p>
    <a href="/catalogue">Catalogue</a><a href="https://example.net/specs?a=1&amp;b=2">Specifications</a>
    <a href="javascript:alert(1)">Unsafe</a><a href="mailto:person@example.org">Mail</a></body></html>`,
  },
  {
    sourceUrl: 'https://example.org/catalogue',
    html: `<!doctype html><html lang="zu"><head><meta property="og:title" content="Fictional catalogue">
    <meta property="og:description" content="Ukuhlola ulwazi"></head><body>
    <h1>Ikhathalogu</h1><h3>Izinsiza &amp; amathuluzi</h3>
    <a href="../about">About</a><a href="https://user:pass@bad.example">Unsafe</a>
    <a href="#overview">Overview</a></body></html>`,
  },
  {
    sourceUrl: 'https://example.org/products/sample',
    html: `<html><head><title>Sample research product</title></head><body>
    <h1>Portable classroom microscope</h1><h2>Technical data</h2>
    <ul><li>Optional 2D viewer</li><li>Specimen slides</li></ul>
    <a href="/safety">Safety notes</a><a href="data:text/html,bad">Unsafe</a></body></html>`,
  },
];
/** Fixed size reproducible variation to reduce fixture/cache artefacts. */
export function benchmarkPages(count = 450) {
  if (!Number.isInteger(count) || count < 1 || count > 2000) throw new RangeError('count must be 1..2000');
  return Array.from({length:count},(_,i)=>{
    const src=fixturePages[i%fixturePages.length];
    return {sourceUrl:src.sourceUrl+'?trial='+i,html:src.html.replace('</body>',`<p>Test page ${i}</p></body>`)};
  });
}
