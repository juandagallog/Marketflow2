// Ejecutar: node tests/run-browser.cjs 390 (o 1366).
// Usa Chrome instalado y DevTools/WebSocket de Node; no instala dependencias.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const width = Number(process.argv[2] || 1366);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'papel-luna-test-'));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const chrome = path.join(process.env.ProgramFiles || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace('<head>', `<head><base href="${pathToFileURL(root + path.sep).href}">`)
  .replace('<script src="js/api.js" defer></script>', '<script src="tests/browser-post-mvp2.js"></script><script src="js/api.js" defer></script>');
const fixture = path.join(temp, 'preview.html'); fs.writeFileSync(fixture, html);
const browser = spawn(chrome, ['--headless', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${temp}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws;
(async () => {
  const portFile = path.join(temp, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(50);
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  let sequence = 0; const pending = new Map();
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    const task = pending.get(message.id);
    if (task) { pending.delete(message.id); message.error ? task.reject(Error(JSON.stringify(message.error))) : task.resolve(message.result); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
  });
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
  await send('Page.navigate', { url: pathToFileURL(fixture).href });
  let result;
  for (let i = 0; i < 400; i++) {
    const evaluated = await send('Runtime.evaluate', { expression: 'JSON.stringify({status:document.body?.dataset.prueba,error:document.body?.dataset.errorPrueba,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight})', returnByValue: true });
    result = JSON.parse(evaluated.result.value || '{}');
    if (result.status) break;
    await sleep(50);
  }
  if (result.status !== 'PASS' || result.width !== width) throw Error(JSON.stringify(result));
  const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: result.height, scale: 1 } });
  const screenshot = path.join(temp, `compras-${width}.png`); fs.writeFileSync(screenshot, Buffer.from(image.data, 'base64'));
  console.log(JSON.stringify({ ...result, screenshot }));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { if (ws) ws.close(); browser.kill(); });
