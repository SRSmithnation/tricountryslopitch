# Notices tab

Add a tab called **Notices** to the league spreadsheet, publish it to the web as
CSV, and put the published URL into `src/data/config.json` as `notices_csv`.

| Column | What it does |
|---|---|
| `Message` | the text shown in the banner. Required |
| `Level` | `alert` for red (rainouts, cancellations), `info` for cream |
| `Link` | optional. Adds a "More" link after the message |
| `Expires` | optional `YYYY-MM-DD`. The banner stops showing after this date |
| `Active` | `yes` or `no`. Leave blank to treat as yes |

Example:

| Message | Level | Link | Expires | Active |
|---|---|---|---|---|
| All games cancelled today, June 15, due to rain. Watch for a rescheduled date | alert | | 2027-06-16 | yes |
| Season starts Sunday May 30. First pitch 10am | info | schedule.html | 2027-05-31 | yes |

Only the first active notice is shown, so put the most important one at the top.

A visitor who dismisses a notice does not see it again until they reopen their
browser. Changing the wording makes it reappear.

Set `Active` to `no` rather than deleting the row, so you can reuse it.
