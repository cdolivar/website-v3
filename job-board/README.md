# Job board

A small, dependency-free Python pipeline that pulls open roles from public applicant-tracking-system (ATS) APIs and turns them into a filterable dashboard. It scores each role against a profile you control. The page is served unlisted (`noindex`) at `/jobs/`.

```
feeds.json ──► fetch_jobs.py ──► jobs.json ──► build.py (+ template.html, companies.csv) ──► index.html
```

## How it works

1. **`fetch_jobs.py`** fetches roles concurrently from each company's public job feed. It normalizes them into one schema and extracts salary bands from structured fields or posting text. It also infers remote and US eligibility (with extra rules for hybrid, on-site and boilerplate wording) and computes a 0–100 match score. It collapses duplicate per-location postings, drops anything older than 60 days, and refuses to write output if fewer than 500 jobs come back, so one broken feed can't overwrite a good page.
2. **`build.py`** joins the jobs with company metadata from `companies.csv` and inlines everything into `template.html`, producing a single static file.
3. **`.github/workflows/refresh-jobs.yml`** runs both steps on a schedule (four times each weekday) and publishes only `jobs/` on the `gh-pages` branch.

Supported ATS systems (`ats` in `feeds.json`): Greenhouse (`gh`), Ashby, Lever, Workable, Gem, Recruitee, Breezy, SmartRecruiters and BambooHR. Workday, iCIMS, Taleo, SuccessFactors and custom careers sites aren't supported.

## Make it yours

Match scoring is driven by [`profile.json`](profile.json), not code: title fit, seniority, keywords to reward or penalize, and skill gaps to flag. Each rule is a `[regex, points]` pair. Edit it to describe your background, and list the companies you care about in `feeds.json` and `companies.csv` (the `Size` column holds tiny, small, medium, large or enterprise).

## Run it locally

```bash
cd job-board
python3 fetch_jobs.py          # writes jobs.json
python3 build.py --standalone  # writes index.html
```

The generated `jobs.json` and `index.html` are git-ignored. `public/jobs/index.html` is a committed starting snapshot, so `npm run deploy` (which replaces `gh-pages`) keeps the page until the next scheduled refresh.

## Finding more companies

`discover.py` looks for each company's Greenhouse, Ashby or Lever board. It scans the careers page and homepage for embedded board links, then tries likely board names and keeps a guess only if the board's own text mentions the company.

```bash
python3 discover.py rows.json discovered.json
```

`rows.json` is a list of `{"title","file","website","careers_url"}` objects. Two sources used so far:

- Y Combinator hiring list: `https://yc-oss.github.io/api/companies/hiring.json` (`name` → `title`, `slug` → `file`, `website`).
- [remoteintech/remote-jobs](https://github.com/remoteintech/remote-jobs) (ISC licensed): `src/companies/*.md` front matter (`title`, `slug`, `website`, `careers_url`).
