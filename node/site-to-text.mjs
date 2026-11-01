// A website's pages as one clean text file for an LLM: read the start page's
// same-site links, keep the ones whose clickable words match a pattern, read
// those pages as text, and drop the sentences that repeat on every page
// (banners, footers). Writes site.txt.
//
//   APIFY_TOKEN=... node site-to-text.mjs https://www.nps.gov/yose/index.htm "fees|permits"
import { ApifyClient } from 'apify-client';
import { writeFileSync } from 'node:fs';

const [start, pattern = '.', max = '20'] = process.argv.slice(2);
if (!start) throw new Error('Give a start page, and optionally an anchor-text pattern and a page limit');
const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
const actor = client.actor('simple.actor/page-text-reader');
const read = async (input) => {
    const run = await actor.call(input);
    return (await client.dataset(run.defaultDatasetId).listItems()).items;
};

// 1. Discover: every same-site link on the start page, with the words that were clickable.
const [home] = await read({ urls: [start], mode: 'discover' });
if (!home || !('text' in home)) throw new Error(`start page not read: ${home?.errorDescription}`);
const re = new RegExp(pattern, 'i');
const wanted = [...new Set(home.links
    .filter((l) => re.test(l.anchor) && !/\.(jpe?g|png|gif|pdf)$/i.test(l.url))
    .map((l) => l.url))].slice(0, Number(max));
console.log(`${home.links.length} links on the start page, ${wanted.length} match /${pattern}/`);

// 2. Read the pages you picked. A row with no `text` key was never read; it is not an empty page.
const rows = await read({ urls: wanted, mode: 'text' });
for (const r of rows.filter((x) => !('text' in x))) console.error(`not read: ${r.url} (${r.error})`);
const pages = rows.filter((x) => 'text' in x && x.statusCode === 200);

// 3. A sentence that is on every page is the site's furniture, not the page.
const split = (t) => t.split(/(?<=[.!?])\s+/).filter(Boolean);
const count = new Map();
for (const p of pages) for (const s of new Set(split(p.text))) count.set(s, (count.get(s) || 0) + 1);
const furniture = new Set(pages.length > 2 ? [...count].filter(([, n]) => n === pages.length).map(([s]) => s) : []);

let out = '';
for (const p of pages) {
    const text = split(p.text).filter((s) => !furniture.has(s)).join(' ');
    out += `# ${p.title}\n${p.loadedUrl}\n\n${text}\n\n`;
    console.log(`${String(p.textLength).padStart(6)} -> ${String(text.length).padStart(6)} chars  ${p.title}`);
}
writeFileSync('site.txt', out);
console.log(`${pages.length} pages, ${furniture.size} repeated sentences dropped, ${out.length} chars in site.txt`);
