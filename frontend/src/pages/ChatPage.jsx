import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendMessage } from '../api/chat';
import { getCurrentUser, logout } from '../api/auth';
import ChatMessage from '../components/ChatMessage';

export default function ChatPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [messages, setMessages] = useState([
    { role: 'bot', content: '안녕하세요! 무엇이 궁금하신가요?', sourceType: 'rag', sources: [] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // 로그인 확인
  useEffect(() => {
    if (!user) navigate('/login');
  }, []);

  // 새 메시지 오면 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await sendMessage(input);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: result.answer,
        sourceType: result.sourceType,
        sources: result.sources || [],
        fromCache: result.fromCache || false
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '오류가 발생했습니다. 다시 시도해주세요.',
        sourceType: 'error',
        sources: []
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={styles.container}>
      {/* 상단 헤더 */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>사내 AI 챗봇</h1>
        <div style={styles.headerRight}>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin')} style={styles.adminBtn}>
              관리자
            </button>
          )}
          <span style={styles.userEmail}>{user?.email}</span>
          <button onClick={logout} style={styles.logoutBtn}>로그아웃</button>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div style={styles.messages}>
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {loading && (
          <div style={styles.loadingWrapper}>
            <div style={styles.loadingBubble}>
              <span style={styles.loadingText}>답변 생성 중...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div style={styles.inputArea}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="질문을 입력하세요. (Enter로 전송, Shift+Enter로 줄바꿈)"
          style={styles.textarea}
          rows={2}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          style={{ ...styles.sendBtn, opacity: loading ? 0.6 : 1 }}
          disabled={loading}
        >
          전송
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', backgroundColor: '#f5f5f5'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 24px', backgroundColor: '#4f46e5', color: 'white'
  },
  headerTitle: { margin: 0, fontSize: '18px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  userEmail: { fontSize: '13px', opacity: 0.8 },
  adminBtn: {
    padding: '6px 12px', borderRadius: '6px', border: '1px solid white',
    backgroundColor: 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px'
  },
  logoutBtn: {
    padding: '6px 12px', borderRadius: '6px', border: 'none',
    backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', fontSize: '13px'
  },
  messages: {
    flex: 1, overflowY: 'auto', padding: '24px',
    display: 'flex', flexDirection: 'column'
  },
  loadingWrapper: { display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' },
  loadingBubble: {
    backgroundColor: 'white', padding: '12px 16px', borderRadius: '12px',
    borderBottomLeftRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  loadingText: { fontSize: '14px', color: '#888' },
  inputArea: {
    display: 'flex', gap: '12px', padding: '16px 24px',
    backgroundColor: 'white', borderTop: '1px solid #e5e7eb'
  },
  textarea: {
    flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd',
    fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit'
  },
  sendBtn: {
    padding: '0 24px', borderRadius: '8px', border: 'none',
    backgroundColor: '#4f46e5', color: 'white', fontSize: '14px',
    cursor: 'pointer', fontWeight: 'bold'
  }
};