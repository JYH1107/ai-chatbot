const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const crypto = require('crypto');
const embeddingService = require('./embeddingService');
const db = require('../db');

const CHUNK_SIZE = 1600;  // 약 400 토큰
const CHUNK_OVERLAP = 200;

// 문서 처리 메인 함수
async function processDocument(fileBuffer, mimeType, originalName, docId) {
  try {
    // 1) 텍스트 추출
    const text = await extractText(fileBuffer, mimeType);

    if (!text || text.trim().length === 0) {
      throw new Error('텍스트를 추출할 수 없습니다.');
    }

    // 2) 청킹
    const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);

    // 3) 배치 임베딩 및 저장 (20개씩 처리)
    const BATCH_SIZE = 20;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const embeddings = await Promise.all(
        batch.map(c => embeddingService.embed(c))
      );

      const values = batch.map((content, j) => ({
        document_id: docId,
        chunk_index: i + j,
        content,
        embedding: embeddings[j],
        token_count: Math.ceil(content.length / 4)
      }));

      await db.batchInsertChunks(values);
    }

    // 4) 문서 상태 업데이트
    await db.query(
      `UPDATE documents 
       SET status = 'indexed', chunk_count = $1, updated_at = NOW() 
       WHERE id = $2`,
      [chunks.length, docId]
    );

    return { success: true, chunkCount: chunks.length };

  } catch (err) {
    // 실패 시 상태 업데이트
    await db.query(
      `UPDATE documents SET status = 'failed', updated_at = NOW() WHERE id = $1`,
      [docId]
    );
    throw err;
  }
}

// 텍스트 추출
async function extractText(buffer, mimeType) {
  if (mimeType === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  // txt 등 일반 텍스트
  return buffer.toString('utf-8');
}

// 문장 경계 기준 청킹
function chunkText(text, chunkSize, overlap) {
  const sentences = text.split(/(?<=[.!?。])\s+/);
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize) {
      if (current) {
        chunks.push(current.trim());
        current = current.slice(-overlap) + ' ' + sentence;
      } else {
        chunks.push(sentence.trim());
        current = '';
      }
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 20);
}

// 파일 SHA256 해시 (중복 업로드 방지)
function getFileHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// 문서 재색인
async function reindexDocument(docId, fileBuffer, mimeType, originalName) {
  await db.query(
    'DELETE FROM document_chunks WHERE document_id = $1',
    [docId]
  );
  await db.query(
    `UPDATE documents SET status = 'processing', updated_at = NOW() WHERE id = $1`,
    [docId]
  );
  return await processDocument(fileBuffer, mimeType, originalName, docId);
}

module.exports = { processDocument, reindexDocument, getFileHash };