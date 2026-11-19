const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dir = __dirname;
const srv = http.createServer((q, s) => { const f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); s.end(b); }); }).listen(0, async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 360, height: 1130 } });
  p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://localhost:${srv.address().port}/index.html`); await p.waitForFunction('window.ready', null, { timeout: 20000 });
  for (const a of [0, 45, 90, 180, 270]) { await p.evaluate(a => view(a), a); await p.locator('canvas').screenshot({ path: `${dir}/render_${a}.png` }); }
  await b.close(); srv.close();
});
