-- =================
-- USERS (password = 123456)
-- =================
INSERT INTO users (name, email, password_hash, role) VALUES
('Alice Williams', 'alice@example.com', '$2b$10$sFU1uMHjIrQ7u1M/JzRL6ueBggbGWm6bcjWiOFkd4tqGrt1ZuxZZm', 'user'),
('Bob Smith', 'bob@example.com', '$2b$10$sFU1uMHjIrQ7u1M/JzRL6ueBggbGWm6bcjWiOFkd4tqGrt1ZuxZZm', 'user'),
('Charlie Johnson', 'charlie@example.com', '$2b$10$sFU1uMHjIrQ7u1M/JzRL6ueBggbGWm6bcjWiOFkd4tqGrt1ZuxZZm', 'user'),
('Diana Prince', 'diana@example.com', '$2b$10$sFU1uMHjIrQ7u1M/JzRL6ueBggbGWm6bcjWiOFkd4tqGrt1ZuxZZm', 'user'),
('Ethan Hunt', 'ethan@example.com', '$2b$10$sFU1uMHjIrQ7u1M/JzRL6ueBggbGWm6bcjWiOFkd4tqGrt1ZuxZZm', 'user'),
('Admin User', 'admin@example.com', '$2b$10$sFU1uMHjIrQ7u1M/JzRL6ueBggbGWm6bcjWiOFkd4tqGrt1ZuxZZm', 'admin');

-- =================
-- SKILLS
-- =================
INSERT INTO skills (title, category, tags) VALUES
('Web Development', 'Technology', '["frontend", "backend", "javascript", "react"]'),
('Graphic Design', 'Creative', '["photoshop", "illustrator", "branding"]'),
('Python Programming', 'Technology', '["python", "data-science", "automation"]'),
('Photography', 'Creative', '["portrait", "landscape", "editing"]'),
('Digital Marketing', 'Business', '["seo", "social-media", "content"]'),
('UI/UX Design', 'Creative', '["wireframing", "prototyping", "figma"]'),
('Data Analysis', 'Technology', '["excel", "python", "visualization"]');

-- =================
-- SKILL DETAILS
-- =================
INSERT INTO skill_detail (user_id, skill_id, level, years_experience, description) VALUES
(1, 1, 'Intermediate', 2, 'Frontend and backend projects'),
(2, 2, 'Advanced', 5, 'Brand design specialist'),
(3, 3, 'Beginner', 1, 'Python scripting and automation tasks'),
(4, 4, 'Intermediate', 3, 'Photography for events and portraits'),
(5, 5, 'Advanced', 4, 'Social media campaigns and SEO strategies'),
(1, 6, 'Intermediate', 2, 'UI/UX design for apps and websites'),
(2, 7, 'Advanced', 5, 'Data visualization and reporting');

-- =================
-- LISTINGS
-- =================
INSERT INTO listings (user_id, skill_offered_detail_id, skill_requested_id, description) VALUES
(1, 1, 2, 'Offering Web Development for Graphic Design services'),
(2, 2, 3, 'Offering Graphic Design for Python Programming help'),
(3, 3, 1, 'Offering Python Programming for Web Development assistance'),
(4, 4, 5, 'Offering Photography in exchange for Digital Marketing'),
(5, 5, 6, 'Offering Digital Marketing for UI/UX Design support');

-- =================
-- EXCHANGES
-- =================
INSERT INTO exchanges (requester_id, listing_id, status) VALUES
(2, 1, 'accepted'),
(3, 2, 'pending'),
(1, 3, 'rejected'),
(5, 4, 'accepted'),
(4, 5, 'pending');

-- =================
-- RATINGS
-- =================
INSERT INTO ratings (exchange_id, rater_id, rated_user_id, score, comment) VALUES
(1, 2, 1, 5, 'Excellent collaboration!'),
(4, 5, 4, 4, 'Good work, very satisfied');

-- =================
-- USER ACTIVITY
-- =================
INSERT INTO user_activity (user_id, skill_id, action) VALUES
(1, 1, 'view'),
(2, 2, 'search'),
(3, 3, 'view'),
(4, 4, 'search'),
(5, 5, 'view');