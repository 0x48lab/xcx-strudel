#!/usr/bin/env node
/**
 * Make the projects of the tutorial: projects/tutorial/step1.sb3 ... step13.sb3.
 * Each step is a small project which tutorial.html shows and links to.
 * Run: npm run tutorial
 */
import path from 'path';
import {Blocks, strudelBlocks, writeProject} from './sb3-builder.mjs';
import {PIANO_RHYTHM, SOUL} from './soul-song.mjs';

const out = name => path.resolve(process.cwd(), `projects/tutorial/${name}.sb3`);

const flagAt = (b, y) => b.block('event_whenflagclicked', {top: [24, y]});
const tempo = (b, bpm) => b.strudel('setBpm', {BPM: ['number', bpm]});
const level = (b, value) => b.strudel('setLevel', {}, {LEVEL: value});
const drums = $ => $.track('ドラム', [$.seq('bd', '~', 'sd', '~')]);
const hats = $ => $.track('ハイハット', [$.sMenu('hh'), $.fast(8)]);
const melody = $ => $.track('メロディ', [$.seq('c4', 'e4', 'g4', 'c5'), $.sMenu('triangle')]);

/**
 * A hat block of the extension placed at the top level.
 * @param {Blocks} b - builder
 * @param {string} opcode - opcode without the extension ID
 * @param {object} fields - fields of the block
 * @param {Array<number>} top - position
 * @returns {string} - block ID
 */
const hat = (b, opcode, fields, top) => {
    const id = b.strudel(opcode, {}, fields);
    b.blocks[id].topLevel = true;
    b.blocks[id].x = top[0];
    b.blocks[id].y = top[1];
    return id;
};

/**
 * Hat blocks of keys with blocks under them, one under another.
 * @param {Blocks} b - builder
 * @param {Array} parts - [key, blocks]
 * @param {number} top - y of the first hat block
 */
const onKeys = (b, parts, top) => {
    let y = top;
    parts.forEach(([key, blocks]) => {
        b.stack([b.whenKey(key, [24, y]), ...blocks]);
        // a C block is taller with the blocks in it
        const height = blocks.reduce((sum, id) => sum + (b.blocks[id].opcode === 'strudel_track' ?
            70 + (40 * countBranch(b, id)) : 50), 0);
        y += height + 70;
    });
};

/**
 * @param {Blocks} b - builder
 * @param {string} id - block ID of a C block
 * @returns {number} - number of blocks in the branch
 */
const countBranch = (b, id) => {
    let count = 0;
    let next = b.blocks[id].inputs.SUBSTACK && b.blocks[id].inputs.SUBSTACK[1];
    while (next) {
        count++;
        next = b.blocks[next].next;
    }
    return count;
};

