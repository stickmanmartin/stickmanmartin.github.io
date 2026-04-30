const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory() && !filePath.includes('.git') && !filePath.includes('node_modules')) {
      findHtmlFiles(filePath, fileList);
    } else if (filePath.endsWith('.html') || filePath.endsWith('.htm')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const htmlFiles = findHtmlFiles(__dirname);
const rootIndex = path.join(__dirname, 'index.html');

const homeButtonStyle = `
<!-- Unified Global Home Button -->
<style>
    .global-home-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff0055 0%, #ff4d88 100%);
        color: white !important;
        text-decoration: none !important;
        padding: 12px 24px;
        border-radius: 50px;
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-weight: 800;
        font-size: 14px;
        letter-spacing: 1px;
        box-shadow: 0 4px 15px rgba(255, 0, 85, 0.4);
        z-index: 999999;
        border: 2px solid #fff;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        text-transform: uppercase;
    }
    .global-home-btn:hover {
        transform: scale(1.1) translateY(-3px);
        box-shadow: 0 6px 20px rgba(255, 0, 85, 0.6);
        filter: brightness(1.1);
    }
    .global-home-btn:active {
        transform: scale(0.95);
    }
</style>
`;

let updatedCount = 0;

for (const file of htmlFiles) {
    // Skip the main index page
    if (path.normalize(file) === path.normalize(rootIndex)) continue;

    let content = fs.readFileSync(file, 'utf-8');
    
    // Calculate path back to root index.html
    const relativePath = path.relative(path.dirname(file), __dirname);
    const homeHref = relativePath === '' ? 'index.html' : path.join(relativePath, 'index.html').replace(/\\/g, '/');

    // 1. Remove ANY existing home buttons (old IDs or previous global ones)
    content = content.replace(/<a id="Home"[^>]*>.*?<\/a>/ig, '');
    content = content.replace(/<a href="[^"]*" class="global-home-btn">.*?<\/a>/ig, '');
    
    // 2. Remove old style tags from previous runs
    content = content.replace(/<style>\s*\/\* Unified Global Home Button \*\/[\s\S]*?<\/style>/ig, '');
    // Also remove the one with the comment I just added
    content = content.replace(/<!-- Unified Global Home Button -->\s*<style>[\s\S]*?<\/style>/ig, '');

    // 3. Inject new button before </body>
    if (content.match(/<\/body>/i)) {
        const newButtonHtml = `${homeButtonStyle}\n<a href="${homeHref}" class="global-home-btn">🏠 BACK TO HUB</a>\n`;
        content = content.replace(/<\/body>/i, newButtonHtml + '</body>');
        fs.writeFileSync(file, content, 'utf-8');
        updatedCount++;
    }
}

console.log(`Mission Complete: ${updatedCount} pages now linked to Hub.`);
