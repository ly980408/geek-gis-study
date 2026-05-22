import { ref, onMounted } from 'vue'
import { getDevices } from '../api/devices.js'

export function useDevices(type) {
  const devices = ref([])
  const loading = ref(true)
  const error = ref(null)

  const fetchDevices = async () => {
    loading.value = true
    error.value = null
    try {
      devices.value = await getDevices(type)
    } catch (e) {
      error.value = e.message
      devices.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchDevices)

  return { devices, loading, error, refetch: fetchDevices }
}
