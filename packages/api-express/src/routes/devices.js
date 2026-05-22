const express = require('express')
const router = express.Router()
const pool = require('../db')

// 获取所有设备（支持 ?type=xxx 过滤）
router.get('/', async (req, res) => {
  try {
    const { type } = req.query
    let query = 'SELECT id, name, type, lat, lng, status, created_at FROM devices'
    const params = []

    if (type) {
      query += ' WHERE type = $1'
      params.push(type)
    }
    query += ' ORDER BY id'

    const result = await pool.query(query, params)
    res.json({ data: result.rows, total: result.rowCount })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 查找附近设备（按公里半径）
router.get('/nearby/query', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query
    if (!lat || !lng || !radius) {
      return res.status(400).json({ error: '需要提供 lat、lng、radius 参数' })
    }
    const result = await pool.query(
      `SELECT id, name, type, lat, lng, status,
              ST_Distance(
                geom::geography,
                ST_SetSRID(ST_MakePoint($2::numeric, $1::numeric), 4326)::geography
              ) / 1000 AS distance_km
       FROM devices
       WHERE ST_DWithin(
         geom::geography,
         ST_SetSRID(ST_MakePoint($2::numeric, $1::numeric), 4326)::geography,
         $3::numeric * 1000
       )
       ORDER BY distance_km`,
      [lat, lng, radius]
    )
    res.json({ data: result.rows, total: result.rowCount })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 获取单个设备
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, type, lat, lng, status, created_at FROM devices WHERE id = $1',
      [req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '设备未找到' })
    }
    res.json({ data: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 新增设备
router.post('/', async (req, res) => {
  try {
    const { name, type, lat, lng, status } = req.body
    if (!name || !type) {
      return res.status(400).json({ error: 'name 和 type 是必填字段' })
    }
    if (
      (lat !== undefined && lat !== null && isNaN(Number(lat))) ||
      (lng !== undefined && lng !== null && isNaN(Number(lng)))
    ) {
      return res.status(400).json({ error: 'lat 和 lng 必须是有效数值' })
    }

    const result = await pool.query(
      `INSERT INTO devices (name, type, lat, lng, status, geom)
       VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($4, $3), 4326))
       RETURNING id, name, type, lat, lng, status, created_at`,
      [name, type, lat ?? null, lng ?? null, status ?? 'offline']
    )
    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 更新设备
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, type, lat, lng, status } = req.body

    const result = await pool.query(
      `UPDATE devices SET
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        lat = COALESCE($3, lat),
        lng = COALESCE($4, lng),
        status = COALESCE($5, status),
        geom = CASE
          WHEN $3 IS NOT NULL OR $4 IS NOT NULL
          THEN ST_SetSRID(ST_MakePoint(
            COALESCE($4, lng),
            COALESCE($3, lat)
          ), 4326)
          ELSE geom
        END
       WHERE id = $6
       RETURNING id, name, type, lat, lng, status, created_at`,
      [name ?? null, type ?? null, lat ?? null, lng ?? null, status ?? null, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '设备未找到' })
    }
    res.json({ data: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 删除设备
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM devices WHERE id = $1 RETURNING id', [
      req.params.id,
    ])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '设备未找到' })
    }
    res.json({ message: '删除成功' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

module.exports = router
