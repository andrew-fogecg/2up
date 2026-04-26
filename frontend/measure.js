import { chromium } from 'playwright';

async function measure() {
  const browser = await chromium.launch();
  const contexts = [
    { width: 1024, height: 576, name: '1024x576' },
    { width: 400, height: 225, name: '400x225' },
    { width: 225, height: 400, name: '225x400' }
  ];

  for (const ctx of contexts) {
    const context = await browser.newContext({ viewport: { width: ctx.width, height: ctx.height } });
    const page = await context.newPage();
    try {
      await page.goto('http://127.0.0.1:4193/', { waitUntil: 'load' });
      process.stdout.write('\n--- Viewport: ' + ctx.name + ' ---\n');
      
      const docSize = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight
      }));
      process.stdout.write('Document: ' + docSize.width + 'x' + docSize.height + '\n');

      if (ctx.name === '1024x576') {
        const panelInfo = await page.evaluate(() => {
          const el = document.querySelector('.betting-panel');
          if (!el) return null;
          const children = Array.from(el.children).map(c => ({
            desc: c.tagName.toLowerCase() + (c.className ? '.' + c.className.split(' ').join('.') : '') + (c.id ? '#' + c.id : ''),
            cw: c.clientWidth,
            sw: c.scrollWidth,
            ow: c.offsetWidth
          })).sort((a, b) => b.ow - a.ow);
          return { cw: el.clientWidth, sw: el.scrollWidth, children };
        });
        if (panelInfo) {
          process.stdout.write('.betting-panel: clientWidth=' + panelInfo.cw + ', scrollWidth=' + panelInfo.sw + '\n');
          panelInfo.children.forEach(c => {
            process.stdout.write('  ' + c.desc + ': clientWidth=' + c.cw + ', scrollWidth=' + c.sw + ', offsetWidth=' + c.ow + '\n');
          });
        }
      } else {
        const heights = await page.evaluate(() => {
          const getHeights = (id) => {
            const el = document.querySelector(id);
            if (!el) return null;
            const children = Array.from(el.children).map(c => ({
              desc: c.tagName.toLowerCase() + (c.className ? '.' + c.className.split(' ').join('.') : '') + (c.id ? '#' + c.id : ''),
              oh: c.offsetHeight
            }));
            return { ch: el.clientHeight, sh: el.scrollHeight, children };
          };
          return {
            setup: getHeights('#setup-page'),
            board: getHeights('#board-page'),
            results: getHeights('#results-page')
          };
        });
        ['setup', 'board', 'results'].forEach(k => {
          if (heights[k]) {
            process.stdout.write('#' + k + '-page: clientHeight=' + heights[k].ch + ', scrollHeight=' + heights[k].sh + '\n');
            if (k !== 'results') {
              heights[k].children.forEach(c => {
                process.stdout.write('  ' + c.desc + ': offsetHeight=' + c.oh + '\n');
              });
            }
          }
        });
      }
    } catch (e) {
      process.stdout.write('Error measuring ' + ctx.name + ': ' + e.message + '\n');
    }
    await context.close();
  }
  await browser.close();
}
measure();
