#!/usr/bin/env python3
"""Write calendar files for the current season.

  python3 scripts/make-ics.py

Produces src/calendar/season-<year>.ics for every game, and one file per team.
Subscribing to a file means the games appear in a phone calendar and update
when the file changes, so re-run this whenever the schedule changes.
"""
import json, os, re, sys
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(SRC, 'calendar')
SITE = 'https://tricountyslopitch.ca'
GAME_MINUTES = 95


def slug(name):
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', name.lower())).strip('-')


def when(game):
    m = re.match(r'(\d{1,2}):(\d{2})\s*(am|pm)', (game.get('time') or '').strip().lower())
    hh, mm = (10, 0) if not m else (int(m.group(1)) % 12 + (12 if m.group(3) == 'pm' else 0), int(m.group(2)))
    start = datetime.fromisoformat(game['iso']).replace(hour=hh, minute=mm)
    return start, start + timedelta(minutes=GAME_MINUTES)


def fold(line):
    out = line.encode('utf-8')
    if len(out) <= 73:
        return line
    chunks, i = [], 0
    while i < len(out):
        chunks.append(out[i:i + 73].decode('utf-8', 'ignore'))
        i += 73
    return '\r\n '.join(chunks)


def esc(s):
    return str(s).replace('\\', '\\\\').replace(';', '\\;').replace(',', '\\,').replace('\n', '\\n')


def build(name, games, season, addresses):
    now = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    lines = ['BEGIN:VCALENDAR', 'VERSION:2.0',
             'PRODID:-//Tri-County Slo-Pitch League//EN', 'CALSCALE:GREGORIAN',
             'METHOD:PUBLISH', f'X-WR-CALNAME:{esc(name)}',
             'X-WR-TIMEZONE:America/Toronto',
             f'X-WR-CALDESC:{esc(f"Tri-County Slo-Pitch League, {season} season")}']
    for g in games:
        start, end = when(g)
        venue = g.get('venue') or ''
        place = next((a for key, a in addresses.items() if key.lower() in venue.lower()), '')
        loc = f'{venue}, {place}' if place else venue
        played = g.get('home_score') is not None and g.get('away_score') is not None
        title = f"{g['away']} at {g['home']}"
        if played:
            title += f" ({g['away_score']}-{g['home_score']})"
        lines += [
            'BEGIN:VEVENT',
            f"UID:{season}-{g['id']}@tricountyslopitch.ca",
            f'DTSTAMP:{now}',
            f"DTSTART;TZID=America/Toronto:{start.strftime('%Y%m%dT%H%M%S')}",
            f"DTEND;TZID=America/Toronto:{end.strftime('%Y%m%dT%H%M%S')}",
            f'SUMMARY:{esc(title)}',
            f'LOCATION:{esc(loc)}',
            f'DESCRIPTION:{esc(f"Game {g["id"]}. Schedule and scores at {SITE}/schedule.html")}',
            f'URL:{SITE}/schedule.html',
            'END:VEVENT',
        ]
    lines.append('END:VCALENDAR')
    return '\r\n'.join(fold(l) for l in lines) + '\r\n'


def main():
    cfg = json.load(open(os.path.join(SRC, 'data', 'config.json')))
    season = cfg['current_season']
    data = json.load(open(os.path.join(SRC, 'data', 'seasons', f'{season}.json')))
    try:
        addresses = {k: v.get('address', '') for k, v in
                     json.load(open(os.path.join(SRC, 'data', 'venues.json'))).items()}
    except Exception:
        addresses = {}

    os.makedirs(OUT, exist_ok=True)
    written = []

    path = os.path.join(OUT, f'season-{season}.ics')
    open(path, 'w', newline='').write(
        build(f'Tri-County Slo-Pitch {season}', data['games'], season, addresses))
    written.append((os.path.basename(path), len(data['games'])))

    for team in data['teams']:
        games = [g for g in data['games'] if team in (g['home'], g['away'])]
        path = os.path.join(OUT, f'{slug(team)}-{season}.ics')
        open(path, 'w', newline='').write(
            build(f'{team} {season}', games, season, addresses))
        written.append((os.path.basename(path), len(games)))

    for name, n in written:
        print(f'  {name:<34} {n} games')
    print(f'  {len(written)} file(s) in src/calendar/')
    return 0


if __name__ == '__main__':
    sys.exit(main())
