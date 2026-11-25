import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Button } from './components/Button'
import { Modal } from './Modal/Modal'
import { Calendar } from './Calendar/Calendar'
import { EventDetails } from './EventDetails/EventDetails'
import { AdminPanel } from './AdminPanel/AdminPanel'
import { Chat } from './Chat/Chat'
import { decodeJwt } from './utils/jwt'
import {
  setAuthToken as setApiToken,
  fetchEvents,
  createEvent,
  deleteEvent,
} from './api/calendarApi'
import { setChatToken } from './api/chatApi'
import './App.css'

function App() {
  const [modal, setModal] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)

  const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

  const user = useMemo(() => decodeJwt(authToken), [authToken])
  const isAdmin = user?.role === 'ADMIN'
  const isAuthed = !!authToken
  
  const closeDetails = () => {
    setSelectedEvent(null)
    setModal(true)   // вернуть календарь
  }
  
  useEffect(() => {
    setApiToken(authToken)
    setChatToken(authToken)
  }, [authToken])

  useEffect(() => {
    if (!authToken) {
      setEvents([])
      return
    }
    let cancelled = false

    ;(async () => {
      setEventsLoading(true)
      setEventsError('')
      try {
        const data = await fetchEvents()
        if (!cancelled) setEvents(data)
      } catch (e) {
        if (!cancelled) setEventsError(e.message)
      } finally {
        if (!cancelled) setEventsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authToken])

  const login = async () => {
    setLoading(true)
    setAuthError('')
    try {
      const { data } = await axios.post(`${baseURL}/auth/login`, { email, password })
      setAuthToken(data.token)
      setModal(Boolean(data.token))
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Не удалось войти'
      setAuthError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setLoading(false)
    }
  }

  const registration = async () => {
    setLoading(true)
    setAuthError('')
    try {
      const { data } = await axios.post(`${baseURL}/auth/registration`, { email, password })
      setAuthToken(data.token)
      setModal(Boolean(data.token))
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Не удалось зарегистрироваться'
      setAuthError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setAuthToken('')
    setEmail('')
    setPassword('')
    setEvents([])
    setAuthError('')
    setModal(false)
    setAdminOpen(false)
    setChatOpen(false)
    setSelectedEvent(null)
  }

  const handleCreateEvent = async (payload) => {
    const created = await createEvent(payload)
    setEvents((prev) => [...prev, created])
    return created
  }

  const handleDeleteEvent = async (id) => {
    await deleteEvent(id)
    setEvents((prev) => prev.filter((ev) => ev.id !== id))
    if (selectedEvent?.id === id) setSelectedEvent(null)
  }

  return (
    <>
      <h1 className="h1">Календарь</h1>

      <label htmlFor="email"> Email (Length 5 to 255):</label>
      <input
        id="email"
        type="text"
        placeholder="email"
        required
        minLength={5}
        maxLength={255}
        size={10}
        value={email}
        style={{ border: email.trim().length >= 5 ? null : '1px solid red' }}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />

      <label htmlFor="password"> Password (Length 4 to 16):</label>
      <input
        id="password"
        type="password"
        placeholder="password"
        required
        minLength={4}
        maxLength={16}
        size={10}
        value={password}
        style={{ border: password.trim().length >= 4 ? null : '1px solid red' }}
        onChange={(e) => setPassword(e.target.value)}
      />

      {loading && <h4>Loading...</h4>}
      {authError && <p style={{ color: 'red' }}>{authError}</p>}
      <hr />
      <Button onClick={login}>Login</Button>
      <hr />
      <Button onClick={registration}>Registration</Button>
      <hr />

      {isAuthed && <Button onClick={() => setModal(true)}>Календарь</Button>}
      {isAuthed && <Button onClick={() => setChatOpen(true)}>Чат</Button>}
      {isAdmin && <Button onClick={() => setAdminOpen(true)}>Админ-панель</Button>}
      {isAuthed && <Button onClick={logout}>Выйти</Button>}

      {/* Календарь */}
      <Modal open={modal} onClose={() => setModal(false)}>
        <div className="modal-calendar">
          <div className="modal-calendar__header">
            <h2>Корпоративный календарь</h2>
            <button className="modal-calendar__close" onClick={() => setModal(false)}>×</button>
          </div>

          {eventsLoading && <p>Загрузка мероприятий…</p>}
          {eventsError && <p style={{ color: 'red' }}>{eventsError}</p>}

          <Calendar
            events={events}
            onEventClick={(ev) => {
              setModal(false)
              setTimeout(() => setSelectedEvent(ev), 0)
            }}
          />
        </div>
      </Modal>

      {/* Детали события */}
      <Modal open={!!selectedEvent} onClose={closeDetails}>
        {selectedEvent && (
          <EventDetails
            event={selectedEvent}
            onClose={closeDetails}
          />
        )}
      </Modal>

      {/* Чат */}
      <Modal open={chatOpen} onClose={() => setChatOpen(false)}>
        <Chat user={user} onClose={() => setChatOpen(false)} />
      </Modal>

      {/* Админ-панель */}
      <Modal open={adminOpen} onClose={() => setAdminOpen(false)}>
        <AdminPanel
          events={events}
          user={user}
          onClose={() => setAdminOpen(false)}
          onCreate={handleCreateEvent}
          onDelete={handleDeleteEvent}
        />
      </Modal>
    </>
  )
}

export default App
