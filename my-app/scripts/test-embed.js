const { GoogleGenerativeAI } = require('@google/generative-ai');
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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testEmbedding() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const result = await model.embedContent("Hello world");
    console.log("Vector type:", typeof result.embedding?.values);
    console.log("Vector length:", result.embedding?.values?.length);
    console.log("First few values:", result.embedding?.values?.slice(0, 5));
  } catch(e) {
    console.error("error:", e.message);
  }
}
testEmbedding();
