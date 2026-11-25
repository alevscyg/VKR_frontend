import { useState } from 'react'
import './admin.css'

export function AdminPanel({ events, user, onClose, onCreate, onDelete }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')            // начало
  const [endAt, setEndAt] = useState('')          // окончание - новое
  const [participants, setParticipants] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDate('')
    setEndAt('')
    setParticipants('')
    setError('')
  }

  const addEvent = async (e) => {
    e.preventDefault()

    if (!title.trim() || !date) {
      setError('Укажите название и дату/время начала мероприятия.')
      return
    }

    // проверка временных границ на клиенте
    if (endAt && new Date(endAt) <= new Date(date)) {
      setError('Дата окончания должна быть позже даты начала.')
      return
    }

    setBusy(true)
    setError('')
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        date: new Date(date).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        participants: participants
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      })
      resetForm()
    } catch (e) {
      setError(e.message || 'Не удалось создать мероприятие')
    } finally {
      setBusy(false)
    }
  }

  const deleteEvt = async (id) => {
    if (!window.confirm('Удалить мероприятие?')) return
    setBusy(true)
    setError('')
    try {
      await onDelete(id)
    } catch (e) {
      setError(e.message || 'Не удалось удалить мероприятие')
    } finally {
      setBusy(false)
    }
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  )

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2>Админ-панель</h2>
        <button className="admin-panel__close" onClick={onClose}>×</button>
      </div>

      <p className="admin-panel__user">
        Вы вошли как <b>{user?.email || '—'}</b> (роль: {user?.role})
      </p>

      <form className="admin-panel__form" onSubmit={addEvent}>
        <h3>Новое мероприятие</h3>

        <label>
          Название
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например, встреча с поставщиком"
            maxLength={100}
            disabled={busy}
          />
        </label>

        <label>
          Описание (необязательно)
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание"
            maxLength={255}
            disabled={busy}
          />
        </label>

        <label>
          Дата и время начала
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={busy}
            required
          />
        </label>

        <label>
          Дата и время окончания (необязательно)
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            disabled={busy}
          />
        </label>

        <label>
          Участники (через запятую)
          <input
            type="text"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            placeholder="ivanov@mail.ru, petrov@mail.ru"
            disabled={busy}
          />
        </label>

        {error && <div className="admin-panel__error">{error}</div>}

        <button type="submit" className="admin-panel__submit" disabled={busy}>
          {busy ? 'Сохранение…' : 'Добавить мероприятие'}
        </button>
      </form>

      <div className="admin-panel__list">
        <h3>Все мероприятия ({sortedEvents.length})</h3>

        {sortedEvents.length === 0 && (
          <p className="admin-panel__empty">Пока нет ни одного мероприятия.</p>
        )}

        <ul>
          {sortedEvents.map((ev) => (
            <li key={ev.id} className="admin-panel__item">
              <div>
                <div className="admin-panel__item-title">{ev.title}</div>
                <div className="admin-panel__item-meta">
                  {new Date(ev.date).toLocaleString('ru-RU')}
                  {ev.endAt && (
                    <> — {new Date(ev.endAt).toLocaleTimeString('ru-RU')}</>
                  )}
                  {ev.participants?.length > 0 && (
                    <> · участники: {ev.participants.join(', ')}</>
                  )}
                </div>
              </div>
              <button
                className="admin-panel__delete"
                onClick={() => deleteEvt(ev.id)}
                disabled={busy}
                title="Удалить"
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
