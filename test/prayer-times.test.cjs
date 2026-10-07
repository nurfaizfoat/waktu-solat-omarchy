const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '..', 'PrayerTimes.js'), 'utf8')
const api = vm.createContext({})
vm.runInContext(source, api)

const payload = {
  status: 'OK!', zone: 'WLY01', serverTime: '2026-10-06 03:40:15',
  prayerTime: [{
    hijri: '1448-04-24', imsak: '05:42:00', fajr: '05:52:00',
    syuruk: '06:58:00', dhuhr: '13:04:00', asr: '16:17:00',
    maghrib: '19:05:00', isha: '20:14:00'
  }]
}

const times = api.parse(JSON.stringify(payload), 'WLY01', '2026-10-06')
assert.equal(times.fajr, '05:52')
assert.equal(times.isha, '20:14')
assert.equal(api.format12('00:00'), '12:00 AM')
assert.equal(api.format12('05:52'), '5:52 AM')
assert.equal(api.format12('12:00'), '12:00 PM')
assert.equal(api.format12('20:14'), '8:14 PM')
assert.equal(api.rows(times, new Date(2026, 9, 6, 12, 0))[1].time, '1:04 PM')
assert.equal(api.rows(times, new Date(2026, 9, 6, 12, 0))[1].next, true)
assert.equal(api.rows(times, new Date(2026, 9, 6, 21, 0)).some(row => row.next), false)
const events = api.timeline(times, new Date(2026, 9, 6, 12, 0))
assert.deepEqual(Array.from(events, event => event.name), ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'])
assert.equal(events[0].elapsed, true)
assert.equal(events[1].next, true)
assert.equal(events[1].elapsed, false)
assert.equal(api.timeline(times, new Date(2026, 9, 6, 13, 4))[1].elapsed, true)
assert.equal(api.nextPrayer(times, new Date(2026, 9, 6, 12, 0)).remaining, 64)
assert.equal(api.nextPrayer(times, new Date(2026, 9, 6, 21, 0)).tomorrow, true)
assert.equal(api.nextPrayer(times, new Date(2026, 9, 6, 21, 0)).remaining, 532)
assert.equal(api.duration(64), '1 h 4 min')
const rise = api.sunPoint(times, api.minutes(times.syuruk), 420, 170)
const noon = api.sunPoint(times, (api.minutes(times.syuruk) + api.minutes(times.maghrib)) / 2, 420, 170)
const set = api.sunPoint(times, api.minutes(times.maghrib), 420, 170)
assert.equal(rise.y, 170 * 0.75)
assert.ok(Math.abs(set.y - rise.y) < 1e-9)
assert.ok(noon.y < rise.y && rise.x < noon.x && noon.x < set.x)
assert.ok(api.sunPoint(times, api.minutes(times.fajr), 420, 170).y > rise.y)
assert.ok(api.sunPoint(times, api.minutes(times.isha), 420, 170).y > set.y)
assert.throws(() => api.parse(JSON.stringify(payload), 'SGR01', '2026-10-06'))
assert.throws(() => api.parse(JSON.stringify(payload), 'WLY01', '2026-10-07'))
assert.throws(() => api.parse(JSON.stringify({ ...payload, prayerTime: [{ ...payload.prayerTime[0], asr: 'bad' }] }), 'WLY01', '2026-10-06'))
console.log('JAKIM parser, prayer timeline, sun arc and next-prayer checks passed')
