# 🌍 Geek GIS Study

> 前端全栈 + WebGIS 学习之旅 monorepo

## 📁 目录结构

```
geek-gis-study/
├── Dockerfile              # API 服务容器构建
├── docker-compose.yml      # 服务编排（db + api + redis）
├── .dockerignore
├── packages/
│   ├── api-express/        # Phase 1：Node.js + Express 后端
│   ├── web-gis/            # Phase 2：WebGIS 前端应用
│   └── shared/             # 公共工具库
├── notes/                  # 学习笔记（Markdown）
└── scripts/                # 辅助脚本
```

## 🚀 快速开始

### 本地开发模式

#### 1. 启动数据库和 Redis
```bash
docker compose up db redis -d
```

#### 2. 启动后端 API（热重载）
```bash
pnpm dev:api
```
访问 `http://localhost:3000/api/devices`

#### 3. 启动前端开发服务器
```bash
pnpm dev:web
```
浏览器打开 `http://localhost:5173`

### 全容器模式
```bash
docker compose up -d
```

## ⚙️ 环境配置

复制 `.env.example` 为 `.env` 并按需修改：
```bash
cp .env.example .env
```

## 📦 技术栈

- **后端**：Node.js + Express
- **数据库**：PostgreSQL 16 + PostGIS 3.4
- **缓存**：Redis 7
- **前端**：Vue 3 + Vite + Leaflet
- **容器化**：Docker Compose

## 📅 学习进度

各阶段详情、学习笔记和问题记录见 `notes/` 目录下的笔记文件。

## 📖 笔记索引

| 周次 | 标题 | 链接 |
|------|------|------|
| 第1周 | Express + PostGIS + 完整 CRUD + Docker | [notes/01-express-hello.md](./notes/01-express-hello.md) |
| 第2周 | Vue 3 + Leaflet 地图可视化 | [notes/02-webgis-leaflet.md](./notes/02-webgis-leaflet.md) |
| 第3周 | Redis 缓存 — nearby 查询加速 | [notes/03-redis-cache.md](./notes/03-redis-cache.md) |
