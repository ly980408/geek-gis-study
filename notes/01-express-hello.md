# 第1周：Express 起步 + 数据库接入

## 学习日期
2026-05-18 ~ 2026-05-19

## 已掌握的知识点

### Express 基础
- `app.get()`、`app.post()`、`app.delete()` 路由定义
- `app.use(express.json())` — JSON 请求体解析中间件
- `app.listen()` 启动服务
- **路由拆分**：`express.Router()` 提取独立路由模块

### RESTful 接口设计
- `GET /api/devices` — 获取资源列表
- `GET /api/devices/nearby/query` — PostGIS 空间距离查询
- `GET /api/devices/:id` — 获取单个资源（URL 参数）
- `POST /api/devices` — 创建资源（请求体传参）
- `DELETE /api/devices/:id` — 删除资源
- **注意**：`/nearby/query` 必须放在 `/:id` 前面，否则会被当成 id 匹配

### 请求参数处理
| 参数类型 | 获取方式 | 示例 |
|---------|---------|------|
| Query 参数 | `req.query.name` | `?lat=36.65&lng=117.12&radius=5` |
| 路径参数 | `req.params.id` | `/api/devices/1` |
| 请求体 | `req.body` | POST 请求 JSON |

### PostgreSQL + PostGIS
- **安装方式**：Docker（OrbStack）`postgis/postgis:16-3.4`
- **连接方式**：Node.js `pg` 模块 + Pool 连接池
- **环境变量配置**：`DB_HOST`、`DB_PORT`、`DB_NAME`、`DB_USER`、`DB_PASSWORD`
- **核心区别**：相比 MySQL，PostGIS 提供空间数据类型和函数
- **空间字段**：`GEOMETRY(POINT, 4326)` — 4326 是 WGS84 经纬度坐标系
- **空间函数**：
  - `ST_MakePoint(lng, lat)` — 创建点
  - `ST_SetSRID(geom, 4326)` — 设置坐标系
  - `ST_DWithin(geom1, geom2, distance)` — 距离范围内查询（单位：米）
  - `ST_Distance(geom1, geom2)` — 计算两点距离（单位：米）
- **空间索引**：`CREATE INDEX ... ON devices USING GIST (geom)`

### Docker 容器化
- **Dockerfile**：多阶段构建，Alpine 镜像，暴露 3000 端口
- **docker-compose.yml**：编排 db + api 两个服务，健康检查确保启动顺序
- **init.sql**：容器首次启动自动建表、建索引、插入初始数据
- **数据持久化**：命名卷 `pgdata` 存储数据库文件

### 项目结构
```
geek-gis-study/
├── Dockerfile                    ← API 服务构建
├── docker-compose.yml            ← 容器编排
├── .dockerignore                 ← 构建排除配置
├── packages/
│   └── api-express/src/
│       ├── index.js              ← 入口：中间件 + 路由注册
│       ├── db.js                 ← 数据库连接池（支持环境变量）
│       ├── init.sql              ← 数据库自动初始化
│       └── routes/
│           └── devices.js        ← 设备 CRUD + 空间查询
├── notes/
│   └── 01-express-hello.md       ← 本周笔记
└── README.md
```

## 问题记录

| 日期 | 问题 | 解决方式 |
|------|------|----------|
| 2026-05-19 | PostGIS 扩展与本地 PostgreSQL 版本不匹配 | 改用 Docker 容器运行 PostGIS |
| 2026-05-19 | 表已存在但代码报错"relation not exists" | 本地 PostgreSQL 服务与 Docker 冲突，停掉本地服务 |
| 2026-05-19 | 路由 `/:id` 拦截了 `/nearby/query` | 特定路由放在动态参数路由前面 |
| 2026-05-19 | db.js 硬编码连接信息，本地/Docker 两套 | 改为环境变量配置，默认值兼容本地开发 |

## 常用命令

```bash
# ---- 开发模式 (本地 API + Docker DB) ----
docker compose up db -d               # 启动数据库
pnpm dev:api                           # 启动 API 服务

# ---- 全容器模式 ----
docker compose up -d                   # 启动全部服务

# ---- 数据库操作 ----
docker exec -it geek-gis-db psql -U ${DB_USER} -d geek_gis

# ---- 清理 ----
docker compose down -v                 # 停止并删除数据卷
```

## 下一步
- 给设备加 PUT 更新接口（补全 CRUD）
- Phase 2：WebGIS 前端 — Leaflet 地图展示设备位置
