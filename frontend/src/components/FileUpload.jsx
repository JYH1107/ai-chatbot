import { useState } from 'react';
import { uploadDocument } from '../api/documents';

export default function FileUpload({ onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleFile(file) {
    if (!file) return;

    const allowed = ['application/pdf', 'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (!allowed.includes(file.type)) {
      setError('PDF, DOCX, TXT 파일만 업로드 가능합니다.');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    try {
      await uploadDocument(file);
      setMessage(`✅ "${file.name}" 업로드 완료! 문서 처리 중입니다.`);
      onUploadSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  function handleChange(e) {
    handleFile(e.target.files[0]);
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{ ...styles.dropzone, ...(dragging ? styles.dragging : {}) }}
      >
        {uploading ? (
          <p style={styles.text}>업로드 중...</p>
        ) : (
          <>
            <p style={styles.text}>📁 파일을 여기에 끌어다 놓거나</p>
            <label style={styles.label}>
              파일 선택
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleChange}
                style={{ display: 'none' }}
              />
            </label>
            <p style={styles.hint}>PDF, DOCX, TXT 지원 · 최대 50MB</p>
          </>
        )}
      </div>
      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  dropzone: {
    border: '2px dashed #d1d5db', borderRadius: '12px',
    padding: '40px', textAlign: 'center', cursor: 'pointer',
    transition: 'border-color 0.2s'
  },
  dragging: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  text: { margin: '0 0 12px', fontSize: '14px', color: '#666' },
  label: {
    display: 'inline-block', padding: '8px 20px', borderRadius: '8px',
    backgroundColor: '#4f46e5', color: 'white', cursor: 'pointer', fontSize: '14px'
  },
  hint: { margin: '12px 0 0', fontSize: '12px', color: '#9ca3af' },
  success: { margin: '8px 0 0', fontSize: '13px', color: '#10b981' },
  error: { margin: '8px 0 0', fontSize: '13px', color: '#ef4444' }
};