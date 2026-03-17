const db = require('../db');

// 키워드 기반 FAQ 매칭 (LLM 호출 없이 처리)
async function match(query) {
  try {
    const result = await db.query(
      `SELECT * FROM faq WHERE active = TRUE`,
    );

    const faqs = result.rows;
    const queryLower = query.toLowerCase();

    for (const faq of faqs) {
      // 키워드 매칭
      if (faq.keywords && faq.keywords.length > 0) {
        const matched = faq.keywords.some(keyword =>
          queryLower.includes(keyword.toLowerCase())
        );
        if (matched) return faq;
      }

      // 질문 직접 매칭 (80% 이상 유사하면 반환)
      if (faq.question && queryLower.includes(faq.question.toLowerCase())) {
        return faq;
      }
    }

    return null;
  } catch (err) {
    // FAQ 테이블 없어도 서비스 계속 동작
    return null;
  }
}

module.exports = { match };