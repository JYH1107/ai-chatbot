import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, deleteDocument, reindexDocument } from '../api/documents';
import { getChatLogs } from '../api/chat';
import { getCurrentUser } from '../api/auth';
import FileUpload from '../components/FileUpload';

export default function AdminPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [tab, setTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/chat');
    else fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data.documents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogs() {
    setLoading(true);
    try {
      const data = await getChatLogs();
      setLogs(data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDocument(id);
      fetchDocuments();
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  }

  async function handleReindex(id) {
    try {
      await reindexDocument(id);
      alert('재색인을 시작했습니다.');
      fetchDocuments();
    } catch (err) {
      alert('재색인 중 오류가 발생했습니다.');
    }
  }

  function handleTabChange(newTab) {
    setTab(newTab);
    if (newTab === 'logs') fetchLogs();
  }

  const statusColor = { indexed: '#10b981', processing: '#f59e0b', failed: '#ef4444' };

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>관리자 페이지</h1>
        <button onClick={() => navigate('/chat')} style={styles.backBtn}>
          ← 챗봇으로
        </button>
      </div>

      {/* 탭 */}
      <div style={styles.tabs}>
        <button
          onClick={() => handleTabChange('documents')}
          style={{ ...styles.tab, ...(tab === 'documents' ? styles.activeTab : {}) }}
        >
          문서 관리
        </button>
        <button
          onClick={() => handleTabChange('logs')}
          style={{ ...styles.tab, ...(tab === 'logs' ? styles.activeTab : {}) }}
        >
          채팅 로그
        </button>
      </div>

      <div style={styles.content}>
        {/* 문서 관리 탭 */}
        {tab === 'documents' && (
          <div>
            <FileUpload onUploadSuccess={fetchDocuments} />
            <h2 style={styles.sectionTitle}>업로드된 문서</h2>
            {loading ? <p>로딩 중...</p> : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['파일명', '상태', '청크 수', '업로드일', '관리'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id}>
                      <td style={styles.td}>{doc.original_name}</td>
                      <td style={styles.td}>
                        <span style={{ color: statusColor[doc.status] || '#666' }}>
                          {doc.status}
                        </span>
                      </td>
                      <td style={styles.td}>{doc.chunk_count}</td>
                      <td style={styles.td}>
                        {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td style={styles.td}>
                        <button onClick={() => handleReindex(doc.id)} style={styles.reindexBtn}>
                          재색인
                        </button>
                        <button onClick={() => handleDelete(doc.id)} style={styles.deleteBtn}>
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>
                      업로드된 문서가 없습니다.
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 채팅 로그 탭 */}
        {tab === 'logs' && (
          <div>
            <h2 style={styles.sectionTitle}>채팅 로그</h2>
            {loading ? <p>로딩 중...</p> : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['사용자', '질문', '답변 유형', '응답시간', '일시'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td style={styles.td}>{log.user_email}</td>
                      <td style={{ ...styles.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.query}
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: log.source_type === 'llm' ? '#f59e0b' : '#10b981' }}>
                          {log.source_type}
                        </span>
                      </td>
                      <td style={styles.td}>{log.latency_ms}ms</td>
                      <td style={styles.td}>
                        {new Date(log.created_at).toLocaleString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>
                      로그가 없습니다.
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f5f5f5' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 24px', backgroundColor: '#4f46e5', color: 'white'
  },
  headerTitle: { margin: 0, fontSize: '18px' },
  backBtn: {
    padding: '6px 12px', borderRadius: '6px', border: '1px solid white',
    backgroundColor: 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px'
  },
  tabs: { display: 'flex', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' },
  tab: {
    padding: '14px 24px', border: 'none', backgroundColor: 'transparent',
    cursor: 'pointer', fontSize: '14px', color: '#666'
  },
  activeTab: { color: '#4f46e5', borderBottom: '2px solid #4f46e5', fontWeight: 'bold' },
  content: { padding: '24px' },
  sectionTitle: { fontSize: '16px', margin: '24px 0 12px', color: '#333' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' },
  th: { padding: '12px 16px', textAlign: 'left', backgroundColor: '#f9fafb', fontSize: '13px', color: '#666', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '12px 16px', fontSize: '14px', borderBottom: '1px solid #f3f4f6' },
  reindexBtn: {
    padding: '4px 10px', borderRadius: '6px', border: '1px solid #4f46e5',
    backgroundColor: 'transparent', color: '#4f46e5', cursor: 'pointer', fontSize: '12px', marginRight: '6px'
  },
  deleteBtn: {
    padding: '4px 10px', borderRadius: '6px', border: '1px solid #ef4444',
    backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '12px'
  }
};