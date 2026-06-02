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
  ('温度传感器-A02', 'temperature', 36.55, 116.75, ST_SetSRID(ST_MakePoint(116.75, 36.55), 4326), 'online'),
  ('温度传感器-A03', 'temperature', 36.72, 117.55, ST_SetSRID(ST_MakePoint(117.55, 36.72), 4326), 'online'),
  ('温度传感器-A04', 'temperature', 36.48, 117.03, ST_SetSRID(ST_MakePoint(117.03, 36.48), 4326), 'offline'),
  ('湿度传感器-B03', 'humidity', 36.6612, 117.1301, ST_SetSRID(ST_MakePoint(117.1301, 36.6612), 4326), 'online'),
  ('湿度传感器-B04', 'humidity', 36.97, 117.18, ST_SetSRID(ST_MakePoint(117.18, 36.97), 4326), 'online'),
  ('湿度传感器-B05', 'humidity', 36.86, 117.21, ST_SetSRID(ST_MakePoint(117.21, 36.86), 4326), 'online'),
  ('湿度传感器-B06', 'humidity', 36.30, 116.46, ST_SetSRID(ST_MakePoint(116.46, 36.30), 4326), 'offline'),
  ('PM2.5监测-C07', 'air', 36.6412, 117.1101, ST_SetSRID(ST_MakePoint(117.1101, 36.6412), 4326), 'offline'),
  ('PM2.5监测-C08', 'air', 36.20, 117.67, ST_SetSRID(ST_MakePoint(117.67, 36.20), 4326), 'online'),
  ('PM2.5监测-C09', 'air', 37.04, 117.16, ST_SetSRID(ST_MakePoint(117.16, 37.04), 4326), 'online'),
  ('PM2.5监测-C10', 'air', 36.62, 117.25, ST_SetSRID(ST_MakePoint(117.25, 36.62), 4326), 'offline')
ON CONFLICT DO NOTHING;
