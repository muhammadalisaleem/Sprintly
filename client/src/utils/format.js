export function formatMoney(amount) {
  return '$' + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 'yyyy-mm-dd' is read as local time, not UTC, so the day never shifts
function toDate(date) {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return new Date(date + 'T00:00:00')
  return new Date(date)
}

export function formatDate(date) {
  if (!date) return '—'
  return toDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function formatHours(hours) {
  return Number(hours || 0).toFixed(2) + ' h'
}

// seconds -> 01:05:09
export function formatClock(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

// 'yyyy-mm-dd' for <input type="date">
export function toInputDate(date = new Date()) {
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function isPast(date) {
  if (!date) return false
  const end = toDate(date)
  end.setHours(23, 59, 59, 999)
  return end < new Date()
}
