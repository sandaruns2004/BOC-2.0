const fs = require('fs');
const html = fs.readFileSync('../ui/AgentForge_-_AI_Agent_Platform.html', 'utf8');
const match = html.match(/<script id="tailwind-config">([\s\S]*?)<\/script>/);
if (match) {
  const str = match[1].replace('tailwind.config = ', '').trim();
  const obj = new Function('return ' + str)();
  const fsizes = obj.theme.extend.fontSize || {};
  let css = '\n/* Custom Typography */\n';
  
  // Custom font size utilities
  for (const [k, v] of Object.entries(fsizes)) {
    css += `.text-${k} { font-size: ${v[0]};`;
    if (v[1]) {
      if (v[1].lineHeight) css += ` line-height: ${v[1].lineHeight};`;
      if (v[1].letterSpacing) css += ` letter-spacing: ${v[1].letterSpacing};`;
      if (v[1].fontWeight) css += ` font-weight: ${v[1].fontWeight};`;
    }
    css += ' }\n';
  }
  
  // Custom shadow utilities
  const boxShadow = obj.theme.extend.boxShadow || {};
  for (const [k, v] of Object.entries(boxShadow)) {
    css += `.shadow-${k} { box-shadow: ${v}; }\n`;
  }
  
  fs.appendFileSync('app/globals.css', css);
  console.log('Appended typography and shadows to globals.css');
}
