# 第2周：Vue 3 + Leaflet 地图可视化（Phase 2 启动）

## 学习日期
2026-05-22

## 架构选型
- **前端框架**：Vue 3（Composition API + `<script setup>`）
- **构建工具**：Vite 6
- **地图库**：Leaflet 1.9
- **数据来源**：Phase 1 的 Express API（`GET /api/devices`）

## 项目结构（web-gis）

```
packages/web-gis/
├── package.json              ← 依赖：vue, leaflet, vite, @vitejs/plugin-vue
├── vite.config.js            ← Vite 配置 + API 代理
├── index.html                ← 入口 HTML
└── src/
    ├── main.js               ← Vue 应用入口
    ├── App.vue               ← 根组件
    ├── components/
    │   └── MapView.vue       ← 地图容器 + Marker 渲染
    └── composables/
        └── useDevices.js     ← 设备数据获取（Composable 封装）
```

## 核心知识点

### 1. Vite 开发代理解决跨域

`vite.config.js` 中配置 `server.proxy`，将 `/api` 请求转发到后端 3000 端口，开发时无需配置 CORS。

### 2. Composable 封装数据请求

将设备数据获取抽离为 `useDevices()` 组合式函数，管理 `devices` / `loading` / `error` 三态，组件调用后直接消费响应式数据，实现关注点分离。

### 3. Leaflet 地图初始化

`onMounted` 中通过 `L.map(domRef)` 创建地图实例（中心点 [36.65, 117.05]，缩放 12），`L.tileLayer()` 加载底图瓦片（使用 CartoDB light，无需 Key 且国内可稳定访问）。

### 4. CircleMarker 渲染空间数据

用 `L.circleMarker` 替代默认 `L.marker`，避免图标路径问题，且样式可控（半径、填充色、边框）。通过 `fillColor` 映射 `typeColors` 按设备类型着色（温度=橙、湿度=蓝、空气=绿），`bindPopup()` 绑定点击弹窗显示设备详情。

### 5. watch 响应式渲染标记

通过 `watch(devices)` 监听数据变化，使用 `L.layerGroup()` 统一管理标记，变化时 `clearLayers()` 整组替换。新数据渲染后用 `map.fitBounds()` 自动调整视口适配所有设备。

## 交互功能
| 功能 | 实现方式 |
|------|---------|
| 设备按类型着色 | `circleMarker.fillColor` 映射 `typeColors` |
| 点击弹窗 | `bindPopup(html)` 显示名称、类型、状态、经纬度 |
| 图例 | CSS 浮动卡片 + 色点对应各类型 |
| 状态提示 | 加载中 / 加载失败 顶部浮动条 |
| 自适应视野 | `fitBounds()` 计算所有标记的包围盒 |

## 运行方式
```bash
# 1. 启动数据库
docker compose up db -d

# 2. 启动后端 API（新终端）
pnpm dev:api

# 3. 启动前端开发服务器（新终端）
pnpm dev:web

# 浏览器打开 http://localhost:5173
```

## 与 Phase 1 的衔接
- 前端通过 Vite 代理访问后端 `/api/devices` 接口
- 后端返回的设备数据直接渲染为 Leaflet 地图标记
- 数据库中的 `lat` / `lng` 字段在此真正发挥作用

## 问题记录
| 日期 | 问题 | 解决方式 |
|------|------|----------|
| 2026-05-22 | Leaflet 默认 Marker 图标在构建后显示异常 | 改用 `circleMarker` 替代，样式更可控且无图标路径问题 |
| 2026-05-22 | `watch` 触发时 map 可能尚未初始化 | 添加 `if (!map || !markersLayer) return` 守卫条件 |

## 项目结构（更新后）

```
packages/web-gis/
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.js
    ├── App.vue
    ├── api/                          ← 新增：API 封装层
    │   ├── request.js                ←   第1层：统一 HTTP 客户端
    │   └── devices.js                ←   第2层：设备业务接口
    ├── components/
    │   └── MapView.vue
    └── composables/
        └── useDevices.js             ← 第3层：组合式函数（消费 api 层）
```

## API 三层封装架构（新增）

将 HTTP 请求分为三层，职责清晰：

| 层 | 文件 | 职责 |
|---|------|------|
| 1. HTTP 客户端 | `api/request.js` | 统一 baseURL、超时控制（10s）、错误处理，预留拦截器扩展点 |
| 2. 业务接口 | `api/devices.js` | 按业务定义命名函数（`getDevices` `createDevice` 等），在这里解包后端 `{ data, total }` 格式 |
| 3. Composable | `composables/useDevices.js` | 管理响应式状态（数据/加载/错误），调用 API 层，组件直接消费 |

**关键设计**：
- 零新依赖，基于原生 `fetch` + `AbortController`
- 后端响应格式变化只改 `api/devices.js`，上层无感
- 后续加 token / 全局 loading 只改 `api/request.js`

## 下一步（Phase 2 延续）
- [ ] 添加设备筛选面板（按类型过滤地图标记）
- [ ] 实现空间范围查询（在地图上框选区域查设备）
- [ ] 添加设备信息侧边栏（更丰富的详情展示）
- [ ] 美化 UI 风格（深色/浅色主题）
