import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'shop_db',
  waitForConnections:true,
});

db.getConnection()
  .then(() => console.log('✅ Connected to MySQL successfully!'))
  .catch((err) => console.error('❌ MySQL connection error:', err.message));
