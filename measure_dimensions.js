const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch();
  
  const viewports = [
    {
      width: 1024,
      height: 576,
      selectors: ['.betting-panel', '.voyage-log-panel', '#play-btn']
    },
    {
      width: 400,
      height: 225,
      selectors: ['#setup-page', '#board-page', '#results-page', '#play-btn']
    }
  ];

  for (const vp of viewports) {
    console.log(\`--- Viewport: \${vp.width}x\${vp.height} ---\`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }
    });
    const page = await context.newPage();
    
    // Using localhost:4193 as per instructions
    try {
      await page.goto('http://localhost:4193', { waitUntil: 'networkidle' });
      
      for (const selector of vp.selectors) {
        const results = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          return {
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            vOverflow: el.scrollHeight > el.clientHeight,
            hOverflow: el.scrollWidth > el.clientWidth
          };
        }, selector);

        if (results) {
          console.log(\`\${selector}:\`);
          console.log(\`  Dimensions: \${results.scrollWidth}x\${results.scrollHeight} (Scroll) / \${results.clientWidth}x\${results.clientHeight} (Client)\`);
          console.log(\`  Overflow: Vertical: \${results.vOverflow}, Horizontal: \${results.hOverflow}\`);
        } else {
          console.log(\`\${selector}: Not found\`);
        }
      }
    } catch (e) {
      console.log(\`Error loading page: \${e.message}\`);
    }
    await context.close();
  }
  await browser.close();
}

run();
