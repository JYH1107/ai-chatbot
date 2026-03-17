const router = require('express').Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { processDocument, reindexDocument, getFileHash } = require('../services/documentService');

// 파일 업로드 설정 (메모리에 임시 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB 제한
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('PDF, DOCX, TXT 파일만 업로드 가능합니다.'));
    }
  }
});

// 문서 업로드 (관리자만)
router.post('/upload', upload.single('file'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '관리자만 업로드 가능합니다.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: '파일을 선택하세요.' });
  }

  try {
    const fileBuffer = req.file.buffer;
    const contentHash = getFileHash(fileBuffer);

    // 중복 파일 확인
    const existing = await db.query(
      'SELECT id, original_name FROM documents WHERE content_hash = $1',
      [contentHash]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: '이미 업로드된 파일입니다.',
        existingFile: existing.rows[0].original_name
      });
    }

    // 문서 DB 저장
    const docId = uuidv4();
    await db.query(
      `INSERT INTO documents 
        (id, filename, original_name, file_type, storage_path, content_hash, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        docId,
        req.file.originalname,
        req.file.originalname,
        req.file.mimetype,
        `uploads/${docId}`,
        contentHash,
        req.user.id
      ]
    );

    // 비동기 처리 (응답 먼저 반환)
    res.status(202).json({
      message: '업로드 완료. 문서 처리 중입니다.',
      documentId: docId
    });

    // 백그라운드에서 청킹 + 임베딩 처리
    processDocument(fileBuffer, req.file.mimetype, req.file.originalname, docId)
      .catch(err => console.error('Document processing error:', err));

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: '업로드 중 오류가 발생했습니다.' });
  }
});

// 문서 목록 조회
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        d.id, d.original_name, d.file_type, d.status,
        d.chunk_count, d.created_at,
        u.email as uploaded_by
       FROM documents d
       LEFT JOIN users u ON u.id = d.uploaded_by
       ORDER BY d.created_at DESC`
    );
    res.json({ documents: result.rows });
  } catch (err) {
    console.error('Documents error:', err);
    res.status(500).json({ error: '문서 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 문서 재색인 (관리자만)
router.post('/:id/reindex', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '관리자만 재색인 가능합니다.' });
  }

  try {
    const docResult = await db.query(
      'SELECT * FROM documents WHERE id = $1',
      [req.params.id]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: '문서를 찾을 수 없습니다.' });
    }

    res.json({ message: '재색인을 시작합니다.' });

    // 백그라운드 재색인
    const doc = docResult.rows[0];
    reindexDocument(doc.id, Buffer.alloc(0), doc.file_type, doc.original_name)
      .catch(err => console.error('Reindex error:', err));

  } catch (err) {
    console.error('Reindex error:', err);
    res.status(500).json({ error: '재색인 중 오류가 발생했습니다.' });
  }
});

// 문서 삭제 (관리자만)
router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '관리자만 삭제 가능합니다.' });
  }

  try {
    await db.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    res.json({ message: '문서가 삭제되었습니다.' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: '삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router;