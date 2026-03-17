const router = require('express').Router();
const ragService = require('../services/ragService');
const cacheService = require('../services/cacheService');
const { saveChatLog } = require('../db');

// 챗봇 질문 처리
router.post('/', async (req, res) => {
  const { query } = req.body;
  const userId = req.user.id;
  const startTime = Date.now();

  if (!query?.trim()) {
    return res.status(400).json({ error: '질문을 입력하세요.' });
  }

  try {
    // 1) 캐시 확인
    const cached = await cacheService.get(query);
    if (cached) {
      await saveChatLog({
        userId,
        query,
        answer: cached.answer,
        sourceType: 'cache',
        sources: cached.sources,
        latencyMs: Date.now() - startTime
      });
      return res.json({ ...cached, fromCache: true });
    }

    // 2) RAG 처리
    const result = await ragService.query(query);

    // 3) 캐시 저장 (1시간)
    await cacheService.set(query, result, 3600);

    // 4) 로그 저장
    await saveChatLog({
      userId,
      query,
      answer: result.answer,
      sourceType: result.sourceType,
      sources: result.sources,
      tokensUsed: result.tokensUsed || 0,
      latencyMs: Date.now() - startTime
    });

    return res.json(result);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: '답변 생성 중 오류가 발생했습니다.' });
  }
});

// 채팅 로그 조회 (관리자용)
router.get('/logs', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '관리자만 접근 가능합니다.' });
  }

  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await require('../db').query(
      `SELECT 
        cl.id, cl.query, cl.answer, cl.source_type,
        cl.sources, cl.tokens_used, cl.latency_ms, cl.created_at,
        u.email as user_email
       FROM chat_logs cl
       LEFT JOIN users u ON u.id = cl.user_id
       ORDER BY cl.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await require('../db').query(
      'SELECT COUNT(*) FROM chat_logs'
    );

    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Logs error:', err);
    res.status(500).json({ error: '로그 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router;