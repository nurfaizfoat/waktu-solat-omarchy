// JAKIM e-Solat daily JSON parser and display helpers. Kept Qt-free for testing.
var FARD = [
  { key: "fajr", label: "Subuh" },
  { key: "dhuhr", label: "Zohor" },
  { key: "asr", label: "Asar" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isyak" }
]

function parse(text, zone, dateKey) {
  var result = JSON.parse(text)
  if (result.status !== "OK!" || result.zone !== zone ||
      !Array.isArray(result.prayerTime) || result.prayerTime.length !== 1 ||
      String(result.serverTime || "").slice(0, 10) !== dateKey)
    throw new Error("JAKIM did not return today's times for " + zone)

  var entry = result.prayerTime[0]
  var times = { hijri: String(entry.hijri || "") }
  var keys = ["imsak", "fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"]
  for (var i = 0; i < keys.length; i++) {
    var value = String(entry[keys[i]] || "")
    if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value))
      throw new Error("JAKIM returned an invalid " + keys[i] + " time")
    times[keys[i]] = value.slice(0, 5)
  }
  return times
}

function format12(time) {
  var hour = Number(time.slice(0, 2))
  return (hour % 12 || 12) + time.slice(2) + (hour < 12 ? " AM" : " PM")
}

function minutes(time) {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
}

// Clock time runs left to right; the arc is a visual model of the sun's
// passage, not an astronomical altitude calculation. Sunrise and sunset are
// exactly on the horizon, with a half-sine daylight arc between them.
function sunPoint(times, minute, width, height) {
  var dawn = minutes(times.fajr)
  var rise = minutes(times.syuruk)
  var set = minutes(times.maghrib)
  var night = minutes(times.isha)
  var start = dawn - 25
  var end = night + 25
  var t = Math.max(start, Math.min(end, minute))
  var horizon = height * 0.75
  var x = 22 + (width - 44) * (t - start) / (end - start)
  var y
  if (t < rise) y = horizon + 24 * (rise - t) / (rise - start)
  else if (t > set) y = horizon + 24 * (t - set) / (end - set)
  else y = horizon - height * 0.56 * Math.sin(Math.PI * (t - rise) / (set - rise))
  return { x: x, y: y }
}

function timeline(times, now) {
  if (!times) return []
  var current = now.getHours() * 60 + now.getMinutes()
  var next = FARD.findIndex(function(prayer) { return minutes(times[prayer.key]) > current })
  return FARD.map(function(event) {
    return {
      name: event.label, time: times[event.key], minute: minutes(times[event.key]),
      next: next >= 0 && event.key === FARD[next].key,
      elapsed: minutes(times[event.key]) <= current,
      daylight: event.key !== "fajr" && event.key !== "isha"
    }
  })
}

function nextPrayer(times, now) {
  if (!times) return null
  var current = now.getHours() * 60 + now.getMinutes()
  for (var i = 0; i < FARD.length; i++) {
    var remaining = minutes(times[FARD[i].key]) - current
    if (remaining > 0) return { name: FARD[i].label, time: times[FARD[i].key], remaining: remaining }
  }
  return { name: "Subuh", time: times.fajr, remaining: 1440 - current + minutes(times.fajr), tomorrow: true }
}

function duration(total) {
  return Math.floor(total / 60) + " h " + (total % 60) + " min"
}

function rows(times, now) {
  if (!times) return []
  var currentMinutes = now.getHours() * 60 + now.getMinutes()
  var next = -1
  for (var i = 0; i < FARD.length; i++) {
    var value = times[FARD[i].key]
    if (next < 0 && minutes(value) > currentMinutes)
      next = i
  }
  return FARD.map(function(prayer, index) {
    return { name: prayer.label, time: format12(times[prayer.key]), next: index === next }
  })
}
