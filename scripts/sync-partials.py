#!/usr/bin/env python3
"""Push partials/nav.html and partials/footer.html into every page.

  python3 scripts/sync-partials.py           apply
  python3 scripts/sync-partials.py --check   report drift and exit 1

GitHub Pages does no templating, so every page carries its own copy of the nav
and footer. This keeps one source of truth and writes it into all of them.
CI runs --check, so a page can never drift out of sync unnoticed.

Per-page differences the script handles:
  {{COMPACT}}            index starts tall, every other page starts compact
  {{CURRENT:<page>}}     marks the current nav item with aria-current
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
TALL = {'index.html'}
NO_CHROME = {'sponsor-pack.html'}

CURRENT_FOR = {
    'schedule.html': 'schedule', 'standings.html': 'standings',
    'teams.html': 'teams', 'team.html': 'teams', 'rules.html': 'rules',
    'sponsors.html': 'sponsors',
}


def block(html, open_tag, close_tag):
    i = html.find(open_tag)
    if i < 0:
        return None, None
    j = html.find(close_tag, i)
    if j < 0:
        return None, None
    return i, j + len(close_tag)


def render(template, page):
    out = template.replace('{{COMPACT}}', '' if page in TALL else ' nav--compact')
    active = CURRENT_FOR.get(page)
    def sub(m):
        return ' aria-current="page"' if m.group(1) == active else ''
    return re.sub(r'\{\{CURRENT:([a-z-]+)\}\}', sub, out)


def main():
    check = '--check' in sys.argv
    nav_t = open(os.path.join(ROOT, 'partials', 'nav.html'), encoding='utf-8').read().strip()
    foot_t = open(os.path.join(ROOT, 'partials', 'footer.html'), encoding='utf-8').read().strip()

    changed, skipped, missing = [], [], []
    for page in sorted(f for f in os.listdir(SRC) if f.endswith('.html')):
        if page in NO_CHROME:
            skipped.append(page)
            continue
        path = os.path.join(SRC, page)
        html = open(path, encoding='utf-8').read()
        before = html

        ni, nj = block(html, '<nav class="nav', '</nav>')
        if ni is None:
            missing.append(f'{page}: no nav')
        else:
            html = html[:ni] + render(nav_t, page) + html[nj:]

        fi, fj = block(html, '<footer class="foot', '</footer>')
        if fi is None:
            missing.append(f'{page}: no footer')
        else:
            html = html[:fi] + render(foot_t, page) + html[fj:]

        if html != before:
            changed.append(page)
            if not check:
                open(path, 'w', encoding='utf-8').write(html)

    for m in missing:
        print(f'  WARNING {m}')
    if skipped:
        print(f"  skipped (standalone layout): {', '.join(skipped)}")

    if check:
        if changed:
            print(f'  {len(changed)} page(s) out of sync with partials/: ' + ', '.join(changed))
            print('  run: python3 scripts/sync-partials.py')
            return 1
        print('  every page matches partials/')
        return 0

    print(f'  updated {len(changed)} page(s)' + (': ' + ', '.join(changed) if changed else ''))
    return 1 if missing else 0


if __name__ == '__main__':
    sys.exit(main())
