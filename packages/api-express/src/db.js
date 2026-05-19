const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'geek_gis',
  user: 'liyang',
  password: '123456',
});

pool.on('error', (err) => {
  console.error('数据库连接池异常：', err);
});

module.exports = pool;
