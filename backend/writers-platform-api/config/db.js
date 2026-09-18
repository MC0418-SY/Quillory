import mysql from 'mysql2/promise';
import 'dotenv/config';

export const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'quillory_user',
    password: process.env.DB_PASSWORD || 'quillory_pass',
    database: process.env.DB_NAME || 'quillory',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});