import client from './client';

// 로그인
export async function login(email, password) {
  const response = await client.post('/api/auth/login', { email, password });
  const { token, user } = response.data;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  return user;
}

// 회원가입
export async function register(email, password) {
  const response = await client.post('/api/auth/register', { email, password });
  const { token, user } = response.data;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  return user;
}

// 로그아웃
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// 현재 로그인된 유저 정보
export function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// 로그인 여부 확인
export function isLoggedIn() {
  return !!localStorage.getItem('token');
}