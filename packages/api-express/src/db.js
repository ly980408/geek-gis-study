const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'geek_gis',
  user: process.env.DB_USER || 'liyang',
  password: process.env.DB_PASSWORD || '123456',
});

pool.on('error', (err) => {
  console.error('数据库连接池异常：', err);
});

module.exports = pool;
