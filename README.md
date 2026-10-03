# Tri-County Slo-Pitch League

Website for the Tri-County Slo-Pitch League, an adult recreational co-ed
slo-pitch league playing Sunday mornings in Kitchener and Waterloo, Ontario.

**Live at [tricountyslopitch.ca](https://tricountyslopitch.ca)**

---

## What it does

- **Schedule** every game, grouped by day, filterable by team
- **Standings** calculated from real scores, including run differential
- **Teams** with records for the current season
- **Seasons** archive, including partial records recovered from the league's
  previous website
- **Score reporting** by captains through a form, with a confirmation check
- **Contact form** that emails the league

## How it is built

A static site. No server, no database, no build step. Plain HTML, CSS and
JavaScript, hosted free on GitHub Pages.

Data lives in `data/seasons/*.json` in this repo. A published Google Sheet is
layered on top so scores and teams can be edited without touching code. If the
sheet is unreachable, the site falls back to the repo data and keeps working.

```
index.html, schedule.html, ...   pages
css/site.css                     all styling
js/site.js                       shared logic
data/config.json                 links to the sheets and forms
data/seasons/                    one file per season, the source of truth
data/source/                     original exports kept for reference
img/logo/                        images used by the site
reference/                       archived material, not published
```

## Running it locally

Needs a web server, because the pages fetch JSON and `file://` blocks that.

```bash
cd tricountyslopitch
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Making changes

| Change | Where |
|---|---|
| Record a score | the Google Form, or the Games tab of the sheet |
| Add or rename a team | the Teams tab of the sheet |
| Add a season | `data/seasons/`, see docs/MAINTENANCE.md |
| Edit page wording | the `.html` file |
| Styling | `css/site.css` |

Pushing to `main` deploys automatically, usually within two minutes.

**Full instructions, including what to do when something breaks, are in
[docs/MAINTENANCE.md](docs/MAINTENANCE.md).**

## Credits

Site structure originally adapted from a league site built by a friend for the
Kitchener Co-ed Volleyball League, then rebuilt for slo-pitch.

Historical season data was recovered from the league's previous LeagueLineup
site after that platform shut down. Some seasons are incomplete as a result and
are labelled accordingly.
