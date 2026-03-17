const embeddingService = require('./embeddingService');
const llmService = require('./llmService');
const faqService = require('./faqService');
const db = require('../db');

const SIMILARITY_THRESHOLD = 0.75; // 이 점수 이하면 LLM fallback
const TOP_K = 5;                   // 검색 결과 상위 5개
const MAX_CONTEXT_CHARS = 3000;    // 프롬프트 길이 제한

async function query(userQuery) {
  // 1) FAQ 빠른 매칭 (임베딩/LLM 호출 없음)
  const faqAnswer = await faqService.match(userQuery);
  if (faqAnswer) {
    return {
      answer: faqAnswer.answer,
      sourceType: 'rag',
      sources: [],
      fromFaq: true
    };
  }

  // 2) 질문 임베딩 생성
  const queryEmbedding = await embeddingService.embed(userQuery);

  // 3) 벡터 검색
  const chunks = await searchSimilarChunks(queryEmbedding, TOP_K);

  // 4) 유사도 threshold 판단
  const validChunks = chunks.filter(c => c.score >= SIMILARITY_THRESHOLD);

  if (validChunks.length === 0) {
    // 문서에서 못 찾으면 LLM fallback
    return await llmService.fallback(userQuery);
  }

  // 5) 컨텍스트 조립 (길이 제한)
  const context = buildContext(validChunks, MAX_CONTEXT_CHARS);

  // 6) RAG 답변 생성
  const answer = await llmService.generateWithContext(userQuery, context);

  return {
    answer,
    sourceType: 'rag',
    sources: validChunks.map(c => ({
      documentId: c.document_id,
      filename: c.filename,
      chunkIndex: c.chunk_index,
      score: Math.round(c.score * 100) / 100
    }))
  };
}

async function searchSimilarChunks(embedding, k) {
  const vectorStr = `[${embedding.join(',')}]`;
  const result = await db.query(`
    SELECT
      dc.id,
      dc.document_id,
      dc.chunk_index,
      dc.content,
      d.original_name AS filename,
      1 - (dc.embedding <=> $1::vector) AS score
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    WHERE d.status = 'indexed'
    ORDER BY dc.embedding <=> $1::vector
    LIMIT $2
  `, [vectorStr, k]);

  return result.rows;
}

function buildContext(chunks, maxChars) {
  let context = '';
  for (const chunk of chunks) {
    const entry = `[출처: ${chunk.filename} #${chunk.chunk_index}]\n${chunk.content}\n\n`;
    if ((context + entry).length > maxChars) break;
    context += entry;
  }
  return context.trim();
}

module.exports = { query };