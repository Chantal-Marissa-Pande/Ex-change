-- CLEAN RESET
DROP TABLE IF EXISTS user_activity;
DROP TABLE IF EXISTS exchanges;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS skill_detail;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS users;

-- USERS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SKILLS (GLOBAL DEFINITIONS)
CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(100),
  tags TEXT, -- comma-separated: 'web,frontend,react'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SKILL DETAILS (USER-SPECIFIC SKILL INFO)
CREATE TABLE skill_detail (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  skill_id INT REFERENCES skills(id) ON DELETE CASCADE,
  level VARCHAR(50), -- beginner, intermediate, expert
  years_experience INT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, skill_id)
);

-- LISTINGS (SKILL EXCHANGE POSTS)
CREATE TABLE listings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  skill_offered_detail_id INT REFERENCES skill_detail(id),
  skill_requested_id INT REFERENCES skills(id),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- EXCHANGES (REQUESTS)
CREATE TABLE exchanges (
  id SERIAL PRIMARY KEY,
  requester_id INT REFERENCES users(id) ON DELETE CASCADE,
  listing_id INT REFERENCES listings(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER ACTIVITY (FOR PERSONALIZATION / AI)
CREATE TABLE user_activity (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50), -- search, view, request
  skill_id INT REFERENCES skills(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);