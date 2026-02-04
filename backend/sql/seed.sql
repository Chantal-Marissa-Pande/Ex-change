-- USERS
INSERT INTO users (name, email, password_hash)
VALUES 
('Alice Williams', 'alice.williams@example.com', 'hashedpass1'),
('Bob Smith', 'bob.smith@example.com', 'hashedpass2'),
('Carol Jones', 'carol.jones@example.com', 'hashedpass3'),
('David Kim', 'david.kim@example.com', 'hashedpass4');

-- SKILLS (DIVERSE)
INSERT INTO skills (title, category, tags)
VALUES
('Web Development', 'Technology', 'web,frontend,backend,html,css,js'),
('Python Programming', 'Technology', 'python,coding,automation'),
('Data Analysis', 'Technology', 'data,analytics,excel,sql,python'),
('Graphic Design', 'Creative', 'design,creative,photoshop,illustrator'),
('Plumbing', 'Trades', 'plumbing,repair,home'),
('Cooking', 'Culinary', 'cooking,recipes,food'),
('Public Speaking', 'Soft Skills', 'communication,speaking,presentation'),
('Photography', 'Creative', 'photography,camera,editing'),
('Yoga Instruction', 'Wellness', 'yoga,fitness,health'),
('Gardening', 'Hobby', 'plants,gardening,outdoors');

-- USER SKILL DETAILS
INSERT INTO skill_detail (user_id, skill_id, level, years_experience, description)
VALUES
(1, 1, 'Intermediate', 2, 'Built several websites using HTML, CSS, JS'),
(1, 2, 'Beginner', 1, 'Learning Python for automation tasks'),
(1, 6, 'Intermediate', 3, 'Enjoy cooking international recipes'),
(2, 4, 'Advanced', 5, 'Professional graphic designer'),
(2, 5, 'Intermediate', 4, 'Fixed plumbing in multiple homes'),
(2, 7, 'Beginner', 1, 'Started public speaking classes'),
(3, 3, 'Expert', 6, 'Experienced in data analysis with Python and SQL'),
(3, 8, 'Intermediate', 2, 'Photography hobbyist, portrait and landscape'),
(4, 9, 'Advanced', 4, 'Certified yoga instructor'),
(4, 10, 'Intermediate', 3, 'Maintains a home vegetable garden');

-- LISTINGS (EXCHANGE POSTS)
INSERT INTO listings (user_id, skill_offered_detail_id, skill_requested_id, description)
VALUES
(1, 1, 3, 'Offering Web Development in exchange for Data Analysis'),
(1, 6, 5, 'Offering Cooking in exchange for Plumbing help'),
(2, 4, 2, 'Offering Graphic Design for Python Programming help'),
(2, 5, 6, 'Offering Plumbing in exchange for Cooking lessons'),
(3, 3, 1, 'Offering Data Analysis in exchange for Web Development tips'),
(4, 9, 8, 'Offering Yoga classes for Photography tips');

-- EXCHANGES (REQUESTS)
INSERT INTO exchanges (requester_id, listing_id, status)
VALUES
(2, 1, 'pending'),
(3, 1, 'accepted'),
(1, 3, 'pending'),
(4, 2, 'pending');

-- USER ACTIVITY
INSERT INTO user_activity (user_id, skill_id, action)
VALUES
(1, 1, 'search'),
(1, 6, 'view'),
(2, 2, 'view'),
(2, 5, 'search'),
(3, 3, 'request'),
(4, 9, 'view');