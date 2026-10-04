#!/usr/bin/env python3
"""Start a new season.

  python3 scripts/new-season.py 2027 --from schedule.csv
  python3 scripts/new-season.py 2027 --empty

The CSV needs a header row. Recognised columns, case-insensitive:
  date, time, venue, away, home          (required)
  division, away_score, home_score, id   (optional)

Dates may be MM/DD/YY, MM/DD/YYYY or YYYY-MM-DD.
Run from the repo root. Writes src/data/seasons/<year>.json, updates
src/data/seasons.json, config.json and sitemap.xml, then verifies.
"""
import argparse, csv, datetime, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEASONS = os.path.join(ROOT, 'src', 'data', 'seasons')
INDEX = os.path.join(ROOT, 'src', 'data', 'seasons.json')
CONFIG = os.path.join(ROOT, 'src', 'data', 'config.json')
SITEMAP = os.path.join(ROOT, 'src', 'sitemap.xml')


def parse_date(raw):
    raw = (raw or '').strip()
    for fmt in ('%m/%d/%y', '%m/%d/%Y', '%Y-%m-%d', '%d/%m/%Y'):
        try:
            return datetime.datetime.strptime(raw, fmt).date()
        except ValueError:
            pass
    raise SystemExit(f'Cannot read the date "{raw}". Use MM/DD/YY or YYYY-MM-DD.')


def num(v):
    v = str(v or '').strip()
    return int(v) if re.fullmatch(r'\d{1,3}', v) else None


