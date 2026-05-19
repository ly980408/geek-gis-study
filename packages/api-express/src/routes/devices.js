const express = require('express');
const router = express.Router();
const pool = require('../db');

// 获取所有设备
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, type, lat, lng, status, created_at FROM devices ORDER BY id',
    );
    res.json({ data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 查找附近设备（按公里半径）
router.get('/nearby/query', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng || !radius) {
      return res.status(400).json({ error: '需要提供 lat、lng、radius 参数' });
    }
    const result = await pool.query(
      `SELECT id, name, type, lat, lng, status,
              ST_Distance(
                geom,
                ST_SetSRID(ST_MakePoint($2, $1), 4326)
              ) / 1000 AS distance_km
       FROM devices
       WHERE ST_DWithin(
         geom,
         ST_SetSRID(ST_MakePoint($2, $1), 4326),
         $3 * 1000
       )
       ORDER BY distance_km`,
      [lat, lng, radius],
    );
    res.json({ data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取单个设备
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, type, lat, lng, status, created_at FROM devices WHERE id = $1',
      [req.params.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '设备未找到' });
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 新增设备
router.post('/', async (req, res) => {
  try {
    const { name, type, lat, lng } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'name 和 type 是必填字段' });
    }

    const result = await pool.query(
      `INSERT INTO devices (name, type, lat, lng, geom)
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($4, $3), 4326))
       RETURNING id, name, type, lat, lng, status, created_at`,
      [name, type, lat || 0, lng || 0],
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除设备
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM devices WHERE id = $1 RETURNING id',
      [req.params.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '设备未找到' });
    }
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
