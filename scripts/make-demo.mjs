#!/usr/bin/env node
/**
 * Make projects/demo.sb3, a demo project which uses only blocks of the beginner level.
 * Run: npm run demo
 */
import path from 'path';
import {Blocks, strudelBlocks, writeProject} from './sb3-builder.mjs';

const OUTPUT = path.resolve(process.cwd(), 'projects/demo.sb3');

const cat = new Blocks();
const $ = strudelBlocks(cat);

// green flag: tempo, drums, hi-hats, melody, piano roll
const flag = cat.block('event_whenflagclicked', {top: [24, 24]});
const tempo = cat.block('strudel_setBpm');
cat.number(tempo, 'BPM', 110);

const drums = $.track('drums', [$.seq('bd', '~', 'sd', '~')]);
const hats = $.track('hats', [$.sMenu('hh'), $.fast(8)]);
const melody = $.track('melody', [$.seq('c4', 'e4', 'g4', 'c5'), $.sMenu('triangle')]);

const showRoll = cat.block('strudel_showViz', {fields: {VIZ: ['pianoroll', null]}});
cat.stack([flag, tempo, drums, hats, melody, showRoll]);
cat.comment(flag, 'みどりの はたを おすと、ドラムと メロディが なるよ。\n' +
    '「seq」の ▼ で おとを かえてみよう。', 760, 24);

// dance on every beat
const beat = cat.block('strudel_whenBeat', {top: [24, 620]});
const nextCostume = cat.block('looks_nextcostume');
cat.stack([beat, nextCostume]);
cat.comment(beat, 'はくが くるたびに コスチュームを かえて おどるよ。', 360, 620);

// jump on the bass drum
const kick = cat.block('strudel_whenSound', {top: [24, 760], fields: {DRUM: ['bd', null]}});
const big = cat.block('looks_setsizeto');
cat.number(big, 'SIZE', 120);
const wait = cat.block('control_wait');
cat.blocks[wait].inputs.DURATION = [1, cat.shadow(wait, 'math_positive_number', 'NUM', 0.1)];
const normal = cat.block('looks_setsizeto');
cat.number(normal, 'SIZE', 100);
cat.stack([kick, big, wait, normal]);
cat.comment(kick, 'バスドラムが なると すこし おおきくなるよ。', 360, 760);

await writeProject(cat, OUTPUT, 'xcx-strudel make-demo');
console.log(`made ${path.relative(process.cwd(), OUTPUT)}`);
