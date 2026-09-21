const fs = require('fs');
const path = require('path');

function replaceSvgAttrs(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceSvgAttrs(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const original = content;
      content = content.replace(/stop-color=/g, 'stopColor=');
      content = content.replace(/stop-opacity=/g, 'stopOpacity=');
      content = content.replace(/stroke-dasharray=/g, 'strokeDasharray=');
      content = content.replace(/stroke-dashoffset=/g, 'strokeDashoffset=');
      
      if (original !== content) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

replaceSvgAttrs(path.join(__dirname, 'app'));