def read_csv(path, division):
    with open(path, newline='', encoding='utf-8-sig') as fh:
        rows = list(csv.DictReader(fh))
    if not rows:
        raise SystemExit(f'{path} has no rows.')
    games = []
    for i, raw in enumerate(rows, 1):
        r = {(k or '').strip().lower(): (v or '').strip() for k, v in raw.items()}
        for need in ('date', 'time', 'away', 'home'):
            if not r.get(need):
                raise SystemExit(f'Row {i} is missing "{need}".')
        d = parse_date(r['date'])
        games.append({
            'date': d.strftime('%m/%d/%y'),
            'sort': d.isoformat(),
            'time': r['time'].lower(),
            'venue': r.get('venue', ''),
            'away': r['away'],
            'home': r['home'],
            'division': r.get('division') or division,
            'away_score': num(r.get('away_score')),
            'home_score': num(r.get('home_score')),
            'status': 'Final' if num(r.get('away_score')) is not None else '',
            'id': num(r.get('id')) or 0,
            'iso': d.isoformat(),
        })
    games.sort(key=lambda g: (g['iso'], g['time']))
    if len({g['id'] for g in games}) != len(games) or any(not g['id'] for g in games):
        for i, g in enumerate(games, 1):
            g['id'] = i
    return games


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('year', type=int)
    ap.add_argument('--from', dest='csv_path')
    ap.add_argument('--empty', action='store_true')
    ap.add_argument('--division', default='Sunday Co-Ed')
    ap.add_argument('--force', action='store_true')
    a = ap.parse_args()

    out = os.path.join(SEASONS, f'{a.year}.json')
    if os.path.exists(out) and not a.force:
        raise SystemExit(f'{out} already exists. Use --force to overwrite.')
    if not a.csv_path and not a.empty:
        raise SystemExit('Pass --from <csv> or --empty.')

    games = read_csv(a.csv_path, a.division) if a.csv_path else []
    teams = sorted({t for g in games for t in (g['home'], g['away'])})

    prev = sorted(int(f[:-5]) for f in os.listdir(SEASONS) if f.endswith('.json'))
    carried = {}
    if teams and prev:
        old = json.load(open(os.path.join(SEASONS, f'{prev[-1]}.json'), encoding='utf-8'))
        carried = {t: n for t, n in (old.get('team_numbers') or {}).items() if t in teams}
    nxt = max(carried.values(), default=0) + 1
    numbers = {}
    for t in teams:
        numbers[t] = carried.get(t, nxt)
        if t not in carried:
            nxt += 1
    teams.sort(key=lambda t: numbers[t])

    season = {
        'year': a.year, 'division': a.division, 'teams': teams, 'games': games,
        'complete': False, 'note': '', 'team_numbers': numbers,
    }
    json.dump(season, open(out, 'w', encoding='utf-8'), indent=2)
    print(f'  wrote {os.path.relpath(out, ROOT)}: {len(teams)} teams, {len(games)} games')

    index = json.load(open(INDEX, encoding='utf-8'))
    index = [s for s in index if s['year'] != a.year]
    index.append({
        'year': a.year, 'division': a.division, 'teams': len(teams),
        'games': len(games),
        'with_scores': sum(1 for g in games if g['away_score'] is not None),
        'complete': False,
    })
    index.sort(key=lambda s: -s['year'])
    json.dump(index, open(INDEX, 'w', encoding='utf-8'), indent=2)
    print(f'  seasons.json now lists {", ".join(str(s["year"]) for s in index)}')

    cfg = json.load(open(CONFIG, encoding='utf-8'))
    cfg['current_season'] = a.year
    json.dump(cfg, open(CONFIG, 'w', encoding='utf-8'), indent=2)
    print(f'  config.json current_season = {a.year}')

    today = datetime.date.today().isoformat()
    pages = [('', 1.0, 'weekly'), ('schedule.html', .9, 'weekly'), ('standings.html', .9, 'weekly'),
             ('teams.html', .8, 'monthly'), ('venues.html', .7, 'monthly'), ('rules.html', .7, 'monthly'),
             ('fees.html', .7, 'monthly'), ('faq.html', .7, 'monthly'), ('sponsors.html', .6, 'monthly'),
             ('seasons.html', .7, 'monthly'), ('contact.html', .6, 'yearly')]
    x = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p, pri, freq in pages:
        x += ['  <url>', f'    <loc>https://tricountyslopitch.ca/{p}</loc>',
              f'    <lastmod>{today}</lastmod>', f'    <changefreq>{freq}</changefreq>',
              f'    <priority>{pri}</priority>', '  </url>']
    for s in index:
        x += ['  <url>', f'    <loc>https://tricountyslopitch.ca/season.html?y={s["year"]}</loc>',
              f'    <lastmod>{today}</lastmod>', '    <changefreq>yearly</changefreq>',
              '    <priority>0.5</priority>', '  </url>']
    x.append('</urlset>')
    open(SITEMAP, 'w', encoding='utf-8').write('\n'.join(x) + '\n')
    print(f'  sitemap.xml rebuilt with {len(pages) + len(index)} URLs')

    html_updated = 0
    for name in os.listdir(ROOT + '/src'):
        if not name.endswith('.html'):
            continue
        path = os.path.join(ROOT, 'src', name)
        html = open(path, encoding='utf-8').read()
        before = html
        html = re.sub(r'(<meta name="tcs-season" content=")\d+(">)', rf'\g<1>{a.year}\g<2>', html)
        html = re.sub(r'(<link rel="preload" as="fetch" crossorigin href="data/seasons/)\d+(\.json">)',
                      rf'\g<1>{a.year}\g<2>', html)
        if html != before:
            open(path, 'w', encoding='utf-8').write(html)
            html_updated += 1
    print(f'  season hint updated in {html_updated} page(s)')

    bad = 0
    ids = [g['id'] for g in games]
    if len(set(ids)) != len(ids):
        print('  ERROR duplicate game ids'); bad += 1
    for g in games:
        for side in ('home', 'away'):
            if g[side] not in teams:
                print(f'  ERROR game {g["id"]}: "{g[side]}" is not in the team list'); bad += 1
    print('  checks passed' if not bad else f'  {bad} problem(s) found')

    import subprocess
    subprocess.run([sys.executable, os.path.join(ROOT, 'scripts', 'make-ics.py')], check=False)

    print('\n  next:')
    print('    1. update the Teams tab in the sheet if the teams changed')
    print('    2. give every team a new code in the Captains tab')
    print('    3. clear last season from the Games and Form Responses 1 tabs')
    print('    4. preview: cd src && python3 -m http.server 8000')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
