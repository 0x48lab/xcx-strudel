#!/usr/bin/env node
/**
 * Make projects/dictionary.sb3 (and projects/en/dictionary.sb3 with --en):
 * the example of each entry of the dictionary, one script under another in the order of the page.
 * scripts/shoot-dictionary.mjs takes their screenshots.
 * Run: npm run dictionary
 */
import path from 'path';
import {Blocks, LANG, fromSteps, strudelBlocks, writeProject} from './sb3-builder.mjs';
import {EXAMPLE_TRACK, SECTIONS} from './dictionary-book.mjs';

/**
 * Blocks of the example of an entry.
 * @param {Blocks} b - builder
 * @param {object} $ - blocks of the extension
 * @param {object} entry - entry of the dictionary
 * @returns {Array<string>} - block IDs of the script from the top
 */
export const exampleOf = (b, $, entry) => (entry.track ?
    [$.track(EXAMPLE_TRACK, fromSteps($, entry.track))] :
    entry.script(b, $));

const b = new Blocks();
const $ = strudelBlocks(b);
let y = 24;
SECTIONS.flatMap(section => section.entries).forEach(entry => {
    const ids = exampleOf(b, $, entry);
    const top = b.blocks[ids[0]];
    top.topLevel = true;
    top.x = 24;
    top.y = y;
    if (ids.length > 1) b.stack(ids);
    // the layout of writeProject moves the scripts down so that they do not overlap
    y += 10;
});
await writeProject(b, path.resolve(process.cwd(), 'projects/dictionary.sb3'), 'xcx-strudel make-dictionary');
console.log(`made projects/${LANG === 'en' ? 'en/' : ''}dictionary.sb3`);
