import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const http = axios.create({ baseURL })

let authToken = null
export function setChatToken(token) {
  authToken = token || null
}

http.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

function handleError(error, context) {
  const status = error?.response?.status
  const message = error?.response?.data?.message || error?.message || 'Неизвестная ошибка'
  console.error(`[chatApi] ${context}:`, status, message)
  if (status === 401) throw new Error('Сессия истекла. Войдите снова.')
  if (status === 403) throw new Error('Недостаточно прав.')
  throw new Error(Array.isArray(message) ? message.join(', ') : message)
}

export async function fetchMessages(limit = 100) {
  try {
    const { data } = await http.get('/chat/messages', { params: { limit } })
    const list = Array.isArray(data) ? data : data?.items ?? []
    return list.map(normalizeMessage)
  } catch (error) {
    handleError(error, 'fetchMessages')
  }
}

export async function sendMessage(text) {
  try {
    const { data } = await http.post('/chat/messages', { text })
    return normalizeMessage(data)
  } catch (error) {
    handleError(error, 'sendMessage')
  }
}

function normalizeMessage(m) {
  return {
    id: m.id,
    text: m.text ?? '',
    author: m.author ?? m.user?.email ?? '-',
    createdAt: m.createdAt ?? new Date().toISOString(),
  }
}