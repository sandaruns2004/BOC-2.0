const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const { embedText, embeddingModelId } = require('./ai-embed.cjs');

async function testEmbedding() {
  try {
    const values = await embedText("Hello world");
    console.log("Model:", embeddingModelId);
    console.log("Vector length:", values.length);
    console.log("First few values:", values.slice(0, 5));
  } catch(e) {
    console.error("error:", e.message);
  }
}
testEmbedding();
