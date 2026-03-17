const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 쿼리 실행 함수
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// 청크 배치 저장 함수
async function batchInsertChunks(chunks) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const chunk of chunks) {
      const vectorStr = `[${chunk.embedding.join(',')}]`;
      await client.query(
        `INSERT INTO document_chunks 
          (document_id, chunk_index, content, embedding, token_count)
         VALUES ($1, $2, $3, $4::vector, $5)`,
        [chunk.document_id, chunk.chunk_index, chunk.content, vectorStr, chunk.token_count]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// 채팅 로그 저장 함수
async function saveChatLog({ userId, query: q, answer, sourceType, sources, tokensUsed, latencyMs }) {
  await query(
    `INSERT INTO chat_logs 
      (user_id, query, answer, source_type, sources, tokens_used, latency_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, q, answer, sourceType, JSON.stringify(sources || []), tokensUsed || 0, latencyMs || 0]
  );
}

module.exports = { query, batchInsertChunks, saveChatLog };