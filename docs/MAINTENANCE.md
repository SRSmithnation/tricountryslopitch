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
