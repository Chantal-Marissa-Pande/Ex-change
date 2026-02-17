-- =====================================================
-- EX-CHANGE SEED DATA
-- =====================================================

-- USERS (password = 123456)
INSERT INTO users (name, email, password_hash, role) VALUES
('Alice Williams', 'alice@example.com', '$2b$10$7QJ8n5U8gqzFJ5xE4v3GkOVR7x9F1lGv5XK2LJQ7nqZxRkP1tYz0C', 'user'),
('Bob Smith', 'bob@example.com', '$2b$10$7QJ8n5U8gqzFJ5xE4v3GkOVR7x9F1lGv5XK2LJQ7nqZxRkP1tYz0C', 'user'),
('Admin User', 'admin@example.com', '$2b$10$7QJ8n5U8gqzFJ5xE4v3GkOVR7x9F1lGv5XK2LJQ7nqZxRkP1tYz0C', 'admin');

-- SKILLS
INSERT INTO skills (title, category) VALUES
('Web Development', 'Technology'),
('Graphic Design', 'Creative'),
('Python Programming', 'Technology');

-- SKILL DETAILS
INSERT INTO skill_detail (user_id, skill_id, level, years_experience, description) VALUES
(1, 1, 'Intermediate', 2, 'Frontend and backend projects'),
(2, 2, 'Advanced', 5, 'Brand design specialist');

-- LISTINGS
INSERT INTO listings (user_id, skill_offered_detail_id, skill_requested_id, description) VALUES
(1, 1, 2, 'Offering Web Dev for Design');

-- EXCHANGES
INSERT INTO exchanges (requester_id, listing_id, status) VALUES
(2, 1, 'accepted');

-- RATINGS
INSERT INTO ratings (exchange_id, rater_id, rated_user_id, score, comment) VALUES
(1, 2, 1, 5, 'Excellent collaboration!');

-- USER ACTIVITY
INSERT INTO user_activity (user_id, skill_id, action) VALUES
(1, 1, 'view'),
(2, 2, 'search');