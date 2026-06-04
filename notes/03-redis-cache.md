# 第3周：Redis 缓存 — Phase 3 ✅ 已完成

## 学习日期
2026-06-04

## 目标场景
为 `GET /api/devices/nearby/query` 空间范围查询添加 Redis 缓存层。

## 实施记录

### 1. 引入 Redis
- docker-compose 添加 `redis:7-alpine` 服务，端口 6379
- API 服务添加 `depends_on: redis` 健康检查
- `.env` 添加 `REDIS_HOST` / `REDIS_PORT`
- ioredis npm 包（Node.js 官方推荐）

### 2. 缓存实现
- `cache.js`：封装 Redis 连接和缓存操作
- 缓存 key：`nearby:{lat_rounded}:{lng_rounded}:{radius}`（保留 3 位小数）
- TTL：300 秒（5 分钟）
- Cache-aside：读 → 缓存命中直接返回，否则查 DB → 写缓存 → 返回

### 3. 缓存失效
- POST / PUT / DELETE 操作后 `clearNearbyCache()` 清空所有 nearby:* key
- 验证：POST 新设备后 nearby 查询重新执行，未返回 stale 数据

## 验证结果

第一次请求（查 DB，写缓存）：
```json
{ "data": [...], "total": 3 }
```

第二次请求（命中缓存）：
```json
{ "data": [...], "total": 3, "cached": true }
```

POST 新设备后查询（新设备出现在结果中，缓存已失效）。

## 核心概念

### Cache-aside 模式
```
读：cache hit → 直接返回
    cache miss → DB 查询 → 写入 cache → 返回

写：DB 操作 → 删除 cache（不是更新 cache，避免一致性问题）
```

### 为什么用删除而不是更新
更新缓存风险：如果 DB 写入成功但 cache 更新失败，数据不一致。删除是最安全的降级策略。

### TTL 设计
- nearby 查询 5 分钟：设备位置短期内不会变，但也不能让 stale 数据长期存在
- 过短：缓存失去意义，频繁查 DB
- 过长：设备增删改后数据 stale

## 项目结构（更新后）
```
packages/api-express/src/
├── index.js              ← Redis 客户端初始化
├── db.js                 ← PostgreSQL 连接池
├── cache.js              ← Redis 缓存工具（新增）
└── routes/
    └── devices.js         ← nearby 查询 + 缓存失效
```

## 下一步（可选）
- [ ] 结构化日志（Pino）
- [ ] 统一错误处理中间件
- [ ] 环境配置管理（dev/test/prod）
- [ ] 缓存穿透防护（热点 key 加锁）
- [ ] 精确缓存失效（只清除受影响的 cache key，而不是全清）
