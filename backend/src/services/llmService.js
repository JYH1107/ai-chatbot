const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 문서 컨텍스트 기반 답변 생성
async function generateWithContext(question, context) {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 600,
    system: `당신은 사내 문서 기반 AI 어시스턴트입니다.
반드시 제공된 문서 컨텍스트만 바탕으로 답변하세요.
컨텍스트에 없는 내용은 "문서에서 해당 내용을 찾을 수 없습니다."라고 답하세요.
답변은 간결하게 300자 이내로 작성하세요.`,
    messages: [{
      role: 'user',
      content: `[문서 컨텍스트]\n${context}\n\n[질문]\n${question}`
    }]
  });

  return response.content[0].text;
}

// 문서에서 찾지 못했을 때 fallback 답변
async function fallback(question) {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    system: `사내 문서에서 관련 내용을 찾지 못했습니다.
일반 지식으로 답변하되, 반드시 답변 끝에 아래 문구를 추가하세요:
"※ 이 답변은 사내 문서가 아닌 일반 지식 기반입니다."
불확실한 경우 "확실하지 않습니다"라고 명시하세요.`,
    messages: [{
      role: 'user',
      content: question
    }]
  });

  return {
    answer: response.content[0].text,
    sourceType: 'llm',
    sources: [],
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens
  };
}

module.exports = { generateWithContext, fallback };