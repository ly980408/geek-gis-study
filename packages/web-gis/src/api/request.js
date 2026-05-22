const BASE_URL = '/api'

async function request(url, options = {}) {
  const { method = 'GET', body, headers = {}, timeout = 10000 } = options

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  const config = {
    method,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body)
  }

  try {
    const res = await fetch(`${BASE_URL}${url}`, config)

    if (!res.ok) {
      const msg = await res.json().catch(() => ({}))
      throw new Error(msg.error || `请求失败 (${res.status})`)
    }

    return res.json()
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试')
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}

export default request
