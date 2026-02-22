export function formatChips(value) {
  const num = Number(value)
  if (isNaN(num)) return '0'
  if (Math.abs(num) < 1000) return String(num)
  const k = num / 1000
  const rounded = Math.round(k * 10) / 10
  return rounded % 1 === 0 ? `${Math.round(rounded)}K` : `${rounded}K`
}
