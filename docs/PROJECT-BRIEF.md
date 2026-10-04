# Tri-County Slo-Pitch League: project brief

Read this first if you are picking this project up cold, human or AI.

## What this is

A website for the Tri-County Slo-Pitch League, an adult co-ed recreational
slo-pitch league playing Sunday mornings from May to August on municipal
diamonds in Kitchener and Waterloo, Ontario.

Live at https://tricountyslopitch.ca

It replaces a LeagueLineup site that was shut down when that platform closed.

Steph Smith runs the league side and owns the repo. Steph is not a developer by
trade, so everything must be operable without one.

## Hard constraints

- Free tools only. No paid hosting, no paid services, no paid APIs
- Static site on GitHub Pages. There is no server and no database
- Repo JSON is the source of truth. Google Sheets is a convenience layer with a
  fallback to the repo if a sheet is unreachable
- No personal data in the public repo or in published sheet tabs. No emails,
  no phone numbers, no team codes
- Batch commits. Rapid pushes collide and fail the Pages deployment
- Verify before claiming something works. Check the rendered output, the live
  URL or the real endpoint, not just that the code looks right
- No comments in the codebase unless absolutely necessary
- Do not open browser tabs repeatedly. Reuse one page

## How it is built

| Layer | Choice |
|---|---|
| Hosting | GitHub Pages, deployed by `.github/workflows/deploy.yml` from `src/` |
| Domain | tricountyslopitch.ca, bought through Cloudflare, Let's Encrypt cert |
| Data | JSON in `src/data/`, optionally overlaid by published Google Sheet CSVs |
| Forms | Google Apps Script web apps, one per purpose |
| Analytics | GA4, G-B4KTYY907V |
| CI | `.github/workflows/checks.yml` on every pull request |

Why static and not a database: roughly 400 rows of data total. A real database
needs a server, auth, an admin UI and maintenance. Revisit only if per-player
statistics are ever wanted.

## Repo layout

```
src/          the website, the only thing published
  data/       seasons, teams, config. source of truth
  img/        images, logos, icons
  js/         site.js plus one file per page in js/pages/
  css/
docs/         MAINTENANCE.md and this brief
reference/    old site archive, flyers, drafts. not published
apps-script/  Apps Script sources. gitignored, contains an email address
```

## The season data

`src/data/seasons/2026.json` holds 42 games across 7 teams, 31 May to 8 August.

Teams: Misfits, Pithogs, Cobras, Balls Deep, Crew 2.0, Chok it and Stroke it,
Kraus Krew.

Only 20 of the 42 games have scores, transcribed from photographs of
handwritten score sheets. The gap is the single biggest limitation on the site:
standings, the head-to-head grid and both season charts all run on half a
season. Missing are 31 May to 28 June, one game on 12 July, and the playoffs
on 16, 23 and 30 August.

Older seasons: 2019 has 66 games across 12 teams, rebuilt from the league's own
official schedule PDF found in the archive. Only 11 of those have scores,
because the archive was captured from one team's page and carried only their
results. 2020 has no games.

2019 used a third venue, Rittenhouse Park, which is no longer in use.

## Score reporting

Clicking a game with no score opens a panel on the site. A captain enters both
scores, picks which of the two teams they are reporting as, and enters a team
code.

The code is checked by Apps Script against a private `Captains` tab in the
spreadsheet. Codes are never in the website code. A wrong code is rejected with
a message; the panel stays open.

Verification states, computed in `src/js/site.js`:

- `official`: entered by the league in the Games tab, overrides everything
- `confirmed`: both teams reported and agree
- `unconfirmed`: one team reported
- `disputed`: teams disagree, no score is published

Badges only appear for unconfirmed and disputed, because most scores are
official and badging everything carries no information.

Only the two teams playing a game may report it.

## Google Sheet tabs

| Tab | Published | Purpose |
|---|---|---|
| Teams | yes | team names and numbers, so teams can be added without a developer |
| Games | yes | league overrides, always win |
| Form Responses 1 | yes | captain reports. seven columns including Email Address |
| Captains | **no** | team codes. must never be published |
| Contact Log | no | contact form submissions |
| Subscribers | no | newsletter signups with CASL consent |

Published CSVs cache for about five minutes.

## Deploying

Content edits can go straight to `main`. Code changes go through a branch and a
pull request so CI runs. Merging deploys. Only one deployment runs at a time.

Local preview: `cd src && python3 -m http.server 8000`

## Decisions worth not relitigating

- Apps Script over Cloudflare Workers for email: MailChannels' free tier ended
  in 2024 and Workers cannot send mail alone
- Clickable game rows rather than a button on every row, which looked busy
- Team codes rather than accounts: real accounts need a server. Codes checked
  server-side are the strongest option available for free
- No price on any flyer. Deliberate
- Sponsor tiers are $150 team and $300 league. Comparable youth leagues charge
  more because they control jerseys; this league does not
- Player fee is $110

## Open work

Tracked at https://github.com/users/SRSmithnation/projects/1

Blocked on Steph: the missing scores, playoff games, founding year, e-transfer
address, sponsor calls, the finance review with the convenor, the Facebook
page, and a Google Analytics email that needs checking.

Available to build: a players-wanted page, past sponsors section, a CI check
that rejects comments.

## Things that have gone wrong before

- A deploy token without `workflow` scope cannot touch `.github/workflows/`
- Deleting a branch before confirming a merge orphans the pull request
- Editing an Apps Script deployment without choosing New version leaves the old
  code running
- Writing spreadsheet rows by position breaks when a column is added. Write by
  column name
- A standings sort on games played ranked an undefeated team sixth. Sort on win
  percentage
- Grid children default to `min-width: auto` and cause horizontal scroll on
  phones
- Image models cannot draw a scannable QR code and mangle small text
