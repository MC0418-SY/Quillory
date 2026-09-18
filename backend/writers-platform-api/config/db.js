import mysql from 'mysql2/promise';
import 'dotenv/config';

// Create a connection pool
export const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 's24104152_quillory',
    password: process.env.DB_PASSWORD || 'cheyenne',
    database: process.env.DB_NAME || 's24104152_quillory',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});