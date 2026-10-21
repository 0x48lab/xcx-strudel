#!/usr/bin/env node
/**
 * Make projects/demo.sb3, a demo project which uses only blocks of the beginner level.
 * Run: npm run demo
 */
import path from 'path';
import {Blocks, inOrder, writeProject} from './sb3-builder.mjs';

const OUTPUT = path.resolve(process.cwd(), 'projects/demo.sb3');

const cat = new Blocks();

// green flag: tempo, drums, hi-hats, melody, piano roll
const flag = cat.block('event_whenflagclicked', {top: [24, 24]});
const tempo = cat.block('strudel_setBpm');
cat.number(tempo, 'BPM', 110);

const drums = cat.block('strudel_playTrack');
cat.menu(drums, 'PATTERN', 'sound', 'bd');
cat.put(drums, 'PATTERN', inOrder(cat, ['bd', '~', 'sd', '~']));
cat.text(drums, 'TRACK', 'drums');

const hats = cat.block('strudel_playTrack');
cat.menu(hats, 'PATTERN', 'sound', 'hh');
const repeatHats = cat.block('strudel_repeat');
cat.menu(repeatHats, 'PATTERN', 'sound', 'hh');
cat.number(repeatHats, 'TIMES', 8);
cat.put(hats, 'PATTERN', repeatHats);
cat.text(hats, 'TRACK', 'hats');

const melody = cat.block('strudel_playTrack');
cat.menu(melody, 'PATTERN', 'sound', 'c4');
const tone = cat.block('strudel_tone');
cat.menu(tone, 'PATTERN', 'sound', 'c4');
cat.menu(tone, 'SYNTH', 'synth', 'triangle');
const turns = cat.block('strudel_alternate');
cat.menu(turns, 'A', 'sound', 'c4');
cat.menu(turns, 'B', 'sound', 'g4');
cat.put(turns, 'A', inOrder(cat, ['c4', 'e4', 'g4', 'c5']));
cat.put(turns, 'B', inOrder(cat, ['a4', 'g4', 'e4', 'd4']));
cat.put(tone, 'PATTERN', turns);
cat.put(melody, 'PATTERN', tone);
cat.text(melody, 'TRACK', 'melody');

const showRoll = cat.block('strudel_showViz', {fields: {VIZ: ['pianoroll', null]}});
cat.stack([flag, tempo, drums, hats, melody, showRoll]);
cat.comment(flag, 'みどりの はたを おすと、ドラムと メロディが なるよ。\n' +
    '「じゅんばんに」の ▼ で おとを かえてみよう。', 760, 24);

// dance on every beat
const beat = cat.block('strudel_whenBeat', {top: [24, 560]});
const nextCostume = cat.block('looks_nextcostume');
cat.stack([beat, nextCostume]);
cat.comment(beat, 'はくが くるたびに コスチュームを かえて おどるよ。', 360, 560);

// jump on the bass drum
const kick = cat.block('strudel_whenSound', {top: [24, 700], fields: {DRUM: ['bd', null]}});
const big = cat.block('looks_setsizeto');
cat.number(big, 'SIZE', 120);
const wait = cat.block('control_wait');
cat.blocks[wait].inputs.DURATION = [1, cat.shadow(wait, 'math_positive_number', 'NUM', 0.1)];
const normal = cat.block('looks_setsizeto');
cat.number(normal, 'SIZE', 100);
cat.stack([kick, big, wait, normal]);
cat.comment(kick, 'バスドラムが なると すこし おおきくなるよ。', 360, 700);

await writeProject(cat, OUTPUT, 'xcx-strudel make-demo');
console.log(`made ${path.relative(process.cwd(), OUTPUT)}`);
