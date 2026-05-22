<script setup>
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useDevices } from '../composables/useDevices.js'
import { getNearbyDevices } from '../api/devices.js'

const mapContainer = ref(null)
let map = null
let markersLayer = null
let searchCircle = null

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

const searchMode = ref(false)
const searchRadius = ref(3)
const searchCenter = ref(null)
const searchedDevices = ref(null)
const searchHint = ref('')

function createMarker(device) {
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
      <p style="margin: 2px 0;"><strong>距离：</strong>${device.distance_km ? device.distance_km.toFixed(2) + ' km' : '—'}</p>
      <p style="margin: 2px 0;"><strong>经度：</strong>${device.lng?.toFixed(4)}</p>
      <p style="margin: 2px 0;"><strong>纬度：</strong>${device.lat?.toFixed(4)}</p>
    </div>
  `)
  return marker
}

function renderMarkers(deviceList) {
  if (!map || !markersLayer) return
  markersLayer.clearLayers()
  deviceList.forEach((device) => markersLayer.addLayer(createMarker(device)))
  const points = deviceList.map((d) => [d.lat, d.lng])
  if (searchCircle) points.push(searchCircle.getLatLng())
  if (points.length > 0) {
    map.fitBounds(points, { padding: [50, 50] })
  }
}

function placeSearchCircle(latlng) {
  searchCenter.value = { lat: latlng.lat, lng: latlng.lng }
  if (searchCircle) map.removeLayer(searchCircle)
  searchCircle = L.circle([latlng.lat, latlng.lng], {
    radius: searchRadius.value * 1000,
    color: '#6366f1',
    fillColor: '#6366f1',
    fillOpacity: 0.1,
    weight: 2
  }).addTo(map)
  updateSearchTooltip()
  searchHint.value = ''
}

function updateSearchTooltip() {
  if (!searchCircle || !searchCenter.value) return
  searchCircle.unbindTooltip()
  searchCircle.bindTooltip(
    `搜索中心: ${searchCenter.value.lat.toFixed(4)}, ${searchCenter.value.lng.toFixed(4)}<br>半径: ${searchRadius.value} km`,
    { permanent: true, direction: 'center', className: 'search-tooltip' }
  )
}

function toggleSearchMode() {
  searchMode.value = !searchMode.value
  if (!searchMode.value) clearSearch()
  updateCursor()
}

function clearSearch() {
  if (searchCircle) {
    map.removeLayer(searchCircle)
    searchCircle = null
  }
  searchCenter.value = null
  searchedDevices.value = null
  searchHint.value = ''
  renderMarkers(devices.value)
}

function updateCursor() {
  if (!map) return
  map.getContainer().style.cursor = searchMode.value ? 'crosshair' : ''
}

function updateRadius(val) {
  searchRadius.value = val
  if (searchCircle) {
    searchCircle.setRadius(val * 1000)
    updateSearchTooltip()
  }
}

async function doSearch() {
  if (!searchCenter.value) {
    searchHint.value = '请在地图上点击放置搜索范围'
    return
  }
  searchHint.value = '搜索中...'
  try {
    const result = await getNearbyDevices(
      searchCenter.value.lat,
      searchCenter.value.lng,
      searchRadius.value
    )
    searchedDevices.value = result
    if (result.length === 0) {
      searchHint.value = '该范围内未找到设备'
    } else {
      searchHint.value = `找到 ${result.length} 个设备`
    }
    renderMarkers(result)
  } catch {
    searchHint.value = '搜索失败，请重试'
  }
}

onMounted(() => {
  map = L.map(mapContainer.value).setView([36.65, 117.05], 12)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19
  }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)

  map.on('click', (e) => {
    if (searchMode.value) placeSearchCircle(e.latlng)
  })
})

watch(devices, (newDevices) => {
  if (!map || !markersLayer) return
  if (searchedDevices.value !== null) return
  renderMarkers(newDevices)
})
</script>

<template>
  <div class="map-wrapper">
    <div v-if="loading" class="status-bar">正在加载设备数据...</div>
    <div v-if="error" class="status-bar error">加载失败：{{ error }}</div>

    <div class="search-toolbar">
      <button
        class="btn"
        :class="{ active: searchMode }"
        @click="toggleSearchMode"
      >
        {{ searchMode ? '退出搜索' : '范围搜索' }}
      </button>
    </div>

    <div v-if="searchMode" class="search-panel">
      <div class="panel-row">
        <span class="label">半径：</span>
        <input
          type="range"
          min="0.5"
          max="20"
          step="0.5"
          :value="searchRadius"
          @input="updateRadius(Number($event.target.value))"
          class="slider"
        />
        <span class="value">{{ searchRadius }} km</span>
      </div>
      <div class="panel-row">
        <button class="btn primary" @click="doSearch">搜索</button>
        <button class="btn" @click="clearSearch">清除</button>
      </div>
      <div v-if="searchHint" class="panel-hint">{{ searchHint }}</div>
    </div>

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
.search-toolbar {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
}
.search-panel {
  position: absolute;
  top: 60px;
  right: 16px;
  z-index: 1000;
  background: white;
  padding: 14px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 220px;
}
.panel-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.panel-row:last-child {
  margin-bottom: 0;
}
.label {
  font-size: 13px;
  color: #555;
  white-space: nowrap;
}
.slider {
  flex: 1;
  accent-color: #6366f1;
}
.value {
  font-size: 13px;
  color: #333;
  min-width: 48px;
  text-align: right;
}
.panel-hint {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}
.btn {
  padding: 6px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  color: #374151;
}
.btn.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}
.btn.primary {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}
.btn:hover {
  opacity: 0.85;
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
