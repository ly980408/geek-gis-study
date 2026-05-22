<script setup>
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useDevices } from '../composables/useDevices.js'

const mapContainer = ref(null)
let map = null
let markersLayer = null

const { devices, loading, error } = useDevices()

const typeColors = {
  temperature: '#f97316',
  humidity: '#3b82f6',
  air: '#22c55e'
}

const typeLabels = {
  temperature: '温度传感器',
  humidity: '湿度传感器',
  air: '空气质量监测'
}

onMounted(() => {
  map = L.map(mapContainer.value).setView([36.65, 117.05], 12)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19
  }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)
})

watch(devices, (newDevices) => {
  if (!map || !markersLayer) return
  markersLayer.clearLayers()

  newDevices.forEach((device) => {
    const color = typeColors[device.type] || '#6b7280'
    const label = typeLabels[device.type] || device.type

    const marker = L.circleMarker([device.lat, device.lng], {
      radius: 10,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    })

    marker.bindPopup(`
      <div style="min-width: 180px;">
        <h3 style="margin: 0 0 6px;">${device.name}</h3>
        <p style="margin: 2px 0;"><strong>类型：</strong>${label}</p>
        <p style="margin: 2px 0;"><strong>状态：</strong>${device.status}</p>
        <p style="margin: 2px 0;"><strong>经度：</strong>${device.lng?.toFixed(4)}</p>
        <p style="margin: 2px 0;"><strong>纬度：</strong>${device.lat?.toFixed(4)}</p>
      </div>
    `)

    markersLayer.addLayer(marker)
  })

  if (newDevices.length > 0) {
    const allLatLngs = newDevices.map((d) => [d.lat, d.lng])
    map.fitBounds(allLatLngs, { padding: [50, 50] })
  }
})
</script>

<template>
  <div class="map-wrapper">
    <div v-if="loading" class="status-bar">正在加载设备数据...</div>
    <div v-if="error" class="status-bar error">加载失败：{{ error }}</div>
    <div ref="mapContainer" class="map-container"></div>

    <div class="legend">
      <h4>图例</h4>
      <div class="legend-item">
        <span class="dot" style="background: #f97316"></span>
        <span>温度传感器</span>
      </div>
      <div class="legend-item">
        <span class="dot" style="background: #3b82f6"></span>
        <span>湿度传感器</span>
      </div>
      <div class="legend-item">
        <span class="dot" style="background: #22c55e"></span>
        <span>空气质量</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-wrapper {
  width: 100%;
  height: 100vh;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
}

.status-bar {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: white;
  padding: 8px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  color: #666;
}

.status-bar.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.legend {
  position: absolute;
  bottom: 32px;
  right: 16px;
  z-index: 1000;
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 13px;
  line-height: 1.8;
}

.legend h4 {
  margin: 0 0 4px;
  font-size: 13px;
  color: #333;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}
</style>
