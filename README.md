# Waktu Solat Clock for Omarchy

An Omarchy shell clock plugin with the stock calendar popup plus today's five prayer times and Imsak from **JAKIM e-Solat**. The prayer panel plots the five prayers along a sun-path timeline: Maghrib marks the sunset horizon, Zohor and Asar sit on the daytime arc, and Subuh and Isyak appear below the horizon. Sunrise is used to shape the arc but is not shown as a prayer marker. The elapsed part of the curve is solid and past prayers have filled dots; the upcoming part is dashed with outlined dots. A dot follows the current time; the next fard prayer and its countdown update each minute (after Isyak, the countdown points to tomorrow's Subuh). The arc is a visual interpolation between sunrise and sunset, not an astronomical sun-altitude calculation. The bar clock and prayer cards display in 12-hour format with AM/PM; the NEXT heading uses `HH:MM`. The calendar's controls, clock shortcuts, and bar integration are inherited from Omarchy's `omarchy.clock` plugin.

For the Omarchy Quattro shell. Default zone: `WLY01` (Kuala Lumpur/Putrajaya). Prayer times always refer to **today** in your system time zone, even when browsing other calendar months; set the machine's time zone to Malaysia (`Asia/Kuala_Lumpur`) for correct day and next-prayer highlighting. Times are fetched on first open, on day/zone change, and retried on reopening or by clicking the error message. The last successful fetch is cached for the day. Requires `curl` and network access to [JAKIM e-Solat](https://www.e-solat.gov.my/); no API key is needed.

## Install

```sh
omarchy plugin add https://github.com/nurfaizfoat/waktu-solat-omarchy.git --enable
```

If it does not appear in the bar, use Omarchy's bar widget settings to add `nurfaizfoat.clock` in place of `omarchy.clock`. Do not keep both clocks in the bar. The `omarchy.clonedFrom` metadata tells Omarchy which built-in clock this replaces and preserves stock-clock shortcut routing.

Click the clock to open the calendar and prayer times. Right-click cycles clock formats; middle-click opens timezone selection. To change the prayer zone, use the bar widget settings or set `"zone": "<JAKIM zone code>"` on the `nurfaizfoat.clock` entry in `~/.config/omarchy/shell.json` (for example, `"zone": "WLY01"`). [JAKIM e-Solat](https://www.e-solat.gov.my/) provides the zone list.

## Remove

```sh
omarchy plugin remove nurfaizfoat.clock
```

If you manually added the bar entry, remove it and restore `omarchy.clock` in the bar settings.

## Develop from this working directory

The local development copy lives at `~/Documents/waktu-solat-omarchy` and is linked from `~/.config/omarchy/plugins/nurfaizfoat.clock`. After editing the linked plugin, run `omarchy restart shell`: the shell's file watcher does not reliably reload already-mounted plugins through symlinks, even after `omarchy-shell shell rescanPlugins`.

## Develop and verify

```bash
omarchy plugin validate .
node test/prayer-times.test.cjs
omarchy restart shell
git status
```

`manifest.json`, `BarWidget.qml`, `Panel.qml`, `Model.js` and `PrayerTimes.js` are the distributable plugin. The date/time API is `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=WLY01`. No API response is checked into Git.

This project starts from [Omarchy's clock plugin](https://github.com/omacom/omarchy/tree/quattro/shell/plugins); `Model.js`, `BarWidget.qml`, and the calendar part of `Panel.qml` retain the upstream implementation. The project is licensed under [MIT](LICENSE), retaining upstream copyright. Keep an eye on changes to upstream `omarchy.clock` when updating Omarchy.

## How this version was built

1. Cloned the Omarchy clock plugin into a user-owned project, keeping its calendar and bar behavior.
2. Added daily JAKIM e-Solat fetching for the configured zone, a five-prayer display, Imsak, and the next-prayer countdown.
3. Added a time-scaled sunrise-to-sunset curve, with filled/solid elapsed markers and line, outlined/dashed upcoming markers and line. Sunrise shapes the arc but has no visible label or card.
4. Replaced the displayed `WLY01` code with “Kuala Lumpur dan Putrajaya” and moved the upcoming `HH:MM` time and countdown beside NEXT.
5. Tested the parser, timeline, sun-path math, and countdown under Node; validated the plugin, restarted the shell, and checked the rendered panel.
