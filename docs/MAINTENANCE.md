# Running the Tri-County Slo-Pitch website

Written so someone who is not a developer can keep this site going.

---

## What this site is made of

| Piece | What it does | Where |
|---|---|---|
| The website | Plain files. No server, nothing to crash. | this repo, `SRSmithnation/tricountryslopitch` |
| Hosting | Serves the files, free | GitHub Pages |
| Domain | tricountyslopitch.ca | registered at Cloudflare |
| Scores | Captains submit a form, the site reads the sheet | Google Form + Sheet |
| Contact form | Emails the league | Google Apps Script |
| Visitor stats | Who visited, what browser | Google Analytics (`G-B4KTYY907V`) |

**The golden rule:** the repo always holds a complete copy of the data. Google is a
convenience for editing. If Google disappeared tomorrow, the site keeps working.

---

## The things you will actually need to do

### Record a score

Captains do this themselves at the website: Schedule → click a game with no score.
The Game ID fills in automatically.

As convenor you can also type a score straight into the **Games** tab of the
spreadsheet. A score you type there is treated as official and **cannot be
overwritten** by a captain's submission.

Scores appear on the site within about 5 minutes (Google caches the sheet).

### What the score labels mean

| Label | Meaning |
|---|---|
| *(no label)* | Official, or both teams reported the same score |
| **Unconfirmed** | Only one team reported it |
| **Disputed** | The two teams reported different scores. No score is shown until you settle it |

To settle a dispute: type the correct score in the **Games** tab. That wins.

### Typos in team names

Team names typed into the spreadsheet are checked against the names the site
already knows. A close match is corrected automatically, so "Cobas" is read as
"Cobras". A name that is not close to any existing team is treated as a genuinely
new team, which is how you add one. Corrections are logged in the browser console.

### Add or rename a team

Edit the **Teams** tab of the spreadsheet: `#`, `Team`, `Division`.
The number controls the order shown on the site.

*(This works once the Teams tab is published to the web. If team changes are not
appearing, the tab is not published, see "Publishing a sheet tab" below.)*

### Add next season's schedule

1. Open `src/data/seasons/2026.json` to see the shape.
2. Copy it to `src/data/seasons/2027.json`, replace the games.
3. Add `2027` to `src/data/seasons.json`.
4. Create a matching Games tab in the spreadsheet so captains can report scores.

Each game needs: `id` (1,2,3...), `date` (MM/DD/YY), `iso` (YYYY-MM-DD),
`time`, `venue`, `away`, `home`, and `away_score`/`home_score` set to `null`.

Everything else updates itself. The homepage, standings, schedule and seasons
pages all read whichever season is newest.

### Change the fees, rules or FAQ wording

Edit `rules.html`, `faq.html` or `contact.html` directly on GitHub:
open the file, click the pencil icon, edit, Commit changes.
The site updates in about two minutes.

---

## The three Google endpoints

Three things on the site talk to Google: the contact form, the newsletter
signup and score reporting. Each one is a **separate** Apps Script project:

| Project | Does what | Writes to |
|---|---|---|
| TCS contact | emails you the contact form, logs a copy | Contact Log |
| TCS subscribe | newsletter signups, emails you each one | Subscribers |
| TCS scores | captain score reports, checks team codes | Form Responses 1 |

They are standalone, not attached to the spreadsheet, and reach it with
`openById`. They used to be three files in one project, which meant three
functions called `doPost` in one namespace, where only the last one loaded
wins. Redeploying any of them would have silently broken the other two.

Each can now be edited and redeployed on its own.

When deploying one: **Execute as Me**, **Who has access Anyone**. Anything
else returns Access Denied, because the site calls them from a visitor's
browser with no Google session.

After any redeploy, check all three still answer as themselves:

```bash
for k in contact_endpoint subscribe_endpoint score_endpoint; do
  curl -sL "$(python3 -c "import json;print(json.load(open('src/data/config.json'))['$k'])")"
  echo
done
```

Sources live in `apps-script/standalone/`, which is gitignored because it
contains an email address.

## Diamond status

The venues page shows whether the Bridgeport diamonds are open, taken from the
City of Kitchener. A workflow checks every 20 minutes on Sunday mornings from
May to August and nothing the rest of the year.

The card **hides itself** if the data is more than 8 hours old or the check
found nothing, so it can never show a stale OPEN. When it hides, the manual
link to the city page is still there.

To check by hand, go to the repo's **Actions** tab, pick **field conditions**
on the left, then **Run workflow**:
https://github.com/SRSmithnation/tricountryslopitch/actions

Wilson Park is deliberately not included. Add it back in
`scripts/field-conditions.py` if the league plays there again.

This is scraped from the city's HTML, not an official API, so it can break if
they redesign the page. If the card stops appearing, that is why, and the site
degrades to the manual link rather than showing something wrong.

