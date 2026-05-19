FROM node:22-alpine

WORKDIR /app

# 复制依赖配置（利用 Docker 缓存层）
COPY packages/api-express/package.json ./
RUN npm install

# 复制源代码
COPY packages/api-express/src ./src

EXPOSE 3000

CMD ["node", "src/index.js"]
