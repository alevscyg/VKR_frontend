import { useEffect, useRef, useState } from 'react'
import { fetchMessages, sendMessage } from '../api/chatApi'
import './chat.css'

const POLL_INTERVAL = 3000
const MAX_LENGTH = 1000

export function Chat({ user, onClose }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef(null)

  /* --- загрузка истории + polling --- */
  useEffect(() => {
    let cancelled = false

    const load = async (silent = false) => {
      if (!silent) setLoading(true)
      setError('')
      try {
        const data = await fetchMessages()
        if (!cancelled) setMessages(data)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled && !silent) setLoading(false)
      }
    }

    load()
    const id = setInterval(() => load(true), POLL_INTERVAL)

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  /* --- автопрокрутка к последнему сообщению --- */
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  /* --- отправка --- */
  const handleSend = async (e) => {
    e?.preventDefault?.()
    const trimmed = text.trim()
    if (!trimmed || loading) return

    if (trimmed.length > MAX_LENGTH) {
      setError(`Сообщение не должно превышать ${MAX_LENGTH} символов`)
      return
    }

    setError('')
    // оптимистичный апдейт: показываем сообщение сразу, не ждём сервер
    const optimistic = {
      id: `tmp-${Date.now()}`,
      text: trimmed,
      author: user?.email ?? 'вы',
      createdAt: new Date().toISOString(),
      pending: true,
    }
    setMessages((prev) => [...prev, optimistic])
    setText('')

    try {
      const saved = await sendMessage(trimmed)
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? saved : m)),
      )
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setError(e.message || 'Не удалось отправить сообщение')
      setText(trimmed) // возвращаем текст, чтобы можно было повторить
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })

  const formatDay = (iso) => {
    const d = new Date(iso)
    const today = new Date()
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    return isToday
      ? 'Сегодня'
      : d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
  }

  // группировка по дням: [{ day: 'Сегодня', items: [...] }, ...]
  const groups = messages.reduce((acc, m) => {
    const day = formatDay(m.createdAt)
    const last = acc[acc.length - 1]
    if (last && last.day === day) last.items.push(m)
    else acc.push({ day, items: [m] })
    return acc
  }, [])

  return (
    <div className="chat">
      <div className="chat__header">
        <h2>Общий чат</h2>
        <button className="chat__close" onClick={onClose}>×</button>
      </div>

      {loading && <p className="chat__hint">Загрузка истории…</p>}
      {error && <p className="chat__error">{error}</p>}

      <div className="chat__list" ref={listRef}>
        {groups.length === 0 && !loading && (
          <p className="chat__empty">Сообщений пока нет. Начните первым.</p>
        )}

        {groups.map((g) => (
          <div key={g.day} className="chat__group">
            <div className="chat__day">{g.day}</div>
            {g.items.map((m) => {
              const mine = m.author === (user?.email ?? '')
              return (
                <div
                  key={m.id}
                  className={`chat__message ${mine ? 'chat__message--mine' : ''} ${
                    m.pending ? 'chat__message--pending' : ''
                  }`}
                >
                  <div className="chat__meta">
                    <span className="chat__author">{mine ? 'Вы' : m.author}</span>
                    <span className="chat__time">{formatTime(m.createdAt)}</span>
                  </div>
                  <div className="chat__bubble">{m.text}</div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <form className="chat__form" onSubmit={handleSend}>
        <textarea
          className="chat__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Введите сообщение… (Enter — отправить, Shift+Enter — перенос строки)"
          maxLength={MAX_LENGTH}
          rows={2}
        />
        <button
          type="submit"
          className="chat__send"
          disabled={!text.trim() || loading}
        >
          Отправить
        </button>
      </form>

      <div className="chat__counter">
        {text.length} / {MAX_LENGTH}
      </div>
    </div>
  )
}