## Posting a rainout or an announcement

A red banner appears across the top of every page, under the header. Use it for
cancellations, venue changes and season news.

Open the **Notices** tab in the spreadsheet and fill in a row:

| Column | What it does |
|---|---|
| `Message` | the text shown. Keep it short, it sits on one line |
| `Level` | `alert` for red, use for cancellations. `info` for gold, use for news |
| `Link` | optional, adds a More link |
| `Expires` | optional `YYYY-MM-DD`. The banner stops showing after this date |
| `Active` | must say `yes` to show. Blank or anything else is ignored |

It appears on the site within about ten minutes, usually sooner.

Only the first active row shows, so put the most important one at the top.
Visitors cannot dismiss it, so turn it off by setting `Active` to `no` rather
than leaving a stale message up. Setting `Expires` to the day after the game
means it turns itself off.

## Calendar files

Players can put the games in their phone calendar. The schedule page links the
whole season, and each team page links just that team's games.

Two options are offered: **download**, a one-off snapshot, and **subscribe**
via a `webcal://` link, which keeps updating when the file changes. Subscribe
is the better one to point people at.

The files live in `src/calendar/` and are generated, not hand-written. **After
any change to the schedule, regenerate them:**

```bash
python3 scripts/make-ics.py
```

`new-season.py` runs it automatically when a new season is created. If you edit
a game date or venue by hand, run it yourself or the calendars will be stale.

Games are 95 minutes in the calendar, which is the usual hour and a half plus a
little. Venue addresses come from `src/data/venues.json`, so a subscriber can
tap the location for directions.

## Score reporting

Clicking a game with no score opens a panel on the site. A captain enters the
two scores, picks which team they are reporting as, and enters their team code.

A score still needs **both** teams to report the same result before it is shown
as confirmed. One report shows as unconfirmed. Two that disagree show as
disputed and no score is published. Anything you type into the Games tab
overrides all of it.

### Turning it on

The panel only appears once an endpoint is configured. Until then, clicking a
game opens the old Google Form instead, so nothing breaks.

1. Open the league spreadsheet, Extensions > Apps Script
2. Paste in `apps-script/score-endpoint.gs`
3. Deploy > New deployment > Web app, execute as **Me**, access **Anyone**
4. Copy the `/exec` URL into `src/data/config.json` as `score_endpoint`

### Team codes

Add a tab named **Captains** with two columns, `Team` and `Code`, one row per
team. Pick any short code, for example `cobras26`.

The codes live only in the spreadsheet. They are never in the website code, so
nobody can read them by viewing the page source. The check happens on Google's
side, and a wrong code is rejected with a message in the panel.

Give each captain only their own code. If a code leaks, change it in the
Captains tab and it stops working immediately.

### What this does and does not stop

It stops a stranger with the web address entering scores, which was the gap
before. It does not stop someone who has been given a code from entering a
wrong score for their own team. That is what the two-team confirmation is for,
and you can always correct anything from the Games tab.

## Building a schedule

If the league has not already drawn one up, generate a balanced one:

```bash
python3 scripts/make-schedule.py \
  --teams-from src/data/seasons/2026.json \
  --start 2027-05-30 --weeks 10 \
  --slots "10:00 am,11:30 am" \
  --venues "Bridgeport #2,Bridgeport #3" \
  --out ~/Downloads/schedule-2027.csv
```

It works with any number of teams, spreads byes when the count is odd, evens
out home and away games, and prints a fairness table. If it warns that the
result is poor, the usual cause is not enough time slots or diamonds for the
number of teams. Each team needs a game, so N teams need N/2 games per day.

The CSV it writes feeds straight into the next step.

## Starting a new season

Once the new schedule arrives, put it in a CSV with a header row of
`Date,Time,Venue,Away,Home` and run:

```bash
cd ~/Desktop/Playground/tricountryslopitch
python3 scripts/new-season.py 2027 --from ~/Downloads/schedule.csv
```

That creates the season file, updates the season list, points the site at the
new year, rebuilds the sitemap and checks the data makes sense. Team numbers
carry over, so Misfits stays 1.

Then in the spreadsheet: update the Teams tab, give every team a **new** code
in the Captains tab, and clear last season's rows from Games and
Form Responses 1. Old reports must not attach to reused game ids.

Give captains their codes before the first game day, or nobody can report a
score.

## Changing the nav or the footer

GitHub Pages does no templating, so every page carries its own copy of the nav
and footer. Rather than editing 14 files, edit one:

- `partials/nav.html`
- `partials/footer.html`

Then push it into every page:

```bash
python3 scripts/sync-partials.py
```

Two placeholders handle the per-page differences:

