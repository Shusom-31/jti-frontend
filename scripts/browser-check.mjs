// Local browser smoke checks using the installed Edge and the Chrome DevTools Protocol.
// No browser package or browser download is needed. The script owns and stops its processes.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import { connectCdpSocket } from './cdp-socket.mjs';

const workspace = process.cwd();
const artifacts = resolve(process.env.BP_QA_DIR || '.qa');
const browserPath = process.env.BP_BROWSER || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
if (!existsSync(browserPath)) throw new Error('Set BP_BROWSER to a local Chromium or Edge executable.');
await mkdir(artifacts, { recursive: true });
const devPort = 5178, debugPort = 9237;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(devPort), '--strictPort'], { cwd: workspace, stdio: 'ignore', windowsHide: true });
let browser;
let socket;
const passed = [];
const exceptions = [];
let diagnostic;
let failureScreenshot;
async function until(predicate, message, timeout = 18000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try { const value = await predicate(); if (value) return value; } catch { /* The page can be navigating. */ }
    await delay(100);
  }
  throw new Error(message);
}
try {
  await until(async () => (await fetch(`http://127.0.0.1:${devPort}`)).ok, 'Local preview failed to start.');
  console.log('Local preview ready.');
  browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--disable-extensions', '--disable-background-networking', '--disable-component-update', '--no-first-run', '--no-default-browser-check', '--renderer-process-limit=1', '--js-flags=--max-old-space-size=128', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${join(artifacts, 'edge-profile')}`, '--window-size=1440,1000', 'about:blank'], { stdio: 'ignore', windowsHide: true });
  await until(async () => (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).ok, 'Local browser did not start.');
  const target = await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' })).json();
  console.log('Local browser target ready.');
  socket = await connectCdpSocket(target.webSocketDebuggerUrl);
  console.log('Browser debugging connected.');
  let id = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(String(event.data));
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
    if (message.id && pending.has(message.id)) {
      const promise = pending.get(message.id); pending.delete(message.id); clearTimeout(promise.timer);
      if (message.error) promise.reject(new Error(message.error.message)); else promise.resolve(message.result);
    }
  };
  socket.onclose = () => { for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(new Error('The browser debugging connection closed.')); } pending.clear(); };
  function cdp(method, params = {}) { return new Promise((resolve, reject) => { const callId = ++id; const timer = setTimeout(() => { pending.delete(callId); reject(new Error(`Browser command timed out: ${method}`)); }, 12000); pending.set(callId, { resolve, reject, timer }); socket.send(JSON.stringify({ id: callId, method, params })); }); }
  async function evaluate(expression) {
    const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }
  async function wait(expression, message) { return until(() => evaluate(`Boolean(${expression})`), message); }
  async function clickText(text) { await evaluate(`(()=>{const el=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(${JSON.stringify(text)}));if(!el)throw Error('Button unavailable');el.click();return true})()`); }
  async function navigate(path) { await cdp('Page.navigate', { url: `http://127.0.0.1:${devPort}${path}` }); await wait("document.querySelector('h1') && !document.querySelector('.skeleton-stack')", 'Page did not render.'); }
  async function setField(selector, value, select = false) {
    await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Field unavailable');Object.getOwnPropertyDescriptor(${select ? 'HTMLSelectElement' : 'HTMLInputElement'}.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('${select ? 'change' : 'input'}',{bubbles:true}));return true})()`);
  }
  async function screenshot(name) { const image = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); await writeFile(join(artifacts, name), Buffer.from(image.data, 'base64')); }
  diagnostic = () => evaluate("({path:location.pathname,search:location.search,title:document.title,heading:document.querySelector('h1')?.textContent,body:document.body.innerText.slice(0,300)})");
  failureScreenshot = () => screenshot('failure.png');
  await cdp('Runtime.enable'); await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate('/directory?month=2026-10&organization=sky&metric=leavers');
  await wait("location.pathname==='/login' && document.querySelector('form')", 'Protected route did not redirect to login.');
  await screenshot('login-desktop.png');
  await evaluate("document.querySelector('form').requestSubmit()");
  await wait("document.querySelector('#email-error') && document.querySelector('#password-error')", 'Required field validation failed.');
  assert.ok(await evaluate("!document.querySelector('.demo-credentials') && !/SIGN-IN DETAILS|admin@bp.demo|Demo@2026/.test(document.body.innerText)"));
  assert.ok(await evaluate("document.querySelector('.login-copyright').textContent.includes('Powered by Upscalebd Ltd.') && document.querySelector('.login-story .brand').textContent.includes('JTI Workforce')"));
  await clickText('Quick sign in');
  await wait("location.pathname==='/directory' && document.querySelector('.table-summary')", 'Login failed to restore intended directory.');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('metric')"), 'leavers');
  assert.ok(await evaluate("(()=>{const s=JSON.parse(sessionStorage.getItem('bp-demo-session'));return s.email.startsWith('visitor-') && s.email.endsWith('@jti.workforce') && s.expiresAt>Date.now() && s.canRevealNid===false})()"));
  passed.push('Guarded login, inline validation, credential-free quick access and intended destination');
  await navigate('/?month=2026-10');
  assert.equal(await evaluate("document.querySelectorAll('.kpi-card').length"), 4);
  assert.equal(await evaluate("document.querySelectorAll('.organization-card').length"), 3);
  const activeCount = await evaluate("Number(document.querySelector('.kpi-card .kpi-value').textContent)");
  const monthlyScopeCount = await evaluate("Number(document.querySelector('.filter-top .muted').textContent.split(' ')[0])");
  await screenshot('overview-desktop.png');
  await evaluate("document.querySelector('.kpi-card').click()");
  await wait("location.pathname==='/organizations' && document.querySelector('.combined-organization-workspace .table-summary')", 'Active drilldown did not open in Organizations.');
  assert.equal(await evaluate("Number(document.querySelector('.table-summary strong').textContent)"), activeCount);
  await evaluate("document.querySelector('tbody .employee-link').focus(); document.querySelector('tbody .employee-link').click()");
  await wait("document.querySelector('dialog[open]')", 'Profile did not open.');
  assert.ok(await evaluate("document.querySelector('.profile-fields').textContent.includes('Login ID')"));
  await evaluate("document.querySelector('[aria-label=\"Close profile\"]').click()");
  await wait("!document.querySelector('dialog')", 'Profile did not close.');
  assert.ok(await evaluate("document.activeElement.classList.contains('employee-link')"));
  await evaluate("document.querySelector('[aria-label=\"Next page\"]').click()");
  await wait("new URLSearchParams(location.search).get('page')==='2'", 'Pagination failed.');
  await evaluate("document.querySelector('tbody .employee-link').focus(); document.querySelector('tbody .employee-link').click()");
  await wait("document.querySelector('dialog[open]')", 'Profile on second page did not open.');
  await evaluate("document.querySelector('[aria-label=\"Close profile\"]').click()");
  assert.equal(await evaluate("new URLSearchParams(location.search).get('page')"), '2');
  passed.push('KPI drilldown count, full-set pagination, profile state and focus restoration');
  await navigate('/organizations?month=2026-09&organization=sky');
  assert.equal(await evaluate("document.querySelector('input[type=month]').value"), '2026-09');
  await evaluate("(()=>{const el=[...document.querySelectorAll('.field')].find(l=>l.querySelector('span')?.textContent==='Region').querySelector('select');el.value='Mymensingh';el.dispatchEvent(new Event('change',{bubbles:true}))})()");
  await wait("new URLSearchParams(location.search).get('region')==='Mymensingh'", 'Region filter did not update.');
  await evaluate("(()=>{const el=[...document.querySelectorAll('.field')].find(l=>l.querySelector('span')?.textContent==='Area').querySelector('select');el.value='Sylhet';el.dispatchEvent(new Event('change',{bubbles:true}))})()");
  await wait("new URLSearchParams(location.search).get('area')==='Sylhet'", 'Area filter did not update.');
  await evaluate("(()=>{const el=[...document.querySelectorAll('.field')].find(l=>l.querySelector('span')?.textContent==='Type').querySelector('select');el.value='Campaign';el.dispatchEvent(new Event('change',{bubbles:true}))})()");
  await wait("new URLSearchParams(location.search).get('type')==='Campaign'", 'Type filter did not update.');
  assert.ok(await evaluate("location.search.includes('region=Mymensingh') && location.search.includes('area=Sylhet') && location.search.includes('type=Campaign')"), 'AND filters were not retained together');
  await screenshot('organization-desktop.png');
  await evaluate("(()=>{const el=[...document.querySelectorAll('.field')].find(l=>l.querySelector('span')?.textContent==='Region').querySelector('select');el.value='Dhaka';el.dispatchEvent(new Event('change',{bubbles:true}))})()");
  await wait("new URLSearchParams(location.search).get('region')==='Dhaka'", 'Changed region did not update.');
  assert.ok(await evaluate("!new URLSearchParams(location.search).has('area')"), 'Incompatible area was not cleared');
  await cdp('Page.navigate', { url: `http://127.0.0.1:${devPort}/movement?month=2026-10&organization=sky&department=Sales&designation=Manager` });
  await wait("document.querySelector('.monthly-movement tbody tr') && !new URLSearchParams(location.search).has('department') && !new URLSearchParams(location.search).has('designation')", 'Movement screen or legacy filter cleanup did not render.');
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.monthly-movement thead th')].map(s=>s.textContent)"), ['Month', 'Active employees', 'Joiners', 'Leavers', 'Attrition']);
  assert.ok(await evaluate("![...document.querySelectorAll('.filter-panel .field>span')].some(s=>['Department','Designation'].includes(s.textContent)) && !document.querySelector('.waterfall') && ![...document.querySelectorAll('h2')].some(h=>h.textContent==='Why employees leave')"), 'Removed movement controls or panels are still visible.');
  await evaluate("document.querySelector('.monthly-movement tbody tr:first-child td:nth-child(4) button').click()");
  await wait("location.pathname==='/organizations' && document.querySelector('.organization-employees .table-summary')", 'Movement leavers did not open in Organizations.');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('metric')"), 'leavers');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('organization')"), 'sky');
  passed.push('Reporting month, AND filters, dependent reset and scoped movement drilldowns');
  await navigate('/organizations?month=2026-10');
  assert.equal(await evaluate("document.querySelectorAll('.organization-card').length"), 3);
  await evaluate("document.querySelector('.organization-card').click()");
  await wait("document.querySelector('.organization-employees') && document.querySelector('.location-breadcrumb')", 'Organization employees did not open inline.');
  assert.ok(await evaluate("!document.querySelector('.organization-workspace .charts-grid,.organization-workspace .line-chart')"));
  assert.ok(await evaluate("![...document.querySelectorAll('.filter-panel .field>span')].some(s=>['Organization','Department','Designation'].includes(s.textContent))"));
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.organization-employees th')].slice(0,6).map(s=>s.textContent)"), ['Employee', 'Employee ID', 'Login ID', 'Joining date', 'Resignation / exit date', 'Status']);
  const organizationAll = await evaluate("Number(document.querySelector('.organization-employees .table-summary strong').textContent)");
  const organizationJoiners = await evaluate("Number(document.querySelectorAll('.kpi-card')[1].querySelector('.kpi-value').textContent)");
  await evaluate("document.querySelectorAll('.kpi-card')[1].click()");
  await wait("location.pathname==='/organizations' && new URLSearchParams(location.search).get('metric')==='joiners' && document.querySelector('.organization-employee-views .selected').textContent==='Joiners'", 'Joiners left the organization workspace.');
  assert.equal(await evaluate("Number(document.querySelector('.organization-employees .table-summary strong').textContent)"), organizationJoiners);
  const organizationLeavers = await evaluate("Number(document.querySelectorAll('.kpi-card')[2].querySelector('.kpi-value').textContent)");
  await evaluate("document.querySelectorAll('.kpi-card')[2].click()");
  await wait("new URLSearchParams(location.search).get('metric')==='leavers' && document.querySelector('.organization-employee-views .selected').textContent==='Leavers'", 'Leavers were not shown inline.');
  assert.equal(await evaluate("Number(document.querySelector('.organization-employees .table-summary strong').textContent)"), organizationLeavers);
  assert.ok(await evaluate("[...document.querySelectorAll('.organization-employees tbody tr')].every(r=>r.cells[4].textContent.includes('Oct 2026') && r.cells[5].textContent.includes('Left'))"));
  await evaluate("document.querySelectorAll('.kpi-card')[3].click()");
  assert.equal(await evaluate('location.pathname'), '/organizations');
  await evaluate("document.querySelector('.organization-employees tbody .employee-link').focus();document.querySelector('.organization-employees tbody .employee-link').click()");
  await wait("document.querySelector('dialog[open]')", 'Inline organization profile did not open.');
  await evaluate("document.querySelector('[aria-label=\"Close profile\"]').click()");
  await wait("!document.querySelector('dialog')", 'Inline organization profile did not close.');
  assert.equal(await evaluate('location.pathname'), '/organizations');
  const employeeId = await evaluate("document.querySelector('.organization-employees tbody tr').cells[1].textContent");
  await setField('[aria-label="Search organization employees"]', employeeId);
  await wait("Number(document.querySelector('.organization-employees .table-summary strong').textContent)===1", 'Inline organization search failed.');
  await clickText('Clear all');
  await wait("new URLSearchParams(location.search).get('organization')==='sky' && !new URLSearchParams(location.search).has('q') && !new URLSearchParams(location.search).has('metric')", 'Clear all did not preserve the selected organization.');
  await wait(`Number(document.querySelector('.organization-employees .table-summary strong').textContent)===${organizationAll}`, 'Clear all did not restore organization employees.');
  await evaluate("document.querySelector('.location-breadcrumb').nextElementSibling.querySelector('tbody tr td:nth-child(4) button').click()");
  await wait("location.pathname==='/organizations' && new URLSearchParams(location.search).get('metric')==='leavers' && new URLSearchParams(location.search).has('region')", 'Location leavers left the organization workspace.');
  await navigate('/organizations?month=2026-10&period=all&organization=sky&department=unavailable&designation=unavailable');
  await wait("document.querySelector('.organization-employees') && !new URLSearchParams(location.search).has('department') && !new URLSearchParams(location.search).has('designation')", 'Removed filters still constrained the organization.');
  assert.ok(await evaluate(`Number(document.querySelector('.organization-employees .table-summary strong').textContent)>${organizationAll}`));
  await screenshot('organization-inline-desktop.png');
  await evaluate("document.querySelector('.organization-employees [aria-label=\"Next page\"]').click()");
  await wait("new URLSearchParams(location.search).get('page')==='2'", 'Inline organization pagination failed.');
  await evaluate("document.querySelector('.organization-employees tbody .employee-link').focus();document.querySelector('.organization-employees tbody .employee-link').click()");
  await wait("document.querySelector('dialog[open]')", 'Inline profile on page 2 did not open.');
  await evaluate("document.querySelector('[aria-label=\"Close profile\"]').click()");
  await wait("!document.querySelector('dialog')", 'Inline profile on page 2 did not close.');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('page')"), '2');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await delay(200);
  assert.ok(await evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"));
  await evaluate('window.scrollTo(0,0)');
  await screenshot('organization-inline-mobile.png');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  passed.push('Inline organization employees, reduced filters, removed graphs, in-place KPI/location results, search, profiles, pagination and mobile');
  await navigate('/retention?month=2026-10');
  await wait("document.querySelector('.heatmap') && document.querySelector('.cohort-table')", 'Retention charts failed.');
  assert.ok(await evaluate("document.querySelector('.cohort-table').textContent.includes('Not yet observed')"));
  await screenshot('retention-desktop.png');
  await navigate('/switches?month=2026-10');
  await wait("document.querySelector('.matrix') && document.querySelector('.switch-nid')", 'Switch screen did not render.');
  assert.ok(await evaluate("document.querySelector('.employee-table').textContent.includes('••••••')"));
  const demoNid = `0028${String(100200).padStart(9, '0')}`;
  await setField('#switch-nid', demoNid);
  await evaluate("document.querySelector('.switch-nid').requestSubmit()");
  await wait("document.querySelector('.timeline') && document.querySelector('.identity-match')", 'NID history did not load.');
  assert.ok(await evaluate("document.querySelectorAll('.timeline-node').length>=2"));
  assert.ok(!await evaluate(`location.href.includes(${JSON.stringify(demoNid)}) || JSON.stringify(sessionStorage).includes(${JSON.stringify(demoNid)}) || JSON.stringify(localStorage).includes(${JSON.stringify(demoNid)})`));
  await screenshot('switches-desktop.png');
  passed.push('Cohort observation limits, territory heatmap, masked NID lookup and full person history');
  await navigate('/?month=2026-10');
  assert.ok(await evaluate("document.title.includes('JTI Workforce') && document.querySelector('.sidebar .brand').textContent.includes('JTI Workforce')"));
  assert.ok(await evaluate("document.querySelector('.footer').textContent.includes('Powered by Upscalebd Ltd.')"));
  assert.ok(await evaluate("!document.querySelector('.sidebar-note,.workspace-label,.footer select')"));
  assert.ok(await evaluate("!/Agency scorecard|All values are demo|Demo data|DEMO NAME|Workspace guide|A little context goes a long way/i.test(document.body.innerText)"));
  assert.ok(await evaluate("getComputedStyle(document.querySelector('.sidebar')).backgroundImage.includes('18, 61, 53')"));
  passed.push('JTI Workforce branding, dark sidebar and requested content removal');
  await clickText('Full data');
  await wait("new URLSearchParams(location.search).get('period')==='all' && document.querySelector('.period-toggle button[aria-pressed=\"true\"]').textContent==='Full data'", 'Full data did not become active.');
  await wait("document.querySelectorAll('.kpi-card')[1].textContent.includes('full history')", 'Full history KPI labels did not update.');
  assert.ok(await evaluate("!document.querySelector('input[type=month]') && document.querySelector('.period-control').textContent.includes('2025') && document.querySelector('.period-control').textContent.includes('2026')"));
  const allJoiners = await evaluate("Number(document.querySelectorAll('.kpi-card')[1].querySelector('.kpi-value').textContent)");
  assert.ok(allJoiners > 24);
  await screenshot('overview-full-data-desktop.png');
  await evaluate("document.querySelectorAll('.kpi-card')[1].click()");
  await wait("location.pathname==='/organizations' && document.querySelector('.combined-organization-workspace .table-summary')", 'Full data joiners did not open in Organizations.');
  assert.equal(await evaluate("Number(document.querySelector('.table-summary strong').textContent)"), allJoiners);
  assert.equal(await evaluate("new URLSearchParams(location.search).get('period')"), 'all');
  await evaluate('history.back()');
  await wait("location.pathname==='/' && document.querySelector('.organization-card') && document.querySelector('.period-toggle button[aria-pressed=\"true\"]').textContent==='Full data'", 'Back did not restore Full data.');
  await evaluate("document.querySelector('.organization-card').click()");
  await wait("location.pathname==='/organizations' && document.querySelector('.location-breadcrumb')", 'Full data agency did not open.');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('period')"), 'all');
  await evaluate("document.querySelector('.location-breadcrumb').nextElementSibling.querySelector('tbody a').click()");
  await wait("new URLSearchParams(location.search).has('region')", 'Location drilldown did not open.');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('period')"), 'all');
  passed.push('Full data KPI/list consistency, organization and location scope, and browser Back');

  await navigate('/directory?month=2026-10&period=all');
  await wait("document.querySelector('.table-summary')", 'Full data directory did not render.');
  const allRecords = await evaluate("Number(document.querySelector('.table-summary strong').textContent)");
  assert.equal(allRecords, 205);
  // Intercept the CSV anchor so the check does not write to the user's Downloads folder.
  await evaluate("(()=>{const original=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download){window.__fullExport={name:this.download};fetch(this.href).then(r=>r.text()).then(text=>{window.__fullExport.text=text});HTMLAnchorElement.prototype.click=original}else original.call(this)};[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Export CSV')).click()})()");
  await wait("Boolean(window.__fullExport?.text)", 'Full data CSV export was not generated.');
  assert.ok(await evaluate("window.__fullExport.name.includes('full-data-2025-10-01-2026-10-28')"));
  assert.equal(await evaluate("window.__fullExport.text.split('\\r\\n').length"), allRecords + 1);
  await clickText('Monthly');
  await wait("new URLSearchParams(location.search).get('period')==='monthly' && document.querySelector('input[type=month]')", 'Monthly view was not restored.');
  await wait(`Number(document.querySelector('.table-summary strong').textContent)<${allRecords}`, 'Monthly directory still included all historical records.');
  assert.equal(await evaluate("Number(document.querySelector('.table-summary strong').textContent)"), monthlyScopeCount);
  passed.push('Full data directory includes historical assignments and complete CSV; Monthly restores interval scope');

  await navigate('/movement?month=2026-10&period=all');
  await wait("document.querySelector('.monthly-movement')", 'Full data movement did not render.');
  assert.equal(await evaluate("document.querySelectorAll('.monthly-movement tbody tr').length"), 13);
  assert.ok(await evaluate("document.querySelector('.monthly-movement').textContent.includes('Oct 2025') && document.querySelector('.monthly-movement').textContent.includes('Oct 2026')"));
  await evaluate("document.querySelector('.monthly-movement tbody tr:last-child td:nth-child(3) button').click()");
  await wait("location.pathname==='/organizations' && document.querySelector('.combined-organization-workspace .table-summary')", 'Historical month drilldown did not open in Organizations.');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('period')"), 'monthly');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('month')"), '2025-10');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('metric')"), 'joiners');
  await navigate('/retention?month=2026-10&period=all');
  await wait("document.querySelector('.cohort-table') && document.querySelector('.heatmap')", 'Full history retention did not render.');
  assert.equal(await evaluate("document.querySelectorAll('.cohort-table tbody tr').length"), 13);
  assert.equal(await evaluate("document.querySelectorAll('.cohort-table thead th').length"), 15);
  assert.equal(await evaluate("document.querySelectorAll('.heatmap thead th').length"), 14);
  await screenshot('retention-full-data-desktop.png');
  await evaluate("document.querySelector('.heatmap tbody button:not(:disabled)').click()");
  await wait("location.pathname==='/organizations' && document.querySelector('.combined-organization-workspace .table-summary')", 'Full history heatmap month did not open in Organizations.');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('period')"), 'monthly');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('metric')"), 'leavers');
  await navigate('/switches?month=2026-10&period=all');
  await wait("document.querySelector('.employee-table')", 'Full history agency movements did not render.');
  assert.ok(await evaluate("Number(document.querySelector('.count-badge').textContent)>10"));
  await evaluate("document.querySelector('a.nav-link[href^=\"/?\"]').click()");
  await wait("location.pathname==='/' && document.querySelector('.kpi-grid')", 'Sidebar did not return to overview.');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('period')"), 'all');
  passed.push('All available months, cohort/heatmap expansion, exact monthly drilldowns and full agency switch history');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await delay(200);
  assert.ok(await evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"));
  await evaluate("document.querySelector('[aria-label=\"Open navigation\"]').click()");
  await wait("document.querySelector('.sidebar.open')", 'Mobile menu did not open.');
  await evaluate("document.querySelector('[aria-label=\"Close menu\"]').click()");
  await screenshot('overview-mobile.png');
  passed.push('Mobile width, wrapped cards and collapsible navigation');
  assert.deepEqual(exceptions, [], 'Browser runtime exceptions were reported.');
  console.log(JSON.stringify({ passed, runtimeExceptions: exceptions.length, screenshots: artifacts }, null, 2));
} catch (error) {
  console.error(`Browser checks failed: ${error.message}`);
  console.error(`Completed groups: ${passed.join('; ')}`);
  try { if (diagnostic) console.error(JSON.stringify(await diagnostic())); if (failureScreenshot) await failureScreenshot(); } catch {}
  process.exitCode = 1;
} finally {
  if (socket?.readyState === 1) { try { socket.send(JSON.stringify({ id: 999999, method: 'Browser.close' })); } catch {} socket.close(); }
  browser?.kill(); server.kill();
}

