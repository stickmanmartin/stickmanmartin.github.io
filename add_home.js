const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!['.git', 'node_modules', 'libraries'].includes(file)) {
        findHtmlFiles(filePath, fileList);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.html' || ext === '.htm') {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const htmlFiles = findHtmlFiles(__dirname);
const rootIndex = path.resolve(__dirname, 'index.html');

const homeButtonStyle = `
<!-- Global Hub Navigation -->
<style>
    .global-hub-btn {
        position: fixed;
        bottom: 25px;
        right: 25px;
        background: linear-gradient(135deg, #00f5d4 0%, #00b4d8 100%);
        color: white !important;
        text-decoration: none !important;
        padding: 14px 28px;
        border-radius: 50px;
        font-family: 'Poppins', 'Segoe UI', sans-serif;
        font-weight: 700;
        font-size: 13px;
        letter-spacing: 1.2px;
        box-shadow: 0 4px 15px rgba(0, 245, 212, 0.4);
        z-index: 1000000;
        border: 2px solid rgba(255, 255, 255, 0.6);
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex;
        align-items: center;
        text-transform: uppercase;
        cursor: pointer;
    }
    .global-hub-btn:hover {
        transform: scale(1.08) translateY(-5px);
        box-shadow: 0 12px 25px rgba(0, 245, 212, 0.5);
        background: linear-gradient(135deg, #00b4d8 0%, #00f5d4 100%);
        border-color: #fff;
    }
</style>
`;

let updatedCount = 0;

for (const file of htmlFiles) {
    if (path.resolve(file) === rootIndex) continue;

    let content = fs.readFileSync(file, 'utf-8');
    
    // Calculate path back to root
    const relativePath = path.relative(path.dirname(file), __dirname);
    const homeHref = relativePath === '' ? 'index.html' : path.join(relativePath, 'index.html').replace(/\\/g, '/');

    // 1. Cleanup all previous variations of home buttons/styles
    content = content.replace(/<a id="Home"[^>]*>.*?<\/a>/ig, '');
    content = content.replace(/<a href="[^"]*" class="global-home-btn">.*?<\/a>/ig, '');
    content = content.replace(/<a href="[^"]*" class="global-hub-btn">.*?<\/a>/ig, '');
    content = content.replace(/<a href="index.html" class="circle">Home<\/a>/ig, '');
    content = content.replace(/<!-- Unified Global Home Button -->\s*<style>[\s\S]*?<\/style>/ig, '');
    content = content.replace(/<!-- Global Hub Navigation -->\s*<style>[\s\S]*?<\/style>/ig, '');
    content = content.replace(/\.global-home-btn[^{]*\{[\s\S]*?\}/ig, '');
    content = content.replace(/\.global-hub-btn[^{]*\{[\s\S]*?\}/ig, '');
    content = content.replace(/#Home[^{]*\{[\s\S]*?\}/ig, ''); // Remove #Home CSS rules

    // 2. Insert new button
    const btnHtml = `${homeButtonStyle}\n<a href="${homeHref}" class="global-hub-btn">Back to Hub</a>\n`;
    
    if (content.match(/<\/body>/i)) {
        content = content.replace(/<\/body>/i, btnHtml + '</body>');
    } else {
        content += btnHtml;
    }

    fs.writeFileSync(file, content, 'utf-8');
    updatedCount++;
}

console.log(`Success: Unified "Back to the Hub" navigation added to ${updatedCount} project pages.`);
