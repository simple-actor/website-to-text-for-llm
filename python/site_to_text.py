"""A website's pages as one clean text file for an LLM: read the start page's
same-site links, keep the ones whose clickable words match a pattern, read
those pages as text, and drop the sentences that repeat on every page
(banners, footers). Writes site.txt.

    APIFY_TOKEN=... python site_to_text.py https://www.nps.gov/yose/index.htm "fees|permits"
"""
import os
import re
import sys
from collections import Counter

from apify_client import ApifyClient

if len(sys.argv) < 2:
    sys.exit("Give a start page, and optionally an anchor-text pattern and a page limit")
start = sys.argv[1]
pattern = sys.argv[2] if len(sys.argv) > 2 else "."
limit = int(sys.argv[3]) if len(sys.argv) > 3 else 20
client = ApifyClient(os.environ["APIFY_TOKEN"])
actor = client.actor("simple.actor/page-text-reader")


def read(run_input):
    run = actor.call(run_input=run_input)
    return list(client.dataset(run.default_dataset_id).iterate_items())


# 1. Discover: every same-site link on the start page, with the words that were clickable.
home = (read({"urls": [start], "mode": "discover"}) or [{}])[0]
if "text" not in home:
    sys.exit(f"start page not read: {home.get('errorDescription')}")
wanted = []
for link in home["links"]:
    if (re.search(pattern, link["anchor"], re.I) and not re.search(r"\.(jpe?g|png|gif|pdf)$", link["url"], re.I)
            and link["url"] not in wanted):
        wanted.append(link["url"])
wanted = wanted[:limit]
print(f"{len(home['links'])} links on the start page, {len(wanted)} match /{pattern}/")

# 2. Read the pages you picked. A row with no "text" key was never read; it is not an empty page.
rows = read({"urls": wanted, "mode": "text"})
for r in rows:
    if "text" not in r:
        print(f"not read: {r['url']} ({r.get('error')})", file=sys.stderr)
pages = [r for r in rows if "text" in r and r["statusCode"] == 200]

# 3. A sentence that is on every page is the site's furniture, not the page.
split = lambda t: [s for s in re.split(r"(?<=[.!?])\s+", t) if s]
count = Counter(s for p in pages for s in set(split(p["text"])))
furniture = {s for s, n in count.items() if n == len(pages)} if len(pages) > 2 else set()

out = ""
for p in pages:
    text = " ".join(s for s in split(p["text"]) if s not in furniture)
    out += f"# {p['title']}\n{p['loadedUrl']}\n\n{text}\n\n"
    print(f"{p['textLength']:>6} -> {len(text):>6} chars  {p['title']}")
with open("site.txt", "w") as f:
    f.write(out)
print(f"{len(pages)} pages, {len(furniture)} repeated sentences dropped, {len(out)} chars in site.txt")
