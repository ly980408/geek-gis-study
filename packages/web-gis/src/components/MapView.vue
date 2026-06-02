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
  air: '#22c55e',
}

const typeLabels = {
  temperature: '温度传感器',
  humidity: '湿度传感器',
  air: '空气质量监测',
}

const searchMode = ref(false)
const searchRadius = ref(3)
const searchCenter = ref(null)
const searchedDevices = ref(null)
const searchHint = ref('')
const selectedDevice = ref(null)
const visibleTypes = ref({ temperature: true, humidity: true, air: true })

function createMarker(device) {
  const color = typeColors[device.type] || '#6b7280'
  const marker = L.circleMarker([device.lat, device.lng], {
    radius: 10,
    fillColor: color,
    color: '#fff',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8,
  })
  marker.bindPopup(`<strong>${device.name}</strong>`, {
    closeButton: false,
    className: 'marker-popup',
  })
  marker.on('click', () => {
    selectedDevice.value = device
  })
  return marker
}

function renderMarkers(deviceList, { fitBounds = true } = {}) {
  if (!map || !markersLayer) return
  markersLayer.clearLayers()
  deviceList.forEach((device) => markersLayer.addLayer(createMarker(device)))
  if (fitBounds && deviceList.length > 0) {
    const points = deviceList.map((d) => [d.lat, d.lng])
    if (searchCircle) points.push(searchCircle.getLatLng())
    map.fitBounds(points, { padding: [50, 50] })
  }
}

function getFilteredList() {
  const source = searchedDevices.value ?? devices.value
  return source.filter((d) => visibleTypes.value[d.type] !== false)
}

