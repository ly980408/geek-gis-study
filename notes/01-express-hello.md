# 第1周：Express 起步 + 数据库接入

## 已掌握的知识点

### Express 基础
- `app.get()`、`app.post()`、`app.delete()` 路由定义
- `app.use(express.json())` — JSON 请求体解析中间件
- `app.listen()` 启动服务
- **路由拆分**：`express.Router()` 提取独立路由模块

### RESTful 接口设计
- `GET /api/devices` — 获取资源列表
- `GET /api/devices/:id` — 获取单个资源（URL 参数）
- `POST /api/devices` — 创建资源（请求体传参）
- `DELETE /api/devices/:id` — 删除资源

### 请求参数处理
| 参数类型 | 获取方式 | 示例 |
|---------|---------|------|
| Query 参数 | `req.query.name` | `?lat=36.65&lng=117.12&radius=5` |
| 路径参数 | `req.params.id` | `/api/devices/1` |
| 请求体 | `req.body` | POST 请求 JSON |

### PostgreSQL + PostGIS
- **安装方式**：Docker（OrbStack）`postgis/postgis:16-3.4`
- **连接方式**：Node.js `pg` 模块 + Pool 连接池
- **核心区别**：相比 MySQL，PostGIS 提供空间数据类型和函数
- **空间字段**：`GEOMETRY(POINT, 4326)` — 4326 是 WGS84 经纬度坐标系
- **空间函数**：
  - `ST_MakePoint(lng, lat)` — 创建点
  - `ST_SetSRID(geom, 4326)` — 设置坐标系
  - `ST_DWithin(geom1, geom2, distance)` — 距离范围内查询（单位：米）
  - `ST_Distance(geom1, geom2)` — 计算两点距离（单位：米）

### 项目结构
```
packages/api-express/src/
├── index.js          ← 入口：中间件 + 路由注册
├── db.js             ← 数据库连接池
└── routes/
    └── devices.js    ← 设备 CRUD + 空间查询
```

## 问题记录

| 日期 | 问题 | 解决方式 |
|------|------|----------|
| 2026-05-19 | PostGIS 扩展与本地 PostgreSQL 版本不匹配 | 改用 Docker 容器运行 PostGIS |
| 2026-05-19 | 表已存在但代码报错"relation not exists" | 本地 PostgreSQL 服务与 Docker 冲突，停掉本地服务 |
| 2026-05-19 | 路由 `/:id` 拦截了 `/nearby/query` | 特定路由放在动态参数路由前面 |

## 下一步
- 完善设备 CRUD（PUT 更新）
- 添加空间索引提升查询性能
- 设备数据初始化脚本
