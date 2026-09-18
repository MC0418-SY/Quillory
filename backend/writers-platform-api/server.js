import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { pool } from './config/db.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Middleware
app.use(cors());
app.use(express.json());

// ADD THIS BLOCK TO DISABLE CSP ERRORS
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' * data: blob:;");
    res.removeHeader('X-Content-Security-Policy');
    next();
});


// Tell Express to serve all frontend files from the root folder (go up TWO directories)
app.use(express.static(path.join(__dirname, '..', '..')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer Storage Configuration (Save to disk)
// Multer Storage Configuration (Save to disk)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // USE ABSOLUTE PATH
        cb(null, path.join(__dirname, 'uploads')); 
    },
    filename: function (req, file, cb) {
        cb(null, 'user_' + req.params.id + '_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});


// Make the uploads folder public (USE ABSOLUTE PATH)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- AUTH ROUTES ---

// REGISTER: Create a new user
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const [existingUsers] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO Users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        const token = jwt.sign({ id: result.insertId }, 'quillory_secret_key', { expiresIn: '1h' });

        res.status(201).json({ success: true, token, userId: result.insertId });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// LOGIN: Authenticate an existing user
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        const user = users[0];

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.user_id }, 'quillory_secret_key', { expiresIn: '1h' });

        res.status(200).json({ success: true, token, userId: user.user_id });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// --- USER ROUTES ---

// FETCH User Data
app.get('/api/users/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT user_id, username, email, bio_description, avatar_url, facebook_url, twitter_url, instagram_url, linkedIn_url FROM Users WHERE user_id = ?', 
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// UPDATE User Details (Username, Bio, Socials) - Email is excluded!
app.put('/api/users/:id', async (req, res) => {
    const { username, bio_description, facebook_url, twitter_url, instagram_url, linkedIn_url } = req.body;
    
    try {
        const [result] = await pool.query(
            `UPDATE Users 
             SET username = ?, bio_description = ?, facebook_url = ?, twitter_url = ?, instagram_url = ?, linkedIn_url = ? 
             WHERE user_id = ?`,
            [username, bio_description, facebook_url, twitter_url, instagram_url, linkedIn_url, req.params.id]
        );
        
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Username already exists.' });
        }
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// UPLOAD Profile Picture
app.put('/api/users/:id/avatar', upload.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded or file too large (Max 2MB)' });
    
    const avatarUrl = `/uploads/${req.file.filename}`;
    try {
        await pool.query('UPDATE Users SET avatar_url = ? WHERE user_id = ?', [avatarUrl, req.params.id]);
        res.status(200).json({ success: true, avatar_url: avatarUrl });
    } catch (error) {
        console.error('Error uploading picture:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// --- POST ROUTES ---

// 1. CREATE: Write a new post (with tags)
app.post('/api/posts', async (req, res) => {
    const { user_id, title, content_description, tags } = req.body;

    if (!user_id || !title || !content_description) {
        return res.status(400).json({ message: 'user_id, title, and content_description are required' });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [postResult] = await conn.query(
            'INSERT INTO Post (user_id, title, content_description) VALUES (?, ?, ?)',
            [user_id, title, content_description]
        );
        const postId = postResult.insertId;

        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                await conn.query('INSERT IGNORE INTO Tags (tag_name) VALUES (?)', [tagName]);
                const [tagRows] = await conn.query('SELECT tag_id FROM Tags WHERE tag_name = ?', [tagName]);
                await conn.query('INSERT INTO Post_Tags (post_id, tag_id) VALUES (?, ?)', [postId, tagRows[0].tag_id]);
            }
        }

        await conn.commit();
        res.status(201).json({ success: true, postId: postId });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        conn.release();
    }
});

// 2. READ: Fetch all posts (or filter by user)
app.get('/api/posts', async (req, res) => {
    try {
        let query = `
            SELECT p.post_id, p.user_id, p.title, p.content_description, p.created_at, u.username AS author,
                   GROUP_CONCAT(t.tag_name) AS tags_string
            FROM Post p
            JOIN Users u ON p.user_id = u.user_id
            LEFT JOIN Post_Tags pt ON p.post_id = pt.post_id
            LEFT JOIN Tags t ON pt.tag_id = t.tag_id
            WHERE p.deleted_at IS NULL
        `;
        const params = [];

        if (req.query.userId) {
            query += ` AND p.user_id = ?`;
            params.push(req.query.userId);
        }

        query += ` GROUP BY p.post_id, u.username ORDER BY p.created_at DESC`;

        const [rows] = await pool.query(query, params);
        
        const formattedPosts = rows.map(post => {
            const tagsArray = post.tags_string ? post.tags_string.split(',') : [];
            const { tags_string, ...postWithoutTagsString } = post;
            return { ...postWithoutTagsString, tags: tagsArray };
        });

        res.status(200).json({ success: true, data: formattedPosts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// 3. READ SINGLE: Fetch one post by ID (for the Edit page)
app.get('/api/posts/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.post_id, p.title, p.content_description, p.user_id, u.username AS author,
                   GROUP_CONCAT(t.tag_name) AS tags_string
            FROM Post p
            JOIN Users u ON p.user_id = u.user_id
            LEFT JOIN Post_Tags pt ON p.post_id = pt.post_id
            LEFT JOIN Tags t ON pt.tag_id = t.tag_id
            WHERE p.post_id = ? AND p.deleted_at IS NULL
            GROUP BY p.post_id, u.username
        `, [req.params.id]);

        if (rows.length === 0) return res.status(404).json({ message: 'Post not found' });

        const post = rows[0];
        post.tags = post.tags_string ? post.tags_string.split(',') : [];
        delete post.tags_string;

        res.status(200).json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// 4. UPDATE: Edit a post (including tags)
app.put('/api/posts/:id', async (req, res) => {
    const { title, content_description, tags } = req.body;
    const postId = req.params.id;
    
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.query(
            'UPDATE Post SET title = ?, content_description = ? WHERE post_id = ? AND deleted_at IS NULL',
            [title, content_description, postId]
        );

        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Post not found' });
        }

        if (tags !== undefined) {
            await conn.query('DELETE FROM Post_Tags WHERE post_id = ?', [postId]);

            if (tags.length > 0) {
                for (const tagName of tags) {
                    await conn.query('INSERT IGNORE INTO Tags (tag_name) VALUES (?)', [tagName]);
                    const [tagRows] = await conn.query('SELECT tag_id FROM Tags WHERE tag_name = ?', [tagName]);
                    if (tagRows.length > 0) {
                        await conn.query('INSERT INTO Post_Tags (post_id, tag_id) VALUES (?, ?)', [postId, tagRows[0].tag_id]);
                    }
                }
            }
        }

        await conn.commit();
        res.status(200).json({ success: true, message: 'Post updated successfully' });

    } catch (error) {
        await conn.rollback();
        console.error('Error updating post:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        conn.release();
    }
});

// 5. DELETE: Soft delete a post
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'UPDATE Post SET deleted_at = CURRENT_TIMESTAMP WHERE post_id = ? AND deleted_at IS NULL',
            [req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Post not found' });
        res.status(200).json({ success: true, message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));