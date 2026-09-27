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
    
    // Fix onclick="doSomething()" -> onClick={() => {}}
    content = content.replace(/onclick="[^"]*"/g, 'onClick={() => {}}');
    
    // Fix value="..." -> defaultValue="..." for inputs in these static pages
    content = content.replace(/ value="/g, ' defaultValue="');

    fs.writeFileSync(fullPath, content);
    console.log(`Fixed React warnings in ${file}`);
  }
});
