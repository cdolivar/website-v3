# Job board

Source for the unlisted (noindex) job dashboard served at `/jobs/`.
`.github/workflows/refresh-jobs.yml` rebuilds it daily and updates only `jobs/` on the `gh-pages` branch.

Manual refresh from this folder: `python3 fetch_jobs.py && python3 build.py --standalone`, then copy `index.html` to `public/jobs/index.html`.
Edit `companies.csv` for company details and `feeds.json` for the job-feed registry (Greenhouse, Ashby or Lever slug per company).
`public/jobs/index.html` is a starting snapshot so `npm run deploy` (which replaces gh-pages) keeps the page until the next refresh.

## Finding more companies

`discover.py` looks for each company's Greenhouse, Ashby or Lever job board: it scans the careers page and homepage for embedded board links, then tries likely board names and keeps a guess only if the board's own text mentions the company.

```
python3 discover.py rows.json discovered.json
```

`rows.json` is a list of `{"title","file","website","careers_url"}` objects. Two sources used so far:
- Y Combinator hiring list: `https://yc-oss.github.io/api/companies/hiring.json` (`name` -> `title`, `slug` -> `file`, `website`).
- remoteintech/remote-jobs (ISC licensed): `src/companies/*.md` front matter (`title`, `slug`, `website`, `careers_url`).

Add the results to `feeds.json` and `companies.csv` (the `Size` column holds tiny, small, medium, large or enterprise).

## Supported job-board systems

`fetch_jobs.py` reads Greenhouse, Ashby, Lever, Workable, Gem, Recruitee, Breezy, SmartRecruiters and BambooHR (`ats` in `feeds.json`: `gh`, `ashby`, `lever`, `workable`, `gem`, `recruitee`, `breezy`, `smartrecruiters`, `bamboohr`). Workday, iCIMS, Taleo, SuccessFactors and custom careers sites are not supported. `discover.py` only finds Greenhouse, Ashby and Lever boards; other systems were added by scanning careers pages for their board names.
