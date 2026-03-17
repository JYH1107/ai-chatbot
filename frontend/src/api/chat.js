import client from './client';

// 질문 전송
export async function sendMessage(query) {
  const response = await client.post('/api/chat', { query });
  return response.data;
}

// 채팅 로그 조회 (관리자용)
export async function getChatLogs(page = 1, limit = 20) {
  const response = await client.get('/api/chat/logs', {
    params: { page, limit }
  });
  return response.data;
}