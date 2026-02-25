const pad = n => String(n).padStart(2, '0')
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`
const addMin = (d, m) => new Date(d.getTime() + m * 60000)

// 4er Gruppe Round-Robin: 6 Spiele
export function groupMatches4(teams) {
  const [t1, t2, t3, t4] = teams
  return [
    [t1, t2],
    [t3, t4],
    [t1, t3],
    [t2, t4],
    [t1, t4],
    [t2, t3],
  ]
}

export function buildGroupMatches(numGroups, prefix = 'G') {
  const matches = []
  for (let g = 1; g <= numGroups; g++) {
    const group = `${prefix}${g}`
    const teams = [1, 2, 3, 4].map(i => `${group} Team ${i}`)
    const pairs = groupMatches4(teams)
    pairs.forEach(([home, away], idx) => {
      matches.push({
        phase: 'group',
        group_code: group,
        round: Math.floor(idx / 2) + 1,
        home_team: home,
        away_team: away,
      })
    })
  }
  return matches
}

export function scheduleMatches(
  matches,
  { startTimeISO, cutoffISO, playMinutes, breakMinutes, fieldsBefore = 5, fieldsAfter = 4 }
) {
  const slot = playMinutes + breakMinutes
  const start = new Date(startTimeISO)
  const cutoff = new Date(cutoffISO)

  const fields5 = ['Stadium 1', 'Stadium 2', 'Stadium 3', 'Stadium 4', 'Stadium 5']
  const fields4 = ['Stadium 1', 'Stadium 2', 'Stadium 3', 'Stadium 4']

  const out = []
  let t = start
  let i = 0

  while (i < matches.length) {
    const use5 = t < cutoff
    const cap = use5 ? fieldsBefore : fieldsAfter
    const fieldNames = use5 ? fields5 : fields4

    for (let f = 0; f < cap && i < matches.length; f++) {
      out.push({
        ...matches[i],
        time_text: hhmm(t),
        field: fieldNames[f],
      })
      i++
    }
    t = addMin(t, slot)
  }

  return { scheduled: out, endTimeISO: t.toISOString() }
}
