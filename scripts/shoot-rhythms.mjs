#!/usr/bin/env node
/**
 * Take the screenshot of the track of each rhythm and technique of the rhythm book, into rhythms/ (rhythms/en/ with --en).
 * The tracks are put in a project in a temporary directory, one under another in the order of the page.
 * Run: npm run rhythms:shots && npm run rhythms
 */
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import {Blocks, fromSteps, strudelBlocks, writeProject} from './sb3-builder.mjs';
import {RHYTHMS, TECHNIQUES} from './rhythm-book.mjs';
import {shootScripts} from './shoot-scripts.mjs';

const en = process.argv.includes('--en');
const tracks = [
    ...RHYTHMS.map(r => ({id: r.id, name: 'ドラム', track: r.track})),
    ...TECHNIQUES.map(x => ({id: x.id, name: x.trackName, track: x.track}))
];

const b = new Blocks();
const $ = strudelBlocks(b);
tracks.forEach(({name, track}, i) => {
    const id = $.track(name, fromSteps($, track));
    Object.assign(b.blocks[id], {topLevel: true, x: 24, y: 24 + (i * 10)});
});
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xcx-strudel-'));
// writeProject puts an English project in en/ next to the path
await writeProject(b, path.join(dir, 'rhythms.sb3'), 'xcx-strudel shoot-rhythms');
await shootScripts({
    project: path.join(dir, en ? 'en/rhythms.sb3' : 'rhythms.sb3'),
    out: path.resolve(process.cwd(), en ? 'rhythms/en' : 'rhythms'),
    shots: tracks.map(({id}) => ({id, opcode: 'strudel_track'})),
    en
});
fs.removeSync(dir);
