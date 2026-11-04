# Job board

Source for the unlisted (noindex) job dashboard served at `/jobs/`.
`.github/workflows/refresh-jobs.yml` rebuilds it daily and updates only `jobs/` on the `gh-pages` branch.

Manual refresh from this folder: `python3 fetch_jobs.py && python3 build.py --standalone`, then copy `index.html` to `public/jobs/index.html`.
Edit `companies.csv` for the company list; ATS board slugs are in `fetch_jobs.py`.
`public/jobs/index.html` is a starting snapshot so `npm run deploy` (which replaces gh-pages) keeps the page until the next refresh.
