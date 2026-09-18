USE quillory;

CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    bio_description TEXT,
    facebook_url VARCHAR(255),
    twitter_url VARCHAR(255),
    instagram_url VARCHAR(255),
    linkedIn_url VARCHAR(255),
    avatar_url VARCHAR(255) DEFAULT 'pf.jpg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Post (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_description LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Post_Tags (
    post_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES Tags(tag_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Dummy Data
INSERT IGNORE INTO Users (user_id, username, email, password, bio_description) 
VALUES (1, 'QuilloryWriter', 'writer@quillory.com', '$2b$10$kRgt6eqiSHq2Fk6Fv5Dm/ej5Bu6ycgIb4wRRAmrw6/DLyGDykL762', 'Just a dummy writer testing the platform!');

INSERT IGNORE INTO Post (post_id, user_id, title, content_description) VALUES
(1, 1, 'The Future of Web Development', '<p>Web development is evolving rapidly. In this post, we explore <strong>Node.js</strong> and <em>MySQL</em> integration.</p>'),
(2, 1, 'A Day in the Life of a Developer', '<p>Today was a busy day. I woke up, drank some coffee, and wrote some code.</p>'),
(3, 1, 'Why Quillory is the Best Platform', '<p>If you are looking for a clean, creative space to write, <strong>Quillory</strong> is the place to be.</p>');

INSERT IGNORE INTO Tags (tag_name) VALUES ('Tech'), ('Lifestyle'), ('News'), ('Fiction');

INSERT IGNORE INTO Post_Tags (post_id, tag_id) VALUES 
(1, (SELECT tag_id FROM Tags WHERE tag_name = 'Tech')),
(1, (SELECT tag_id FROM Tags WHERE tag_name = 'News')),
(2, (SELECT tag_id FROM Tags WHERE tag_name = 'Lifestyle')),
(3, (SELECT tag_id FROM Tags WHERE tag_name = 'News')),
(3, (SELECT tag_id FROM Tags WHERE tag_name = 'Fiction'));