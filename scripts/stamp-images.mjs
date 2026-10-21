#!/usr/bin/env node
/**
 * Put a hash of each screenshot in its URL in tutorial.html, such as tutorial/step9-3.png?v=7573d0a2,
 * so that browsers load a new screenshot instead of the cached one.
 * Run: npm run tutorial:shots (after the screenshots are taken)
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const PAGE = path.resolve(process.cwd(), 'tutorial.html');

const html = fs.readFileSync(PAGE, 'utf8');
let count = 0;
const stamped = html.replace(/(["'])(tutorial\/[\w-]+\.png)(?:\?v=[0-9a-f]+)?\1/g, (match, quote, file) => {
    const data = fs.readFileSync(path.resolve(process.cwd(), file));
    const hash = crypto.createHash('md5').update(data).digest('hex').slice(0, 8);
    count += 1;
    return `${quote}${file}?v=${hash}${quote}`;
});
fs.writeFileSync(PAGE, stamped);
console.log(`stamped ${count} image URLs in tutorial.html`);