const STEPS = {
    // 1. one sound
    step1: b => {
        const $ = strudelBlocks(b);
        b.stack([flagAt(b, 24), $.track('1', [$.sMenu('bd')])]);
    },
    // 2. sounds in order
    step2: b => {
        const $ = strudelBlocks(b);
        b.stack([flagAt(b, 24), tempo(b, 110), drums($)]);
    },
    // 3. layers of tracks
    step3: b => {
        const $ = strudelBlocks(b);
        b.stack([flagAt(b, 24), tempo(b, 110), drums($), hats($)]);
    },
    // 4. melody
    step4: b => {
        const $ = strudelBlocks(b);
        b.stack([flagAt(b, 24), tempo(b, 110), drums($), hats($), melody($)]);
    },
    // 5. change and stop by keys
    step5: b => {
        const $ = strudelBlocks(b);
        b.stack([flagAt(b, 24), tempo(b, 110), drums($), hats($)]);
        onKeys(b, [
            ['space', [$.track('ドラム', [$.seq('bd', 'bd', 'sd', 'cp')])]],
            ['s', [b.strudel('stopTrack', {TRACK: ['text', 'ハイハット']})]],
            ['0', [b.strudel('stopAll')]]
        ], 360);
    },
    // 6. pictures of sound
    step6: b => {
        const $ = strudelBlocks(b);
        b.stack([flagAt(b, 24), tempo(b, 110), drums($), hats($), melody($),
            b.strudel('showViz', {}, {VIZ: 'pianoroll'})]);
        onKeys(b, [
            ['1', [b.strudel('showViz', {}, {VIZ: 'scope'})]],
            ['2', [b.strudel('showViz', {}, {VIZ: 'spectrum'})]],
            ['3', [b.strudel('hideViz')]]
        ], 520);
    },
    // 7. a dancing sprite
    step7: b => {
        const $ = strudelBlocks(b);
        b.stack([flagAt(b, 24), tempo(b, 110), drums($), hats($)]);
        b.stack([hat(b, 'whenBeat', {}, [24, 360]), b.block('looks_nextcostume')]);
        const big = b.block('looks_setsizeto');
        b.number(big, 'SIZE', 120);
        const wait = b.block('control_wait');
        b.blocks[wait].inputs.DURATION = [1, b.shadow(wait, 'math_positive_number', 'NUM', 0.1)];
        const normal = b.block('looks_setsizeto');
        b.number(normal, 'SIZE', 100);
        b.stack([hat(b, 'whenSound', {DRUM: 'bd'}, [24, 500]), big, wait, normal]);
    },
    // 8. standard level: mini-notation, effects and scales
    step8: b => {
        const $ = strudelBlocks(b);
        const beat = $.track('ドラム', [$.s('bd*2 [~ sd] <hh oh> sd')]);
        const bass = $.track('ベース', [$.note('<c2 a1 f1 g1>*2'), $.s('sawtooth'), $.effect('lpf', '600')]);
        const tune = $.track('メロディ', [$.n('0 2 4 <5 7>'), $.scale('C4', 'major:pentatonic'), $.s('piano')]);
        b.stack([flagAt(b, 24), level(b, '2'), tempo(b, 100), beat, bass, tune]);
    },
    // 9. standard level: write a song in lists, and play chords on a rhythm
    step9: b => {
        const $ = strudelBlocks(b);
        const listNotes = name => $.note($.listMini(name));
        const chords = b.list('コード', ['[f3,a3,c4]', '[g3,b3,d4]', '[e3,g3,b3]', '[a3,c4,e4]']);
        const bass = b.list('ベース', ['f2 [~ f2] f2 [~ f2]', 'g2 [~ g2] g2 [~ g2]', 'e2 [~ e2] e2 [~ e2]', 'a2 [~ a2] a2 [~ a2]']);
        const tune = b.list('メロディ', ['[c5 d5] [e5 ~] [d5 c5] [a4 ~]', '[b4 c5] [d5 ~] [g4 ~] ~', '[e5 d5] [b4 ~] [g4 b4] [d5 ~]', '[c5 ~] [b4 a4] a4 ~']);
        const rhythm = b.list('リズム', ['x ~', '~ x', 'x x', '~ x']);
        const beat = b.list('ドラム', ['bd [~ bd] ~ ~', '~ ~ sd ~', 'hh*8']);
        b.listMonitor(chords, [5, 5, 200, 150]);
        const flag = flagAt(b, 24);
        b.stack([flag, level(b, '2'), tempo(b, 100),
            b.say('1 で 和音、2 で リズムを つけて、3〜5 で パートを ふやそう。0 で とめる', 8)]);
        b.comment(flag, '和音・ベース・メロディは「変数」の リストに 1小節ずつ 入っているよ。\n' +
            'ステージの リストを クリックすると、和音を 書きかえられるよ。', 900, 24);
        onKeys(b, [
            ['1', [$.track('ピアノ', [listNotes(chords), $.s('piano')])]],
            ['2', [$.track('ピアノ', [listNotes(chords), $.struct($.listMini(rhythm, 'seq')), $.s('piano')])]],
            ['3', [$.track('ベース', [listNotes(bass), $.s('sawtooth'), $.effect('lpf', '400')])]],
            ['4', [$.track('メロディ', [listNotes(tune), $.s('triangle'), $.effect('room', '.3')])]],
            ['5', [$.track('ドラム', [$.s($.listMini(beat, 'stack'))])]],
            ['0', [b.strudel('stopAll')]]
        ], 260);
    },
    // 10. standard level: a recorded voice as an instrument
    step10: b => {
        const $ = strudelBlocks(b);
        const voice = () => $.spriteSound('Meow');
        const flag = flagAt(b, 24);
        b.stack([flag, level(b, '2'), tempo(b, 100),
            b.say('「音」タブで 声を 録音して、▼ で えらんでね。1〜4 キーで ためそう、0 で とめる', 8)]);
        b.comment(flag, 'さいしょは ねこの「Meow」が 入っているよ。\n' +
            '「音」タブで 録音した 声を、「スプライトの音」の ▼ で えらぶと、じぶんの 声で 鳴るよ。', 900, 24);
        onKeys(b, [
            ['1', [$.track('こえ', [voice()])]],
            ['2', [$.track('こえ', [voice(), $.fast(4), $.effect('clip', '.5')])]],
            ['3', [$.track('こえ', [voice(), $.fast(4), $.effect('clip', '.5'), $.effect('speed', '1 1.5 2 -1')])]],
            ['4', [$.track('こえ', [voice(), $.effect('speed', '<1 .5>'), $.effect('room', '.8')])]],
            ['0', [b.strudel('stopAll')]]
        ], 260);
    },
    // 11. normal level: jazzy chords of soul and pop, in lists
    step11: b => {
        const $ = strudelBlocks(b);
        const listNotes = name => $.note($.listMini(name));
        const chords = b.list('コード', SOUL.piano);
        const rhythm = b.list('リズム', PIANO_RHYTHM);
        const bass = b.list('ベース', SOUL.bass);
        const tune = b.list('メロディ', SOUL.melody);
        const beat = b.list('ドラム', SOUL.drums);
        b.listMonitor(chords, [5, 5, 300, 220]);
        const flag = flagAt(b, 24);
        b.stack([flag, level(b, '2'), tempo(b, 92),
            b.say('1〜4 キーで パートを ふやそう。0 で とめる', 8)]);
        b.comment(flag, 'ジャズや ソウルの 和音を つかった ピアノ ポップ。\n' +
            '| FM7 | Em7 A7 | Dm7 G7 | Cmaj9 C9 |\n| FM7 | Fm6 | Em7 E♭dim7 | Dm7 G7sus4 |', 900, 24);
        onKeys(b, [
            ['1', [$.track('ピアノ', [listNotes(chords), $.struct($.listMini(rhythm, 'seq')), $.s('piano')])]],
            ['2', [$.track('ベース', [listNotes(bass), $.s('sawtooth'), $.effect('lpf', '350')])]],
            ['3', [$.track('メロディ', [listNotes(tune), $.s('triangle'), $.effect('room', '.4')])]],
            ['4', [$.track('ドラム', [$.s($.listMini(beat, 'stack')), $.bank('RolandTR808'), $.effect('gain', '.8')])]],
            ['0', [b.strudel('stopAll')]]
        ], 260);
    },
    // 12. master level: euclid, acid, trance gate and a wave
    step12: b => {
        const $ = strudelBlocks(b);
        const kick = $.track('キック', [$.s('bd'), $.euclid(5, 8), $.bank('RolandTR909')]);
        const hihats = $.track('ハイハット', [$.s('hh'), $.fast(16), $.effect('pan', $.wave('sine', 0, 1, 2))]);
        const acid = $.track('アシッド', [$.note('<a1*16 f1*16>'), $.acidenv(0.6)]);
        const pad = $.track('パッド', [$.chord('A3', 'minor'), $.s('supersaw'), $.trancegate(0.7, 3, 1)]);
        b.stack([flagAt(b, 24), level(b, '3'), tempo(b, 138), kick, hihats, acid, pad,
            b.strudel('showViz', {}, {VIZ: 'spectrum'})]);
        // the column before the advanced lessons: blocks to Strudel code
        const say = b.say('', 4);
        b.put(say, 'MESSAGE', b.strudel('strudelCode'));
        onKeys(b, [
            ['c', [say]],
            ['o', [b.strudel('openStrudel')]]
        ], 800);
    },
    // 13. advanced: sounds of EDM and trance in lists, a part on each key
    step13: b => {
        const $ = strudelBlocks(b);
        const listNotes = name => $.note($.listMini(name));
        const rising = (min, max) => $.wave('saw', min, max, 4);
        const chords = b.list('コード', ['[a3,c4,e4,a4]', '[f3,a3,c4,f4]', '[c4,e4,g4,c5]', '[g3,b3,d4,g4]']);
        const bass = b.list('ベース', ['[~ a1]*4', '[~ f1]*4', '[~ c2]*4', '[~ g1]*4']);
        const lead = b.list('リード', ['[7 ~ 9 11] [12 11 ~ 9]', '[11 ~ 9 7] [8 ~ 9 6]', '[7 ~ 9 11] [12 11 ~ 9]', '[11 ~ 9 7] [8 ~ 9 6]']);
        const build = b.list('ビルドアップ', ['sd*4', 'sd*8', 'sd*16', 'sd*32']);
        b.listMonitor(chords, [5, 5, 170, 150]);
        const flag = flagAt(b, 24);
        b.stack([flag, level(b, '3'), tempo(b, 140), b.strudel('showViz', {}, {VIZ: 'spectrum'}),
            b.say('1〜6 キーで パートを ふやそう。7 で ポンピング、1 で もとの キック。スペースで ドロップ、0 で とめる', 8)]);
        b.comment(flag, 'EDM・トランスの 音づくり。\nキーを 1つずつ おして、パートの やくわりを 耳で たしかめよう。\n' +
            '和音・ベース・リード・ビルドアップは リストに 1小節ずつ 入っているよ。', 900, 24);
        onKeys(b, [
            ['1', [$.track('キック', [$.s('bd*4'), $.bank('RolandTR909')])]],
            // the parts which the kick ducks on key 7 play on orbit 2
            ['2', [$.track('ベース', [listNotes(bass), $.s('sawtooth'), $.effect('lpf', '500'), $.effect('orbit', '2')])]],
            ['3', [$.track('パッド', [
                listNotes(chords), $.s('supersaw'), $.trancegate(0.8, 45, 1), $.effect('room', '.6'), $.effect('orbit', '2')
            ])]],
            ['4', [$.track('プラック', [
                listNotes(chords), $.arp('0 1 2 3 2 1 2 3'), $.s('square'),
                $.effect('clip', '.3'), $.effect('delay', '.4'), $.effect('orbit', '2')
            ])]],
            ['5', [$.track('リード', [
                $.n($.listMini(lead)), $.scale('A3', 'minor'), $.s('supersaw'), $.superimpose('up12'),
                $.effect('unison', '7'), $.effect('room', '.8'), $.effect('orbit', '2')
            ])]],
            ['6', [
                $.track('スネア', [$.s($.listMini(build)), $.bank('RolandTR909'), $.effect('gain', rising(0.3, 1))]),
                $.track('ライザー', [
                    $.sMenu('white'), $.fast(16), $.effect('hpf', rising(300, 9000)), $.effect('gain', rising(0, 0.4))
                ])
            ]],
            ['space', [
                b.strudel('stopTrack', {TRACK: ['text', 'スネア']}),
                b.strudel('stopTrack', {TRACK: ['text', 'ライザー']})
            ]],
            ['7', [$.track('キック', [
                $.s('bd*4'), $.bank('RolandTR909'),
                $.effect('duck', '2'), $.effect('duckattack', '.2'), $.effect('duckdepth', '.85')
            ])]],
            ['0', [b.strudel('stopAll')]]
        ], 260);
    }
};

for (const [name, make] of Object.entries(STEPS)) {
    const b = new Blocks();
    make(b);
    await writeProject(b, out(name), 'xcx-strudel make-tutorial');
}
console.log(`made ${Object.keys(STEPS).length} projects in projects/tutorial`);
