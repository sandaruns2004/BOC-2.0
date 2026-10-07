const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_KEY");
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent("Hello world");
  console.log(result.embedding.values.slice(0, 10));
}
test().catch(console.error);
