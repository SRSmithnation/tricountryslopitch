#!/usr/bin/env python3
"""Build a balanced season schedule.

  python3 scripts/make-schedule.py --teams-from src/data/seasons/2026.json \
      --start 2027-05-30 --weeks 10 \
      --slots "10:00 am,11:30 am" --venues "Bridgeport #2,Bridgeport #3" \
      --out ~/Downloads/schedule-2027.csv

Then feed that CSV to scripts/new-season.py.

Fairness, in priority order:
  1. every pair of teams meets as close to the same number of times as possible
  2. home and away games are balanced per team
  3. byes are spread evenly, when the team count is odd
  4. early and late slots are spread evenly
  5. diamonds are spread evenly
"""
import argparse, csv, datetime, itertools, json, os, sys
from collections import defaultdict


def rounds(teams):
    """Circle method. Yields one full round robin as lists of (away, home)."""
    ts = list(teams)
    if len(ts) % 2:
        ts.append(None)
    n = len(ts)
    out = []
    for r in range(n - 1):
        pairs = []
        for i in range(n // 2):
            a, b = ts[i], ts[n - 1 - i]
            if a is None or b is None:
                continue
            pairs.append((a, b) if r % 2 == 0 else (b, a))
        out.append(pairs)
        ts = [ts[0]] + [ts[-1]] + ts[1:-1]
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--teams', help='comma separated team names')
    ap.add_argument('--teams-from', help='a season json to take the team list from')
    ap.add_argument('--start', required=True, help='first game day, YYYY-MM-DD')
    ap.add_argument('--weeks', type=int, required=True)
    ap.add_argument('--slots', required=True, help='comma separated times, earliest first')
    ap.add_argument('--venues', required=True, help='comma separated diamonds')
    ap.add_argument('--skip', default='', help='comma separated YYYY-MM-DD dates to skip')
    ap.add_argument('--division', default='Sunday Co-Ed')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()

    if a.teams_from:
        teams = json.load(open(a.teams_from, encoding='utf-8'))['teams']
    elif a.teams:
        teams = [t.strip() for t in a.teams.split(',') if t.strip()]
    else:
        raise SystemExit('Pass --teams or --teams-from.')
    if len(teams) < 2:
        raise SystemExit('Need at least two teams.')

    slots = [s.strip() for s in a.slots.split(',') if s.strip()]
    venues = [v.strip() for v in a.venues.split(',') if v.strip()]
    skip = {s.strip() for s in a.skip.split(',') if s.strip()}

    start = datetime.date.fromisoformat(a.start)
    days, d = [], start
    while len(days) < a.weeks:
        if d.isoformat() not in skip:
            days.append(d)
        d += datetime.timedelta(days=7)

    per_day = min(len(teams) // 2, len(slots) * len(venues))
    if per_day < len(teams) // 2:
        print(f'  note: only {per_day} games fit per day, so some teams sit out each week')

    schedule = []
    pool, cycle = [], 0
    byes = defaultdict(int)
    homes = defaultdict(int)
    played_so_far = defaultdict(int)
    slot_count = defaultdict(lambda: defaultdict(int))
    venue_count = defaultdict(lambda: defaultdict(int))

    for day in days:
        if not pool:
            cycle += 1
            for rnd in rounds(teams):
                pool.append(rnd)
        rnd = pool.pop(0)
        playing = [t for p in rnd for t in p]
        for t in teams:
            if t not in playing:
                byes[t] += 1

        games = rnd[:per_day]
        for t in [t for p in rnd[per_day:] for t in p]:
            byes[t] += 1

        combos = [(s, v) for s in slots for v in venues]
        combos.sort(key=lambda c: (slots.index(c[0]), venues.index(c[1])))
        for i, (away, home) in enumerate(games):
            bal = lambda t: homes[t] * 2 - played_so_far[t]
            if bal(home) > bal(away):
                away, home = home, away
            slot, venue = combos[i % len(combos)]
            homes[home] += 1
            played_so_far[home] += 1
            played_so_far[away] += 1
            slot_count[away][slot] += 1
            slot_count[home][slot] += 1
            venue_count[away][venue] += 1
            venue_count[home][venue] += 1
            schedule.append({
                'Date': day.strftime('%m/%d/%y'), 'Time': slot, 'Venue': venue,
                'Away': away, 'Home': home, 'Division': a.division,
            })

    out = os.path.expanduser(a.out)
    with open(out, 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=['Date', 'Time', 'Venue', 'Away', 'Home', 'Division'])
        w.writeheader()
        w.writerows(schedule)

    print(f'  wrote {out}')
    print(f'  {len(schedule)} games, {len(days)} game days, {len(teams)} teams, {per_day} games per day')
    print(f'  {days[0]} to {days[-1]}')

    played = defaultdict(int)
    meet = defaultdict(int)
    for g in schedule:
        played[g['Away']] += 1
        played[g['Home']] += 1
        meet[tuple(sorted((g['Away'], g['Home'])))] += 1

    print('\n  fairness')
    print(f"  {'team':<24} {'games':>5} {'home':>5} {'away':>5} {'byes':>5}")
    for t in teams:
        print(f'  {t:<24} {played[t]:>5} {homes[t]:>5} {played[t]-homes[t]:>5} {byes[t]:>5}')

    counts = sorted(meet.values())
    print(f'\n  each pairing meets {counts[0]} to {counts[-1]} times '
          f'({len(meet)} of {len(list(itertools.combinations(teams,2)))} possible pairings used)')
    gaps = max(played.values()) - min(played.values())
    print(f'  biggest gap in games played: {gaps}')
    hgap = max(abs(homes[t] - (played[t] - homes[t])) for t in teams)
    print(f'  biggest home/away imbalance: {hgap}')
    if gaps > 1 or hgap > 2 or counts[-1] - counts[0] > 1:
        print('  WARNING this is less balanced than it should be, check the inputs')
    return 0


if __name__ == '__main__':
    sys.exit(main())
