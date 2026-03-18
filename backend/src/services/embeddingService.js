const axios = require('axios');
const cacheService = require('./cacheService');

const HF_API_URL = 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2';

async function embed(text) {
  // 캐시 확인
  const cacheKey = 'emb:' + Buffer.from(text).toString('base64').slice(0, 40);
  const cached = await cacheService.getRaw(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // HuggingFace 무료 API 호출
  const response = await axios.post(
    HF_API_URL,
    { inputs: text.slice(0, 512) },
    {
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const embedding = response.data;

  // 24시간 캐시 저장
  await cacheService.setRaw(cacheKey, JSON.stringify(embedding), 86400);

  return embedding;
}

module.exports = { embed };