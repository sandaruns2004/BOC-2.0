const fs = require('fs');
const path = require('path');

const uiDir = path.join(__dirname, '../ui');
const appDir = path.join(__dirname, 'app');

const files = [
  { file: 'AgentForge_-_AI_Agent_Platform.html', route: 'page.tsx', isRoot: true },
  { file: 'AgentForge_-_Live_Demo_and_Trace_Console.html', route: 'demo/page.tsx' },
  { file: 'AgentForge_-_Agent_Studio.html', route: 'studio/page.tsx' },
  { file: 'AgentForge_-_Architecture_and_Pipeline.html', route: 'architecture/page.tsx' },
  { file: 'AgentForge_-_Docs_and_SDK_Reference.html', route: 'docs/page.tsx' },
  { file: 'AgentForge_-_Execution_Replay.html', route: 'replay/page.tsx' },
  { file: 'AgentForge_-_Human_Escalation_Queue.html', route: 'escalation/page.tsx' },
  { file: 'AgentForge_-_Launch_Console.html', route: 'launch/page.tsx' },
  { file: 'AgentForge_-_Pillars_and_Security.html', route: 'security/page.tsx' },
  { file: 'AgentForge_-_Pricing_and_Economics.html', route: 'pricing/page.tsx' },
  { file: 'AgentForge_-_Security_Incident.html', route: 'incident/page.tsx' },
  { file: 'Shader.html', route: 'shader/page.tsx' }
];

function convertHtmlToJsxV2(html) {
  let jsx = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
  if (!jsx) {
     jsx = html;
  }

  jsx = jsx.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove scripts, titles, meta, and link tags entirely as they cause React errors 
  // or belong in layout.tsx/metadata.
  jsx = jsx.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  jsx = jsx.replace(/<title\b[^<]*(?:(?!<\/title>)<[^<]*)*<\/title>/gi, '');
  jsx = jsx.replace(/<meta([^>]*?)>/gi, '');
  jsx = jsx.replace(/<link([^>]*?)>/gi, '');
  
  const protectedBlocks = [];
  
  jsx = jsx.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (match, attrs, content) => {
    const escaped = content.replace(/`/g, '\\`').replace(/\$/g, '\\$');
    protectedBlocks.push(`<style${attrs} dangerouslySetInnerHTML={{ __html: \`${escaped}\` }} />`);
    return `___BLOCK_${protectedBlocks.length - 1}___`;
  });

  jsx = jsx.replace(/([{}])/g, (match) => {
    return match === '{' ? '{"{"}' : '{"}"}';
  });

  jsx = jsx.replace(/class=/g, 'className=');
  jsx = jsx.replace(/for=/g, 'htmlFor=');
  jsx = jsx.replace(/stroke-width=/g, 'strokeWidth=');
  jsx = jsx.replace(/stroke-linecap=/g, 'strokeLinecap=');
  jsx = jsx.replace(/stroke-linejoin=/g, 'strokeLinejoin=');
  jsx = jsx.replace(/clip-rule=/g, 'clipRule=');
  jsx = jsx.replace(/fill-rule=/g, 'fillRule=');
  jsx = jsx.replace(/xmlns:xlink=/g, 'xmlnsXlink=');
  jsx = jsx.replace(/tabindex=/g, 'tabIndex=');
  jsx = jsx.replace(/readonly=/g, 'readOnly=');
  jsx = jsx.replace(/autoplay=/g, 'autoPlay=');
  jsx = jsx.replace(/playsinline=/g, 'playsInline=');
  jsx = jsx.replace(/srcset=/g, 'srcSet=');
  jsx = jsx.replace(/viewbox=/g, 'viewBox=');
  
  jsx = jsx.replace(/<img([^>]*?)(?<!\/)>/g, '<img$1 />');
  jsx = jsx.replace(/<input([^>]*?)(?<!\/)>/g, '<input$1 />');
  jsx = jsx.replace(/<br([^>]*?)(?<!\/)>/g, '<br$1 />');
  jsx = jsx.replace(/<hr([^>]*?)(?<!\/)>/g, '<hr$1 />');
  jsx = jsx.replace(/<source([^>]*?)(?<!\/)>/g, '<source$1 />');

  jsx = jsx.replace(/style="([^"]*)"/g, (match, p1) => {
    let rawStyle = p1.replace(/\{"\{"\}/g, '{').replace(/\{"\}"\}/g, '}');
    const styles = rawStyle.split(';').filter(s => s.trim()).map(s => {
      const parts = s.split(':');
      const key = parts.shift();
      if (!key) return null;
      let value = parts.join(':').trim();
      let camelKey = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
      value = value.replace(/'/g, "\\'");
      return `${camelKey}: '${value}'`;
    }).filter(Boolean);
    return `style={{${styles.join(', ')}}}`;
  });

  for (let i = 0; i < protectedBlocks.length; i++) {
    jsx = jsx.replace(`___BLOCK_${i}___`, protectedBlocks[i]);
  }

  return jsx;
}

function processFiles() {
  for (const { file, route, isRoot } of files) {
    const filePath = path.join(uiDir, file);
    if (!fs.existsSync(filePath)) continue;
    const html = fs.readFileSync(filePath, 'utf8');
    const jsxContent = convertHtmlToJsxV2(html);
    
    const componentName = file
        .replace('.html', '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .replace(/^[a-z]/, (m) => m.toUpperCase());

    const outPath = isRoot ? path.join(appDir, 'page.tsx') : path.join(appDir, route);
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const componentCode = `/* eslint-disable */
// @ts-nocheck
export default function ${componentName}() {
  return (
    <>
      ${jsxContent}
    </>
  );
}`;

    fs.writeFileSync(outPath, componentCode, 'utf8');
  }
}

processFiles();
