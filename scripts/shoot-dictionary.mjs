#!/usr/bin/env node
/**
 * Take the screenshot of the example of each entry of the block dictionary, from projects/dictionary.sb3
 * (projects/en/dictionary.sb3 with --en), into dictionary/ (dictionary/en/).
 * Run: npm run dictionary && npm run dictionary:shots
 */
import path from 'path';
import {SECTIONS} from './dictionary-book.mjs';
import {Blocks, strudelBlocks} from './sb3-builder.mjs';
import {shootScripts} from './shoot-scripts.mjs';

const en = process.argv.includes('--en');
const shots = SECTIONS.flatMap(section => section.entries).map(entry => {
    if (entry.track) return {id: entry.id, opcode: 'strudel_track'};
    const b = new Blocks();
    return {id: entry.id, opcode: b.blocks[entry.script(b, strudelBlocks(b))[0]].opcode};
});
await shootScripts({
    project: path.resolve(process.cwd(), en ? 'projects/en/dictionary.sb3' : 'projects/dictionary.sb3'),
    out: path.resolve(process.cwd(), en ? 'dictionary/en' : 'dictionary'),
    shots,
    en
});
