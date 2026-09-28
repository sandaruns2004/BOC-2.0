const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'app/demo/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Fix rendering of NaN for token addition
content = content.replace(/{lastMeta\.promptTokens \+ lastMeta\.completionTokens}/g, '{String((lastMeta.promptTokens || 0) + (lastMeta.completionTokens || 0))}');

fs.writeFileSync(file, content);
console.log('Fixed token NaN warning in app/demo/page.tsx');
