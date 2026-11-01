# Runs behind the post

All on 2026-11-01 (UTC), page-text-reader build 0.1.5 (latest), from the
account `simple.actor` (the owner's), so nothing was billed. The caller price is
the listing's $0.002 per `page-read` and $0.00005 per `apify-actor-start` (one
event at the default 1024MB), read the same day. Platform usage was read back
from the API after the runs had settled.

| Run | Input | Result | Time | Platform usage | Caller price |
|---|---|---|---|---|---|
| `hHMHWuF7syxQ3WbIX` | `https://www.nps.gov/yose/index.htm`, discover, `includeHtml` | 1 row, 2,342 chars of text, 90,287 of HTML, 50 links | 26.8s | $0.00156 | $0.00205 |
| `mzFxzjkgPKoWhLUQq` | 15 visitor pages picked by anchor text, text mode, `includeHtml` | 15 rows, all 200, none rendered; 842,006 chars of HTML, 78,433 of text | 11.9s | $0.00082 | $0.03005 |
| `zRY4qgQYleqc2MRRI`, `kAhAztfh5DQFa6TgS` | `example/node/site-to-text.mjs` with `"fees|permits"` | 50 links, 3 pages, 17 repeated sentences dropped, 19,138 chars | 3.2s + 1.2s | $0.00038 | $0.0082 |
| `85GhMcdtHKcHoRkqi`, `ZlxdddarAeUthN8wU` | `example/python/site_to_text.py` with `"camping|lodging|pets"` | 50 links, 3 pages, 17 repeated sentences dropped, 14,153 chars | 1.6s + 2.9s | $0.00021 | $0.0082 |

Regenerate the numbers and images: `python3 analyse.py`, then
`python3 images/make.py`. Both read the run files that
`marketing/tools/apify_api.py run` wrote to /tmp.
