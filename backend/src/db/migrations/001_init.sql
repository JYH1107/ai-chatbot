CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(20) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing','indexed','failed')),
  chunk_count INT DEFAULT 0,
  content_hash VARCHAR(64),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(384),
  token_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON document_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_documents_hash ON documents(content_hash);

CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  query TEXT NOT NULL,
  answer TEXT NOT NULL,
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('rag','llm','cache')),
  sources JSONB,
  tokens_used INT DEFAULT 0,
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[],
  active BOOLEAN DEFAULT TRUE
);