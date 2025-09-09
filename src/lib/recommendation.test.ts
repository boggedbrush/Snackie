import { minutesBetween, midpoint, computeSnackWindows, scoreItem } from './recommendation'

describe('recommendation utils', () => {
  test('minutesBetween wraps midnight', () => {
    expect(minutesBetween('23:00', '01:00')).toBe(120)
    expect(minutesBetween('07:00', '09:30')).toBe(150)
  })

  test('midpoint computes halfway time', () => {
    expect(midpoint('08:00', '12:00')).toBe('10:00')
    expect(midpoint('23:00', '01:00')).toBe('00:00')
  })

  test('computeSnackWindows yields windows for >= 3h gaps', () => {
    const res = computeSnackWindows('07:00', '12:00', '18:00')
    expect(res).toHaveLength(2)
    expect(res[0].time).toBe('09:30')
    expect(res[1].time).toBe('15:00')
  })

  test('scoreItem boosts by preference', () => {
    const base = { name: 'Test', calories: 200, protein: 20, carbs: 10, typeTags: ['high-protein'] }
    expect(scoreItem(base, 'high-protein')).toBeGreaterThan(scoreItem(base, 'balanced'))
  })
})

