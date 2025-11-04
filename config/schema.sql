-- LinkForge Database Schema

-- Drop table if exists (useful for resetting during development)
DROP TABLE IF EXISTS urls;

-- Create urls table
CREATE TABLE urls (
  id SERIAL PRIMARY KEY,
  original_url TEXT NOT NULL,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  click_count INTEGER DEFAULT 0
);

-- Create index on short_code for faster lookups
CREATE INDEX idx_short_code ON urls(short_code);

-- Verify table creation
SELECT 'URLs table created successfully!' AS message;