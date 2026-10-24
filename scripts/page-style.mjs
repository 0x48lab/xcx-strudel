/**
 * Style and images of the generated pages (the block dictionary and the rhythm book): the style of
 * tutorial.html and the style of the entries, so that all the pages look the same.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/** Style of the entries: the index, the headings, the badges and the history. */
const BOOK_STYLE = `
/* dictionary */
.toc { display: flex; flex-wrap: wrap; gap: 6px 10px; padding: 0; list-style: none; }
.toc a { display: inline-block; padding: 2px 8px; border: 1px solid var(--border); border-radius: 999px; text-decoration: none; color: inherit; font-family: ui-monospace, Menlo, monospace; font-size: 14px; }
.toc a:hover { border-color: var(--accent); }
.entry { border-top: 1px solid var(--border); padding-top: 12px; margin-top: 18px; scroll-margin-top: 12px; }
.entry h3 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; margin: 0 0 6px; font-family: ui-monospace, Menlo, monospace; overflow-wrap: anywhere; }
.badge { font-family: system-ui, sans-serif; font-size: 12px; font-weight: bold; padding: 1px 8px; border-radius: 999px; color: #fff; background: var(--accent-dark); }
.badge.l2 { background: #c77c00; }
.badge.l3 { background: var(--purple); }
.blockline { color: var(--muted); font-size: 14px; margin: 0 0 6px; overflow-wrap: anywhere; }
.history { margin: 8px 0 0; padding: 8px 12px; border-left: 4px solid var(--purple); background: var(--code-bg); border-radius: 0 8px 8px 0; font-size: 15px; }
.history::before { content: attr(data-label); display: block; font-weight: bold; font-size: 13px; color: var(--purple); }
.entry pre { margin: 6px 0 0; }
main a { color: var(--accent); }
`;

/**
 * @returns {string} - CSS of tutorial.html and the entries
 */
export const bookStyle = () => {
    const tutorial = fs.readFileSync(path.resolve(process.cwd(), 'tutorial.html'), 'utf8');
    return tutorial.match(/<style>([\s\S]*?)<\/style>/)[1] + BOOK_STYLE;
};

/**
 * @param {string} file - PNG file of a screenshot, taken at twice the size
 * @returns {{width: number, height: number, hash: string}} - size in CSS pixels and a hash for the URL
 */
export const imageOf = file => {
    const data = fs.readFileSync(file);
    return {
        width: Math.round(data.readUInt32BE(16) / 2),
        height: Math.round(data.readUInt32BE(20) / 2),
        hash: crypto.createHash('md5').update(data).digest('hex').slice(0, 8)
    };
};