| Placeholder | What it does |
|---|---|
| `{{COMPACT}}` | the homepage header starts tall, every other page starts compact |
| `{{CURRENT:teams}}` | marks that nav item as the current page |

**Never edit the nav or footer inside a page.** The next sync overwrites it,
and CI will fail the pull request because the page no longer matches the
partial. If you want a page to differ, add it to `NO_CHROME` in the script, as
`sponsor-pack.html` is, since it has a standalone layout.

This was added after finding real drift: the seasons page footer was missing
Rules, Venues, Fees, FAQ and Sponsors, and the sponsors page was missing Fees,
Past seasons and Sponsors.

## Why main is protected

`main` has a ruleset requiring the `verify` check to pass. It also blocks force
pushes and branch deletion.

This exists because a pull request with a **failing check was merged anyway**,
which made CI advisory rather than enforcing.

Repository admins can bypass it, so you are never locked out of your own site.
Everything else, including the field-conditions bot, must go through a pull
request with green checks.

That is why the bot opens a pull request and auto-merges rather than pushing
to `main` directly.

## Making changes safely (branches and pull requests)

Small content edits can go straight to `main` from the GitHub web editor.
Anything that touches code should go through a branch and a pull request, so the
automated checks run before it reaches the live site.

```bash
git checkout -b change-the-thing     # start a branch
# ... make changes, test at localhost:8000 ...
git add -A && git commit -m "what changed"
git push -u origin change-the-thing
gh pr create --fill                  # or open the PR on github.com
```

The checks run automatically on the pull request and must pass:

| Check | Catches |
|---|---|
| JavaScript syntax | a typo that would break a page |
| JSON parses | a broken data file |
| Internal links resolve | a renamed or deleted file still linked |
| Season data is coherent | duplicate game ids, a game naming a team that does not exist |
| No secrets committed | an API key or token slipping in |

Merge the pull request once they are green. Merging deploys.

**Only one deployment runs at a time.** Pushing several times in quick succession
makes them collide and fail with "in progress deployment". Batch changes into one
push and wait for the previous deploy to finish.

## Publishing a sheet tab

The site can only read tabs that are **published to the web**.

1. In the spreadsheet: **File → Share → Publish to web**
2. Pick the tab, choose **CSV**, click **Publish**
3. Copy the URL and put it in `src/data/config.json`

```
scores_csv      the Games tab
responses_csv   the form responses
teams_csv       the Teams tab
```

**Never publish a tab containing email addresses or phone numbers.** Anything
published is readable by anyone who has the link.

---

## When something breaks

### A change isn't showing on the site
1. Hard refresh: `Cmd+Shift+R`, or open an incognito window.
2. Check https://github.com/SRSmithnation/tricountryslopitch/actions
   The top entry should be green. If it's red, open it and read the error.
3. GitHub's cache can lag by about 10 minutes. Wait, then check again.

### Deployments keep failing with "in progress deployment"
Two deploys collided. Wait 30-60 minutes, then push any small change to retry.
Avoid pushing several times in quick succession.

### Scores aren't updating
1. Is the score actually in the **Games** tab of the sheet?
2. Is that tab still published? (File → Share → Publish to web)
3. Google caches published sheets for about 5 minutes.

### The whole site is down
Check https://www.githubstatus.com. If GitHub Pages is fine, check that the
domain still resolves and the certificate hasn't expired in repo
**Settings → Pages**.

### Undo a bad change
Every version is kept. On GitHub, open the file, click **History**, pick the
version before the problem, and restore it. Nothing is ever permanently lost.

---

## Accounts and access

| Thing | Where | Notes |
|---|---|---|
| GitHub | `SRSmithnation` | owns the code and hosting |
| Cloudflare | DNS for tricountyslopitch.ca | renew the domain yearly |
| Google | spreadsheet, form, Apps Script, Analytics | same account throughout |
| Play Slo-Pitch | playslopitch.com | league and player registration |

**Renewals to diarise:** the `.ca` domain renews yearly at Cloudflare. If it
lapses, the site goes offline even though the files are fine.

---

## Where things live in the repo

```
index.html, schedule.html, ...   the pages
css/site.css                     all styling
js/site.js                       shared logic: data loading, menu, standings
data/config.json                 links to the sheets and forms
data/seasons/                    one file per season — the real data
data/source/                     original exports, kept for reference
img/logo/                        the two images the site uses
img/logo/source/                 originals and unused variants
reference/                       archived old site, unused components
```

`src/data/seasons/*.json` is the important one. Everything else is presentation.

---

## Things deliberately not done

- **No login system.** Static sites can't do it. Access is controlled by who can
  edit the Google Sheet.
- **No online payments.** Fees are paid by e-transfer.
- **No IP tracking.** Analytics gives browser, OS and city, never IP addresses.
