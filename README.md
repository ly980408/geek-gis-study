# 🌍 Geek GIS Study

> 前端全栈 + WebGIS 学习之旅 monorepo

## 📁 目录结构

```
geek-gis-study/
├── Dockerfile              # API 服务容器构建
├── docker-compose.yml      # 服务编排（db + api）
├── .dockerignore
├── packages/
│   ├── api-express/        # Phase 1：Node.js + Express 后端
│   ├── web-gis/            # Phase 2：WebGIS 前端应用
│   └── shared/             # 公共工具库
├── notes/                  # 学习笔记（Markdown）
└── scripts/                # 辅助脚本
```

## 🚀 快速开始

### 开发模式（本地 API + Docker 数据库）

```bash
# 启动数据库
docker compose up db -d

# 启动 API 服务（热重载）
pnpm dev:api
```

### 全容器模式

```bash
docker compose up -d
```

访问 `http://localhost:3000/api/devices`

## 📦 技术栈

- **后端**：Node.js + Express
- **数据库**：PostgreSQL 16 + PostGIS 3.4
- **容器化**：Docker Compose
- **空间查询**：ST_DWithin / ST_Distance（PostGIS）

## 📅 学习进度

| 阶段 | 时间 | 状态 |
|------|------|------|
| Phase 1: 后端筑基 | 第1~3个月 | 📝 进行中 |
| Phase 2: WebGIS 突破 | 第4~6个月 | ⏳ 待开始 |
| Phase 3: 深度强化 | 第7~9个月 | ⏳ 待开始 |
| Phase 4: 综合提升 | 第10~12个月 | ⏳ 待开始 |

## 📖 笔记索引

| 周次 | 标题 | 链接 |
|------|------|------|
| 第1周 | Express + 数据库 + Docker（已完成 ✓） | [notes/01-express-hello.md](./notes/01-express-hello.md) |
