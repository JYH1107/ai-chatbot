import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.title}>사내 AI 챗봇</h1>
        <h2 style={styles.subtitle}>{isRegister ? '회원가입' : '로그인'}</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? '처리 중...' : (isRegister ? '회원가입' : '로그인')}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          style={styles.toggle}
        >
          {isRegister ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: '100vh', backgroundColor: '#f5f5f5'
  },
  box: {
    backgroundColor: 'white', padding: '40px', borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px'
  },
  title: { textAlign: 'center', fontSize: '24px', marginBottom: '8px', color: '#333' },
  subtitle: { textAlign: 'center', fontSize: '16px', marginBottom: '24px', color: '#666', fontWeight: 'normal' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: {
    padding: '12px', borderRadius: '8px', border: '1px solid #ddd',
    fontSize: '14px', outline: 'none'
  },
  button: {
    padding: '12px', borderRadius: '8px', border: 'none',
    backgroundColor: '#4f46e5', color: 'white', fontSize: '14px',
    cursor: 'pointer', fontWeight: 'bold'
  },
  error: { color: '#ef4444', fontSize: '13px', margin: '0' },
  toggle: {
    marginTop: '16px', background: 'none', border: 'none',
    color: '#4f46e5', cursor: 'pointer', fontSize: '13px', width: '100%'
  }
};