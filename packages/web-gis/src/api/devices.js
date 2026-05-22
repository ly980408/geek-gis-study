import request from './request.js'

export async function getDevices(type) {
  const params = type ? `?type=${type}` : ''
  const res = await request(`/devices${params}`)
  return res.data ?? []
}

export async function getDeviceById(id) {
  const res = await request(`/devices/${id}`)
  return res.data ?? null
}

export async function getNearbyDevices(lat, lng, radius) {
  const res = await request(`/devices/nearby/query?lat=${lat}&lng=${lng}&radius=${radius}`)
  return res.data ?? []
}

export function createDevice(body) {
  return request('/devices', {
    method: 'POST',
    body,
  })
}

export function updateDevice(id, body) {
  return request(`/devices/${id}`, {
    method: 'PUT',
    body,
  })
}

export function deleteDevice(id) {
  return request(`/devices/${id}`, {
    method: 'DELETE',
  })
}
