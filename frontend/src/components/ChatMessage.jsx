export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div style={{ ...styles.wrapper, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.botBubble) }}>
        <p style={styles.text}>{message.content}</p>

        {/* 출처 표시 (RAG 답변일 때만) */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div style={styles.sources}>
            <p style={styles.sourcesTitle}>📄 출처</p>
            {message.sources.map((source, i) => (
              <p key={i} style={styles.sourceItem}>
                {source.filename} #{source.chunkIndex} (유사도: {Math.round(source.score * 100)}%)
              </p>
            ))}
          </div>
        )}

        {/* LLM fallback 표시 */}
        {!isUser && message.sourceType === 'llm' && (
          <p style={styles.fallbackBadge}>⚠️ 일반 지식 기반 답변</p>
        )}

        {/* 캐시 답변 표시 */}
        {!isUser && message.fromCache && (
          <p style={styles.cacheBadge}>⚡ 캐시된 답변</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', marginBottom: '16px' },
  bubble: {
    maxWidth: '70%', padding: '12px 16px', borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  userBubble: { backgroundColor: '#4f46e5', color: 'white', borderBottomRightRadius: '4px' },
  botBubble: { backgroundColor: 'white', color: '#333', borderBottomLeftRadius: '4px' },
  text: { margin: '0', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
  sources: { marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' },
  sourcesTitle: { margin: '0 0 4px', fontSize: '12px', fontWeight: 'bold', color: '#666' },
  sourceItem: { margin: '2px 0', fontSize: '11px', color: '#888' },
  fallbackBadge: { margin: '8px 0 0', fontSize: '11px', color: '#f59e0b' },
  cacheBadge: { margin: '8px 0 0', fontSize: '11px', color: '#10b981' }
};