// Calendar dates (time entry dates, due dates, deadlines) are stored as
// midnight UTC of that day, which is what new Date('2026-11-16') gives.
// These helpers keep every comparison on that same footing, so "this week"
// and "overdue" do not shift by a day in different time zones.

// midnight UTC of the day in value (or of today, on this computer's calendar)
function toDay(value) {
  if (value === undefined || value === null || value === '') {
    const now = new Date()
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  }
  const d = new Date(value)
  if (isNaN(d)) return null
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function today() {
  return toDay()
}

// monday of the current week
function startOfWeek() {
  const d = today()
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d
}

module.exports = { toDay, today, startOfWeek }
