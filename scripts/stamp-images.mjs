#!/usr/bin/env node
/**
 * Put a hash of each screenshot in its URL in the pages, such as tutorial/step9-3.png?v=7573d0a2,
 * so that browsers load a new screenshot instead of the cached one.
 * Run: npm run tutorial:shots (after the screenshots are taken)
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const PAGES = ['tutorial.html', 'index.html'];

PAGES.forEach(page => {
    const file = path.resolve(process.cwd(), page);
    const html = fs.readFileSync(file, 'utf8');
    let count = 0;
    const stamped = html.replace(/(["'])(tutorial\/[\w-]+\.png)(?:\?v=[0-9a-f]+)?\1/g, (match, quote, image) => {
        const data = fs.readFileSync(path.resolve(process.cwd(), image));
        const hash = crypto.createHash('md5').update(data).digest('hex').slice(0, 8);
        count += 1;
        return `${quote}${image}?v=${hash}${quote}`;
    });
    fs.writeFileSync(file, stamped);
    console.log(`stamped ${count} image URLs in ${page}`);
});
