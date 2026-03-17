import client from './client';

// 문서 목록 조회
export async function getDocuments() {
  const response = await client.get('/api/documents');
  return response.data;
}

// 문서 업로드
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await client.post('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
}

// 문서 삭제
export async function deleteDocument(id) {
  const response = await client.delete(`/api/documents/${id}`);
  return response.data;
}

// 문서 재색인
export async function reindexDocument(id) {
  const response = await client.post(`/api/documents/${id}/reindex`);
  return response.data;
}