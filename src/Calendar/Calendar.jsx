import { useState } from 'react'
import './calendar.css'

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// возвращает массив ячеек месяца (null — пустая ячейка до/после)
function getMonthCells(year, month) {
  const firstDay = new Date(year, month, 1)
  // JS: 0 = воскресенье, приводим к понедельнику
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function Calendar({ events = [], onEventClick }) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const cells = getMonthCells(year, month)

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))
  const goToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))

  // события, привязанные к конкретному дню текущего месяца
  const eventsByDay = events.reduce((acc, ev) => {
    const d = new Date(ev.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      ;(acc[day] = acc[day] || []).push(ev)
    }
    return acc
  }, {})

  const isToday = (day) =>
    day &&
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day

  return (
    <div className="calendar">
      <div className="calendar__header">
        <button className="calendar__nav" onClick={prevMonth} aria-label="Предыдущий месяц">‹</button>
        <div className="calendar__title">
          {MONTHS[month]} {year}
        </div>
        <button className="calendar__nav" onClick={nextMonth} aria-label="Следующий месяц">›</button>
        <button className="calendar__today" onClick={goToday}>Сегодня</button>
      </div>

      <div className="calendar__grid calendar__grid--head">
        {WEEKDAYS.map((w) => (
          <div key={w} className="calendar__weekday">{w}</div>
        ))}
      </div>

      <div className="calendar__grid">
        {cells.map((day, i) => (
          <div
            key={i}
            className={
              'calendar__cell' +
              (day ? '' : ' calendar__cell--empty') +
              (isToday(day) ? ' calendar__cell--today' : '')
            }
          >
            {day && <span className="calendar__day">{day}</span>}
            {day && eventsByDay[day]?.map((ev) => {
              const startTime = new Date(ev.date).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })
              const endTime = ev.endAt
                ? new Date(ev.endAt).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null
              return (
                <div
                  key={ev.id}
                  className="calendar__event"
                  style={{ background: ev.type?.color ?? '#4a90e2' }}
                  title={`${ev.title} (${startTime}${endTime ? `–${endTime}` : ''})`}
                  onClick={() => onEventClick?.(ev)}
                >
                  {ev.title}
                  {endTime && <span className="calendar__event-time"> {startTime}–{endTime}</span>}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
