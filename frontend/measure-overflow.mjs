import { chromium } from 'playwright';
import { exec } from 'child_process';
import http from 'http';

const VIEWPORTS = [
  { width: 1024, height: 576, name: 'Laptop' },
  { width: 400, height: 225, name: 'Popout' }
];

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  console.log('Waiting for server...');
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => resolve(res));
        req.on('error', reject);
        req.end();
      });
      console.log('Server is up!');
      return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
}

async function run() {
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: vp });
      await page.goto('http://127.0.0.1:4193');
      await page.waitForTimeout(2000);
      
      console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      
      if (vp.width === 1024) {
        const results = await page.evaluate(() => {
          const el = document.querySelector('.betting-panel');
          if (!el) return { error: '.betting-panel not found' };
          const children = Array.from(el.children).map(child => ({
            selector: child.tagName.toLowerCase() + (child.className ? '.' + child.className.split(' ').join('.') : ''),
            cw: child.clientWidth,
            sw: child.scrollWidth,
            ow: child.offsetWidth
          }));
          return { clientWidth: el.clientWidth, scrollWidth: el.scrollWidth, children };
        });
        console.log(JSON.stringify(results, null, 2));
      } else if (vp.width === 400) {
        const results = await page.evaluate(() => {
          const setup = document.querySelector('#setup-page');
          const board = document.querySelector('#board-page');
          const getInfo = (el) => {
            if (!el) return null;
            const children = Array.from(el.children).map(child => ({
              selector: child.tagName.toLowerCase() + (child.className ? '.' + child.className.split(' ').join('.') : ''),
              ch: child.clientHeight,
              sh: child.scrollHeight,
              oh: child.offsetHeight
            }));
            return { clientHeight: el.clientHeight, scrollHeight: el.scrollHeight, children };
          };
          return { setup: getInfo(setup), board: getInfo(board) };
        });
        console.log(JSON.stringify(results, null, 2));
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

const server = exec('npx vite preview --port 4193 --host 127.0.0.1', { cwd: '.' });
server.stdout.on('data', (data) => console.log('STDOUT:', data.toString()));
server.stderr.on('data', (data) => console.error('STDERR:', data.toString()));

waitForServer('http://127.0.0.1:4193').then(async (ok) => {
  if (ok) {
    await run();
  } else {
    console.error('Server failed to start');
  }
  server.kill();
  process.exit(0);
});
