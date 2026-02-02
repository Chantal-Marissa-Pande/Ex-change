-- USERS
INSERT INTO users (name, email, password_hash)
VALUES 
('Alice', 'alice@example.com', 'hashedpassword1'),
('Bob', 'bob@example.com', 'hashedpassword2');

-- SKILLS
INSERT INTO skills (title, description, tags)
VALUES
('Web Development', 'Frontend and backend development', 'web,frontend,backend'),
('Graphic Design', 'Designing visuals and graphics', 'design,graphic,creative'),
('Plumbing', 'Water systems and pipes', 'plumbing,repair,home'),
('Data Science', 'Data analysis and ML', 'data,python,ml'),
('React', 'React frontend framework', 'web,frontend,react');

-- USER SKILLS
INSERT INTO user_skills (user_id, skill_id, level)
VALUES
(1, 1, 'Intermediate'),
(1, 5, 'Beginner'),
(2, 2, 'Advanced'),
(2, 3, 'Intermediate');

-- LISTINGS
INSERT INTO listings (user_id, skill_offered_id, skill_requested_id, description)
VALUES
(1, 1, 2, 'Alice offers web dev in exchange for graphic design'),
(2, 3, 4, 'Bob offers plumbing in exchange for data science');

-- EXCHANGES
INSERT INTO exchanges (requester_id, listing_id, status)
VALUES
(2, 1, 'pending'),
(1, 2, 'pending');

-- USER ACTIVITY
INSERT INTO user_activity (user_id, skill_id, action)
VALUES
(1, 1, 'search'),
(1, 5, 'view'),
(2, 2, 'view'),
(2, 3, 'search');