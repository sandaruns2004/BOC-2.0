const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/pricing/page.tsx',
  'app/docs/page.tsx',
  'app/incident/page.tsx',
  'app/security/page.tsx',
  'app/architecture/page.tsx'
];

filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes('"use client"')) {
      content = '"use client";\n' + content;
      fs.writeFileSync(fullPath, content);
      console.log(`Added "use client" to ${file}`);
    }
  }
});
