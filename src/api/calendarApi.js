import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const http = axios.create({ baseURL })

let authToken = null
export function setAuthToken(token) {
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
  const message =
    error?.response?.data?.message ||
    error?.message ||
    'Неизвестная ошибка'

  console.error(`[calendarApi] ${context}:`, status, message)

  if (status === 401) throw new Error('Сессия истекла. Войдите снова.')
  if (status === 403) throw new Error('Недостаточно прав для этой операции.')
  if (status === 404) throw new Error('Мероприятие не найдено.')
  throw new Error(Array.isArray(message) ? message.join(', ') : message)
}

export async function fetchEvents() {
  try {
    const { data } = await http.get('/calendar/events')
    const list = Array.isArray(data) ? data : data?.items ?? []
    return list.map((ev) => ({
      id: ev.id ?? ev._id,
      title: ev.title ?? ev.name ?? '',
      description: ev.description ?? '',
      date: ev.date ?? ev.startAt ?? ev.start ?? '',
      endAt: ev.endAt ?? null,
      type: ev.type ?? null,
      participants: ev.participants ?? ev.members ?? [],
    }))
  } catch (error) {
    handleError(error, 'fetchEvents')
  }
}

export async function createEvent(event) {
  const payload = {
    title: event.title,
    description: event.description || undefined,
    date: event.date,
    endAt: event.endAt || undefined,
    typeValue: event.typeValue || undefined,
    participants: event.participants ?? [],
  }
  try {
    const { data } = await http.post('/calendar/events', payload)
    return normalizeEvent(data)
  } catch (error) {
    handleError(error, 'createEvent')
  }
}

export async function updateEvent(id, patch) {
  try {
    const { data } = await http.put(`/calendar/events/${id}`, patch)
    return normalizeEvent(data)
  } catch (error) {
    handleError(error, 'updateEvent')
  }
}

export async function deleteEvent(id) {
  try {
    await http.delete(`/calendar/events/${id}`)
    return id
  } catch (error) {
    handleError(error, 'deleteEvent')
  }
}

function normalizeEvent(ev) {
  return {
    id: ev.id ?? ev._id,
    title: ev.title ?? '',
    description: ev.description ?? '',
    date: ev.date ?? ev.startAt ?? '',
    endAt: ev.endAt ?? null,
    type: ev.type ?? null,
    participants: ev.participants ?? [],
  }
}