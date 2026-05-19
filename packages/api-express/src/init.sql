-- 设备管理数据库初始化脚本
-- 容器首次启动时自动执行

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  geom GEOMETRY(POINT, 4326),
  status VARCHAR(20) DEFAULT 'offline',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 空间索引（提升 ST_DWithin 查询性能）
CREATE INDEX IF NOT EXISTS idx_devices_geom ON devices USING GIST (geom);

-- 初始示例数据
INSERT INTO devices (name, type, lat, lng, geom, status) VALUES
  ('温度传感器-A01', 'temperature', 36.6512, 117.1201, ST_SetSRID(ST_MakePoint(117.1201, 36.6512), 4326), 'online'),
  ('湿度传感器-B03', 'humidity', 36.6612, 117.1301, ST_SetSRID(ST_MakePoint(117.1301, 36.6612), 4326), 'online'),
  ('PM2.5监测-C07', 'air', 36.6412, 117.1101, ST_SetSRID(ST_MakePoint(117.1101, 36.6412), 4326), 'offline')
ON CONFLICT DO NOTHING;
