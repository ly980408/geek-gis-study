const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// ========== 模拟设备数据 ==========
let devices = [
  {
    id: 1,
    name: '温度传感器-A01',
    type: 'temperature',
    lat: 36.6512,
    lng: 117.1201,
    status: 'online',
  },
  {
    id: 2,
    name: '湿度传感器-B03',
    type: 'humidity',
    lat: 36.6612,
    lng: 117.1301,
    status: 'online',
  },
  {
    id: 3,
    name: 'PM2.5监测-C07',
    type: 'air',
    lat: 36.6412,
    lng: 117.1101,
    status: 'offline',
  },
];
let nextId = 4;

// ========== Hello（保留作为健康检查） ==========
app.get('/api/hello', (req, res) => {
  const name = req.query.name || 'GIS';
  res.json({ message: `Hello ${name} World!` });
});

// ========== 设备 CRUD ==========
// 获取所有设备
app.get('/api/devices', (req, res) => {
  res.json({ data: devices, total: devices.length });
});

// 获取单个设备
app.get('/api/devices/:id', (req, res) => {
  const device = devices.find(d => d.id === Number(req.params.id));
  if (!device) return res.status(404).json({ error: '设备未找到' });
  res.json({ data: device });
});

// 新增设备
app.post('/api/devices', (req, res) => {
  const { name, type, lat, lng } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'name 和 type 是必填字段' });
  }
  const newDevice = { id: nextId++, name, type, lat, lng, status: 'offline' };
  devices.push(newDevice);
  res.status(201).json({ data: newDevice });
});

// 删除设备
app.delete('/api/devices/:id', (req, res) => {
  const index = devices.findIndex(d => d.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: '设备未找到' });
  devices.splice(index, 1);
  res.json({ message: '删除成功' });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
