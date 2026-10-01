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

### Add or rename a team

Edit the **Teams** tab of the spreadsheet: `#`, `Team`, `Division`.
The number controls the order shown on the site.

*(This works once the Teams tab is published to the web. If team changes are not
appearing, the tab is not published, see "Publishing a sheet tab" below.)*

### Add next season's schedule

1. Open `data/seasons/2026.json` to see the shape.
2. Copy it to `data/seasons/2027.json`, replace the games.
3. Add `2027` to `data/seasons.json`.
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

## Publishing a sheet tab

The site can only read tabs that are **published to the web**.

1. In the spreadsheet: **File → Share → Publish to web**
2. Pick the tab, choose **CSV**, click **Publish**
3. Copy the URL and put it in `data/config.json`

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

`data/seasons/*.json` is the important one. Everything else is presentation.

---

## Things deliberately not done

- **No login system.** Static sites can't do it. Access is controlled by who can
  edit the Google Sheet.
- **No online payments.** Fees are paid by e-transfer.
- **No IP tracking.** Analytics gives browser, OS and city, never IP addresses.
