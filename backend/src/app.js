require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authController = require('./controllers/authController');
const chatController = require('./controllers/chatController');
const documentController = require('./controllers/documentController');
const { authMiddleware } = require('./middleware/authMiddleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10mb' }));

// 인증 없이 접근 가능
app.use('/api/auth', authController);

// 로그인 필요
app.use('/api/chat', authMiddleware, chatController);
app.use('/api/documents', authMiddleware, documentController);

// 서버 상태 확인용
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

module.exports = app;