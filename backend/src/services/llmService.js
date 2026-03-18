const axios = require('axios');

const OLLAMA_URL = 'http://host.docker.internal:11434/api/generate';
const MODEL = 'llama3.2';

// 문서 컨텍스트 기반 답변 생성
async function generateWithContext(question, context) {
  const prompt = `당신은 사내 문서 기반 AI 어시스턴트입니다.
반드시 아래 문서 컨텍스트만 바탕으로 답변하세요.
컨텍스트에 없는 내용은 "문서에서 해당 내용을 찾을 수 없습니다."라고 답하세요.
답변은 간결하게 작성하세요.

[문서 컨텍스트]
${context}

[질문]
${question}

[답변]`;

  const response = await axios.post(OLLAMA_URL, {
    model: MODEL,
    prompt,
    stream: false
  });

  return response.data.response;
}

// 문서에서 찾지 못했을 때 fallback 답변
async function fallback(question) {
  const prompt = `아래 질문에 답변하세요. 
불확실한 경우 "확실하지 않습니다"라고 명시하세요.
답변 끝에 반드시 "※ 이 답변은 사내 문서가 아닌 일반 지식 기반입니다."를 추가하세요.

[질문]
${question}

[답변]`;

  const response = await axios.post(OLLAMA_URL, {
    model: MODEL,
    prompt,
    stream: false
  });

  return {
    answer: response.data.response,
    sourceType: 'llm',
    sources: [],
    tokensUsed: 0
  };
}

module.exports = { generateWithContext, fallback };