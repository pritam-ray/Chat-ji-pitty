-- ========================================
-- Azure OpenAI Chatbot Database Schema
-- Using Azure Response API for context management
-- ========================================

-- Create database
CREATE DATABASE IF NOT EXISTS chatbot
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE chatbot;

-- ========================================
-- Conversations Table
-- Stores conversation metadata and Azure session info
-- ========================================
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL DEFAULT 'New chat',
  azure_response_id VARCHAR(255) NULL COMMENT 'Azure Response API response ID (previous_response_id for context chaining)',
  created_at BIGINT NOT NULL COMMENT 'Timestamp in milliseconds',
  updated_at BIGINT NOT NULL COMMENT 'Timestamp in milliseconds',
  INDEX idx_updated_at (updated_at),
  INDEX idx_azure_response_id (azure_response_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Messages Table
-- Stores all messages with their content
-- ========================================
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id VARCHAR(255) NOT NULL,
  role ENUM('user', 'assistant', 'system') NOT NULL,
  content TEXT NOT NULL COMMENT 'Full message content',
  display_content TEXT NULL COMMENT 'Formatted content for display (may differ from API content)',
  created_at BIGINT NOT NULL COMMENT 'Timestamp in milliseconds',
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Attachments Table
-- Stores file attachments (images, PDFs, audio)
-- ========================================
CREATE TABLE IF NOT EXISTS attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT NOT NULL,
  type ENUM('image', 'pdf', 'audio', 'file') NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size INT NULL COMMENT 'File size in bytes',
  file_data LONGBLOB NOT NULL COMMENT 'Base64 encoded file data',
  created_at BIGINT NOT NULL COMMENT 'Timestamp in milliseconds',
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  INDEX idx_message_id (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Azure Response Sessions Table (Optional)
-- Tracks Azure Response API session metadata
-- Helps manage context lifecycle and cleanup
-- ========================================
CREATE TABLE IF NOT EXISTS azure_sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  conversation_id VARCHAR(255) NOT NULL,
  model_name VARCHAR(100) NULL,
  total_tokens INT DEFAULT 0 COMMENT 'Track token usage',
  last_used_at BIGINT NOT NULL COMMENT 'Timestamp in milliseconds',
  expires_at BIGINT NULL COMMENT 'When Azure session expires (if applicable)',
  created_at BIGINT NOT NULL COMMENT 'Timestamp in milliseconds',
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_last_used_at (last_used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Indexes for performance optimization
-- ========================================
-- Additional composite indexes for common queries
CREATE INDEX idx_conv_updated ON conversations(updated_at DESC);
CREATE INDEX idx_msg_conv_created ON messages(conversation_id, created_at);

-- ========================================
-- Sample Data (Optional - Remove if not needed)
-- ========================================
-- Insert a sample conversation
-- INSERT INTO conversations (id, title, created_at, updated_at) 
-- VALUES ('sample-conv-1', 'Welcome Conversation', UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000);

-- ========================================
-- Useful Queries for Management
-- ========================================

-- View all conversations with message count
-- SELECT c.id, c.title, c.azure_session_id, COUNT(m.id) as message_count, 
--        FROM_UNIXTIME(c.updated_at/1000) as last_updated
-- FROM conversations c
-- LEFT JOIN messages m ON c.id = m.conversation_id
-- GROUP BY c.id
-- ORDER BY c.updated_at DESC;

-- View conversation with all messages
-- SELECT c.title, m.role, m.content, FROM_UNIXTIME(m.created_at/1000) as sent_at
-- FROM conversations c
-- JOIN messages m ON c.id = m.conversation_id
-- WHERE c.id = 'your-conversation-id'
-- ORDER BY m.created_at;

-- Clean up old sessions (older than 30 days)
-- DELETE FROM conversations WHERE updated_at < (UNIX_TIMESTAMP() - 2592000) * 1000;

-- View token usage by conversation (if tracking)
-- SELECT c.title, SUM(a.total_tokens) as total_tokens
-- FROM conversations c
-- JOIN azure_sessions a ON c.id = a.conversation_id
-- GROUP BY c.id
-- ORDER BY total_tokens DESC;
