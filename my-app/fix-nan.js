const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'app/demo/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Fix rendering of NaN for totalDurationMs
content = content.replace(/{lastMeta\.totalDurationMs}ms/g, '{String(lastMeta.totalDurationMs || 0)}ms');

// Fix rendering of NaN for step.durationMs
content = content.replace(/{step\.durationMs}ms/g, '{String(step.durationMs || 0)}ms');

fs.writeFileSync(file, content);
console.log('Fixed NaN render warnings in app/demo/page.tsx');
