# 第1周：Express 起步

## 学习日期
2026-05-18

## 目标
搭建第一个 Express API 服务，跑通 Hello World，并实现设备 CRUD。

## 已掌握的知识点

### Express 基础
- `app.get()`、`app.post()`、`app.delete()` 路由定义
- `app.use(express.json())` — JSON 请求体解析中间件
- `app.listen()` 启动服务

### RESTful 接口设计
- `GET /api/devices` — 获取资源列表
- `GET /api/devices/:id` — 获取单个资源（URL 参数）
- `POST /api/devices` — 创建资源（请求体传参）
- `DELETE /api/devices/:id` — 删除资源

### 请求参数处理
| 参数类型 | 获取方式 | 示例 |
|---------|---------|------|
| Query 参数 | `req.query.name` | `?name=WebGIS` |
| 路径参数 | `req.params.id` | `/api/devices/1` |
| 请求体 | `req.body` | POST 请求 JSON |

### 核心概念
- `res.json()` — 返回 JSON 响应
- `res.status(201)` — 设置 HTTP 状态码
- `res.status(404).json()` — 错误响应
- 输入校验：`if (!name || !type)` 返回 400

### 设备数据模型
```javascript
{
  id: Number,       // 唯一标识
  name: String,     // 设备名称（含编号）
  type: String,     // 设备类型（temperature / humidity / air / wind）
  lat: Number,      // 纬度（预留 GIS 能力）
  lng: Number,      // 经度（预留 GIS 能力）
  status: String    // online / offline
}
```

## 问题记录

| 日期 | 问题 | 解决方式 |
|------|------|----------|
| - | - | - |

## 下一步
- 路由拆分 — 把设备路由抽成独立文件
- 更完整的 HTTP 方法（PUT 更新）
- 接入真实数据库（PostgreSQL）
