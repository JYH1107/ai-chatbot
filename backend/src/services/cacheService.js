const Redis = require('ioredis');
const crypto = require('crypto');

let redis;

function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      retryStrategy: () => null, // Redis 없어도 서버 죽지 않게
    });
    redis.on('error', () => {}); // 에러 무시 (Redis 없으면 캐시만 비활성화)
  }
  return redis;
}

// 질문을 SHA256 해시로 변환 (캐시 키)
function hashQuery(query) {
  return 'chat:' + crypto.createHash('sha256').update(query.trim().toLowerCase()).digest('hex');
}

// 채팅 캐시 저장
async function set(query, result, ttl = 3600) {
  try {
    const key = hashQuery(query);
    await getRedis().set(key, JSON.stringify(result), 'EX', ttl);
  } catch (err) {
    // Redis 실패해도 서비스 계속 동작
  }
}

// 채팅 캐시 조회
async function get(query) {
  try {
    const key = hashQuery(query);
    const data = await getRedis().get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
}

// 임베딩 캐시 저장 (raw key 사용)
async function setRaw(key, value, ttl = 86400) {
  try {
    await getRedis().set(key, value, 'EX', ttl);
  } catch (err) {}
}

// 임베딩 캐시 조회
async function getRaw(key) {
  try {
    return await getRedis().get(key);
  } catch (err) {
    return null;
  }
}

module.exports = { get, set, getRaw, setRaw };