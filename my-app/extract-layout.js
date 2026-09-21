const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'app');
let headerContent = '';
let footerContent = '';

// Read page.tsx to extract header and footer
const pageTsxPath = path.join(appDir, 'page.tsx');
const pageContent = fs.readFileSync(pageTsxPath, 'utf8');

const headerMatch = pageContent.match(/<header[\s\S]*?<\/header>/);
if (headerMatch) {
  headerContent = headerMatch[0];
}

const footerMatch = pageContent.match(/<footer[\s\S]*?<\/footer>/);
if (footerMatch) {
  footerContent = footerMatch[0];
}

// Update layout.tsx
const layoutPath = path.join(appDir, 'layout.tsx');
let layoutContent = fs.readFileSync(layoutPath, 'utf8');

// Replace children with header + children + footer
if (!layoutContent.includes('<header')) {
  layoutContent = layoutContent.replace(
    /\{children\}/,
    `      ${headerContent}
        {children}
        ${footerContent}`
  );
  fs.writeFileSync(layoutPath, layoutContent, 'utf8');
  console.log('Updated layout.tsx');
}

// Remove header and footer from all pages
function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') && fullPath !== layoutPath) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      
      content = content.replace(/<header[\s\S]*?<\/header>/g, '');
      content = content.replace(/<footer[\s\S]*?<\/footer>/g, '');
      
      // Also remove those weird duplicate global styles and inline-defs at the top of pages since they can go in layout
      content = content.replace(/<style dangerouslySetInnerHTML=\{\{ __html: `.*?` \}\} \/>/g, '');
      content = content.replace(/<svg className="inline-defs-container"[\s\S]*?<\/svg>/g, '');
      
      if (original !== content) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Removed header/footer from ${fullPath}`);
      }
    }
  }
}

processDir(appDir);