function placeSearchCircle(latlng) {
  searchCenter.value = { lat: latlng.lat, lng: latlng.lng }
  if (searchCircle) map.removeLayer(searchCircle)
  searchCircle = L.circle([latlng.lat, latlng.lng], {
    radius: searchRadius.value * 1000,
    color: '#6366f1',
    fillColor: '#6366f1',
    fillOpacity: 0.1,
    weight: 2,
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
  renderMarkers(getFilteredList())
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

function flyToDevice(device) {
  if (!map) return
  map.flyTo([device.lat, device.lng], 14, { duration: 0.6 })
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
    renderMarkers(getFilteredList())
  } catch {
    searchHint.value = '搜索失败，请重试'
  }
}

onMounted(() => {
  map = L.map(mapContainer.value).setView([36.65, 117.05], 12)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)

  map.on('click', (e) => {
    if (searchMode.value) placeSearchCircle(e.latlng)
  })
})

watch(devices, () => {
  if (!map || !markersLayer) return
  if (searchedDevices.value !== null) return
  renderMarkers(getFilteredList())
})

watch(
  visibleTypes,
  () => {
    renderMarkers(getFilteredList(), { fitBounds: false })
  },
  { deep: true }
)
</script>

<template>
  <div class="map-wrapper">
    <div v-if="loading" class="status-bar">正在加载设备数据...</div>
    <div v-if="error" class="status-bar error">加载失败：{{ error }}</div>

    <div class="search-toolbar">
      <button class="btn" :class="{ active: searchMode }" @click="toggleSearchMode">
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
          class="slider"
          @input="updateRadius(Number($event.target.value))"
        />
        <span class="value">{{ searchRadius }} km</span>
      </div>
      <div class="panel-row">
        <button class="btn primary" @click="doSearch">搜索</button>
        <button class="btn" @click="clearSearch">清除</button>
      </div>
      <div v-if="searchHint" class="panel-hint">{{ searchHint }}</div>
      <div v-if="searchedDevices && searchedDevices.length > 0" class="search-results">
        <div
          v-for="device in getFilteredList()"
          :key="device.id"
          class="result-item"
          @click="flyToDevice(device)"
        >
          <span class="result-dot" :style="{ background: typeColors[device.type] }"></span>
          <span class="result-name">{{ device.name }}</span>
          <span class="result-distance">{{ device.distance_km?.toFixed(1) }}km</span>
        </div>
        <div v-if="getFilteredList().length === 0" class="panel-hint">当前筛选条件下无匹配设备</div>
      </div>
    </div>

    <div ref="mapContainer" class="map-container"></div>

    <div class="legend">
      <div class="legend-header">
        <h4>图例</h4>
        <span class="legend-hint">点击切换显隐</span>
      </div>
      <div
        v-for="(label, type) in typeLabels"
        :key="type"
        class="legend-item"
        :class="{ muted: !visibleTypes[type] }"
        @click="visibleTypes[type] = !visibleTypes[type]"
      >
        <span class="dot" :style="{ background: typeColors[type] }"></span>
        <span>{{ label }}</span>
      </div>
    </div>

    <Transition name="sidebar">
      <div v-if="selectedDevice" class="sidebar-backdrop" @click.self="selectedDevice = null">
        <div class="sidebar">
          <div class="sidebar-header">
            <h3>{{ selectedDevice.name }}</h3>
            <button class="sidebar-close" @click="selectedDevice = null">✕</button>
          </div>
          <div class="sidebar-body">
            <div class="detail-row">
              <span class="detail-label">类型</span>
              <span class="detail-value">
                <span
                  class="dot-sm"
                  :style="{ background: typeColors[selectedDevice.type] }"
                ></span>
                {{ typeLabels[selectedDevice.type] || selectedDevice.type }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">状态</span>
              <span class="detail-value">
                <span class="status-dot" :class="selectedDevice.status"></span>
                {{
                  selectedDevice.status === 'online'
                    ? '在线'
                    : selectedDevice.status === 'offline'
                      ? '离线'
                      : selectedDevice.status
                }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">经度</span>
              <span class="detail-value mono">{{ selectedDevice.lng?.toFixed(6) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">纬度</span>
              <span class="detail-value mono">{{ selectedDevice.lat?.toFixed(6) }}</span>
            </div>
            <div v-if="selectedDevice.distance_km" class="detail-row">
              <span class="detail-label">距离</span>
              <span class="detail-value">{{ selectedDevice.distance_km.toFixed(2) }} km</span>
            </div>
            <div class="detail-divider"></div>
            <div class="detail-row">
              <span class="detail-label">设备 ID</span>
              <span class="detail-value mono small">{{ selectedDevice.id }}</span>
            </div>
            <div v-if="selectedDevice.description" class="detail-row">
              <span class="detail-label">描述</span>
              <span class="detail-value">{{ selectedDevice.description }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
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
  min-width: 260px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
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
.search-results {
  margin-top: 8px;
  border-top: 1px solid #f0f0f0;
  padding-top: 6px;
  max-height: 260px;
  overflow-y: auto;
}
.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;
}
.result-item:hover {
  background: #f5f5f5;
}
.result-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.result-name {
  font-size: 13px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.result-distance {
  font-size: 11px;
  color: #999;
  flex-shrink: 0;
}
.dot-sm {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
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
  user-select: none;
}
.legend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.legend-header h4 {
  margin: 0;
  font-size: 13px;
  color: #333;
}
.legend-hint {
  font-size: 11px;
  color: #aaa;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.15s;
}
.legend-item:hover {
  background: #f5f5f5;
}
.legend-item.muted {
  opacity: 0.4;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.15);
}
.sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 340px;
  height: 100%;
  background: white;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 14px;
  border-bottom: 1px solid #f0f0f0;
}
.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}
.sidebar-close {
  width: 28px;
  height: 28px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.sidebar-close:hover {
  background: #e5e5e5;
  color: #333;
}
.sidebar-body {
  padding: 16px 20px 20px;
  overflow-y: auto;
  flex: 1;
}
.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.detail-row:last-of-type {
  border-bottom: none;
}
.detail-label {
  font-size: 13px;
  color: #888;
  flex-shrink: 0;
}
.detail-value {
  font-size: 13px;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 6px;
  text-align: right;
}
.detail-value.mono {
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 12px;
}
.detail-value.small {
  font-size: 12px;
  color: #999;
}
.detail-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 4px 0;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
}
.status-dot.online {
  background: #22c55e;
}
.status-dot.offline {
  background: #ef4444;
}
.sidebar-enter-active,
.sidebar-leave-active {
  transition: opacity 0.2s ease;
}
.sidebar-enter-active .sidebar,
.sidebar-leave-active .sidebar {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
}
.sidebar-enter-from .sidebar,
.sidebar-leave-to .sidebar {
  transform: translateX(100%);
}
</style>

<style>
.marker-popup .leaflet-popup-content-wrapper {
  padding: 4px 10px;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}
.marker-popup .leaflet-popup-content {
  margin: 6px 0;
  font-size: 13px;
}
.marker-popup .leaflet-popup-tip {
  box-shadow: none;
}
</style>
