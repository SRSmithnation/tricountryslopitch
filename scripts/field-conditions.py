#!/usr/bin/env python3
"""Fetch diamond conditions from the City of Kitchener and write a small JSON file.

  python3 scripts/field-conditions.py

Writes src/data/field-conditions.json only when something changed, so it does
not create a pointless commit and redeploy every run.

The city publishes HTML, not an API, and sends no CORS header, so this cannot
be done from the browser. If the page layout changes this will stop finding
rows, and it writes an empty list rather than guessing. The site treats stale
or empty data as unknown and links to the city page instead.
"""
import json, os, re, sys, urllib.request
from datetime import datetime, timezone

URL = 'https://app2.kitchener.ca/fieldconditions/frame/list.aspx'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'data', 'field-conditions.json')

# Only the diamonds the league actually plays on. Add Wilson Park back if it
# returns to the schedule: ('Wilson Park', ['Diamond #2', 'Diamond #3'])
WANTED = {
    'Bridgeport Sportsfields': ('Bridgeport', ['Diamond #2', 'Diamond #3']),
}


def fetch():
    req = urllib.request.Request(URL, headers={'User-Agent': 'tricountyslopitch.ca field conditions'})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode('utf-8', 'ignore')


def parse(html):
    out = []
    for group, (venue, diamonds) in WANTED.items():
        i = html.find(group)
        if i < 0:
            continue
        seg = re.sub(r'<[^>]+>', '|', html[i:i + 6000])
        parts = [p.strip().replace('&nbsp;', '') for p in seg.split('|')]
        parts = [p for p in parts if p]
        for k, p in enumerate(parts):
            if p in diamonds and k + 3 < len(parts):
                grade, status, updated = parts[k + 1], parts[k + 2], parts[k + 3]
                if not re.fullmatch(r'[A-Z]\d', grade or ''):
                    continue
                out.append({
                    'venue': venue, 'field': p, 'grade': grade,
                    'status': status.upper(),
                    'updated': re.sub(r'\s+', ' ', updated).strip(),
                })
    seen, unique = set(), []
    for f in out:
        key = (f['venue'], f['field'])
        if key in seen:
            continue
        seen.add(key)
        unique.append(f)
    return unique


def main():
    try:
        fields = parse(fetch())
    except Exception as err:
        print(f'  could not fetch: {err}')
        return 1

    payload = {
        'checked': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'source': 'City of Kitchener',
        'source_url': 'https://www.kitchener.ca/fieldconditions',
        'fields': fields,
    }
    if not fields:
        print('  no rows matched, the page layout may have changed')

    old = {}
    if os.path.exists(OUT):
        try:
            old = json.load(open(OUT))
        except Exception:
            old = {}
    if old.get('fields') == fields:
        print(f'  unchanged, {len(fields)} field(s), not rewriting')
        return 0

    json.dump(payload, open(OUT, 'w'), indent=2)
    print(f'  wrote {len(fields)} field(s):')
    for f in fields:
        print(f"    {f['venue']:<13} {f['field']:<12} {f['status']:<8} updated {f['updated']}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
