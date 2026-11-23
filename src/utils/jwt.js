// Декодирует payload JWT без проверки подписи (для UI).
// Подпись и срок действия должен проверять сервер.
export function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null

  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    )

    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    return JSON.parse(json)
  } catch (e) {
    console.error('decodeJwt error:', e)
    return null
  }
}