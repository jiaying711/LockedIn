// db.js handles how the code will connect with the SQL database.

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a connection pool
//    Instead of opening and closing database connections for each operation,
//    a pool is made of reusable connections
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'lockedinuser',
  password: process.env.DB_PASSWORD || 'glockedin',
  database: process.env.DB_NAME || 'lockedin',
  waitForConnections: true,
  connectionLimit: 10
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

// Makes the connection pool available to other parts of the application
module.exports = {
  pool,
  testConnection
};
