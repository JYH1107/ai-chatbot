const OpenAI = require('openai');
const cacheService = require('./cacheService');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embed(text) {
  // 캐시 확인 (동일 텍스트 재호출 방지)
  const cacheKey = 'emb:' + Buffer.from(text).toString('base64').slice(0, 40);
  const cached = await cacheService.getRaw(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // OpenAI 임베딩 API 호출
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small', // 가장 저렴한 모델
    input: text.slice(0, 8000),      // 최대 길이 제한
  });

  const embedding = response.data[0].embedding;

  // 24시간 캐시 저장
  await cacheService.setRaw(cacheKey, JSON.stringify(embedding), 86400);

  return embedding;
}

module.exports = { embed };