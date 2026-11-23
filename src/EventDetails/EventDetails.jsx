import './event-details.css'

export function EventDetails({ event, onClose }) {
  const start = new Date(event.date)
  const end = event.endAt ? new Date(event.endAt) : null

  return (
    <div className="event-details">
      <div className="event-details__header">
        <h2>{event.title}</h2>
        <button className="event-details__close" onClick={onClose}>×</button>
      </div>

      {event.description && (
        <p className="event-details__desc">{event.description}</p>
      )}

      <div className="event-details__row">
        <span className="event-details__label">Начало:</span>
        {start.toLocaleString('ru-RU')}
      </div>

      {end && (
        <div className="event-details__row">
          <span className="event-details__label">Окончание:</span>
          {end.toLocaleString('ru-RU')}
        </div>
      )}

      {event.type && (
        <div className="event-details__row">
          <span className="event-details__label">Тип:</span>
          <span
            className="event-details__badge"
            style={{ background: event.type.color }}
          >
            {event.type.value}
          </span>
        </div>
      )}

      <div className="event-details__participants">
        <div className="event-details__label">Участники:</div>
        {event.participants?.length ? (
          <ul>
            {event.participants.map((email) => (
              <li key={email}>{email}</li>
            ))}
          </ul>
        ) : (
          <p className="event-details__empty">Участники не назначены</p>
        )}
      </div>
    </div>
  )
}