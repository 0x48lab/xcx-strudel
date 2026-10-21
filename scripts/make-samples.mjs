#!/usr/bin/env node
/**
 * Make sample projects: projects/melody.sb3 (standard level) and projects/trance.sb3 (master level).
 * Keys change the music at the next cycle, like live coding.
 * Run: npm run demo
 */
import path from 'path';
import {Blocks, writeProject} from './sb3-builder.mjs';
import {PIANO_RHYTHM, SOUL} from './soul-song.mjs';

const out = name => path.resolve(process.cwd(), `projects/${name}.sb3`);

/**
 * @param {Blocks} b - builder
 * @param {string} track - track name
 * @param {string} pattern - block ID of the pattern
 * @returns {string} - block ID of "play on track"
 */
const play = (b, track, pattern) => b.strudel('playTrack', {PATTERN: ['block', pattern], TRACK: ['text', track]});

/**
 * Hat block of a key with blocks under it.
 * @param {Blocks} b - builder
 * @param {string} key - key name
 * @param {Array<number>} top - position
 * @param {Array<string>} blocks - blocks under the hat
 */
const onKey = (b, key, top, blocks) => b.stack([b.whenKey(key, top), ...blocks]);

/**
 * Dance on every beat.
 * @param {Blocks} b - builder
 * @param {Array<number>} top - position
 */
const danceOnBeat = (b, top) => b.stack([b.strudel('whenBeat'), b.block('looks_nextcostume')]
    .map((id, i) => {
        if (i === 0) {
            b.blocks[id].topLevel = true;
            b.blocks[id].x = top[0];
            b.blocks[id].y = top[1];
        }
        return id;
    }));

// ---- melody: scales, the piano, effects (standard level) ----
const makeMelody = async () => {
    const b = new Blocks();
    const melody = steps => b.strudel('tone', {
        PATTERN: ['block', b.strudel('scaleNotes', {
            STEPS: ['text', steps], ROOT: ['root', 'C4'], SCALE: ['scale', 'major:pentatonic']
        })],
        SYNTH: ['synth', 'piano']
    });

    const flag = b.block('event_whenflagclicked', {top: [24, 24]});
    const tempo = b.strudel('setBpm', {BPM: ['number', 100]});
    const drums = play(b, 'ドラム', b.strudel('miniSound', {CODE: ['text', 'bd [~ bd] sd ~, [~ hh]*4']}));
    const bass = play(b, 'ベース', b.strudel('effect', {
        PATTERN: ['block', b.strudel('tone', {
            PATTERN: ['block', b.strudel('miniNote', {CODE: ['text', '<c2 a1 f1 g1>']})],
            SYNTH: ['synth', 'sawtooth']
        })],
        VALUE: ['text', '700']
    }, {EFFECT: 'lpf'}));
    const first = play(b, 'メロディ', melody('0 2 4 <5 7>'));
    const roll = b.strudel('showViz', {}, {VIZ: 'pianoroll'});
    const hint = b.say('スペース・↑・↓ キーで メロディが かわるよ。R キーで ひびきが つくよ。', 6);
    b.stack([flag, tempo, drums, bass, first, roll, hint]);
    b.comment(flag, 'おんかい(ヨナぬき)の ばんごうで メロディを つくるよ。\nピアノの おとは じどうで よみこまれるよ。', 1000, 24);

    onKey(b, 'space', [24, 520], [play(b, 'メロディ', melody('<[0 2 4 2] [4 5 7 5]>'))]);
    onKey(b, 'up arrow', [24, 640], [play(b, 'メロディ', b.strudel('tone', {
        PATTERN: ['block', b.strudel('scaleNotes', {
            STEPS: ['blockOnText', b.strudel('addNotes', {
                PATTERN: ['block', b.strudel('miniNote', {CODE: ['text', '0 2 4 <5 7>']})],
                VALUE: ['text', '<0 2 4>']
            })],
            ROOT: ['root', 'C4'],
            SCALE: ['scale', 'major:pentatonic']
        })],
        SYNTH: ['synth', 'piano']
    }))]);
    onKey(b, 'down arrow', [24, 760], [play(b, 'メロディ', melody('0 2 4 <5 7>'))]);
    onKey(b, 'r', [24, 880], [play(b, 'メロディ', b.strudel('effect', {
        PATTERN: ['block', melody('0 2 4 <5 7>')], VALUE: ['text', '0.8']
    }, {EFFECT: 'room'}))]);
    b.comment(b.blocks && Object.keys(b.blocks).find(id => b.blocks[id].opcode === 'event_whenkeypressed'),
        'キーを おすと、つぎの サイクルの はじめで メロディが いれかわるよ。', 1000, 520);
    danceOnBeat(b, [24, 1000]);

    await writeProject(b, out('melody'), 'xcx-strudel make-samples');
};

// ---- trance: drum machine, acid, trance gate, layers by keys (master level) ----
const makeTrance = async () => {
    const b = new Blocks();
    const kick = () => play(b, 'キック', b.strudel('drumMachine', {
        PATTERN: ['block', b.strudel('miniSound', {CODE: ['text', 'bd*4']})], MACHINE: ['machine', 'RolandTR909']
    }));
    const parts = [
        ['1', 'q', 'キック', kick],
        ['2', 'w', 'ハイハット', () => play(b, 'ハイハット', b.strudel('drumMachine', {
            PATTERN: ['block', b.strudel('miniSound', {CODE: ['text', '[~ hh]*4, [~ cp]*2']})],
            MACHINE: ['machine', 'RolandTR909']
        }))],
        ['3', 'e', 'ベース', () => play(b, 'ベース', b.strudel('acid', {
            PATTERN: ['block', b.strudel('addNotes', {
                PATTERN: ['block', b.strudel('miniNote', {CODE: ['text', 'a1*16']})],
                VALUE: ['text', '<0 0 -4 -2>']
            })],
            AMOUNT: ['number', 0.6]
        }))],
        ['4', 'r', 'パッド', () => play(b, 'パッド', b.strudel('effect', {
            PATTERN: ['block', b.strudel('trancegate', {
                PATTERN: ['block', b.strudel('tone', {
                    PATTERN: ['block', b.strudel('miniNote', {
                        CODE: ['text', '<[a3,c4,e4] [f3,a3,c4] [c4,e4,g4] [g3,b3,d4]>']
                    })],
                    SYNTH: ['synth', 'supersaw']
                })],
                DENSITY: ['number', 0.7],
                SEED: ['number', 12],
                LENGTH: ['number', 1]
            })],
            VALUE: ['text', '2000']
        }, {EFFECT: 'lpf'}))],
        ['5', 't', 'リード', () => play(b, 'リード', b.strudel('effect', {
            PATTERN: ['block', b.strudel('superimpose', {
                PATTERN: ['block', b.strudel('tone', {
                    PATTERN: ['block', b.strudel('scaleNotes', {
                        STEPS: ['text', '<0 2 4 7 4 2 1 -1>*8'], ROOT: ['root', 'A3'], SCALE: ['scale', 'minor']
                    })],
                    SYNTH: ['synth', 'triangle']
                })]
            }, {TRANSFORM: 'up12'})],
            VALUE: ['text', '.3']
        }, {EFFECT: 'delay'}))]
    ];

    const flag = b.block('event_whenflagclicked', {top: [24, 24]});
    const tempo = b.strudel('setBpm', {BPM: ['number', 138]});
    const spectrum = b.strudel('showViz', {}, {VIZ: 'spectrum'});
    const hint = b.say('1〜5 キーで パートを ふやそう。Q〜T で とめる、0 で ぜんぶ とめるよ。', 6);
    b.stack([flag, tempo, kick(), spectrum, hint]);
    b.comment(flag, 'キーで パートを かさねていく DJ あそび。\nアシッドベースと トランスゲートの パッドを つかっているよ。', 1100, 24);

    parts.forEach(([startKey, stopKey, track, start], i) => {
        onKey(b, startKey, [24, 300 + (i * 170)], [start()]);
        onKey(b, stopKey, [760, 300 + (i * 170)], [b.strudel('stopTrack', {TRACK: ['text', track]})]);
    });
    onKey(b, '0', [760, 1150], [b.strudel('stopAll')]);

    // jump on the kick, change color on every beat
    const kickHat = b.strudel('whenSound', {}, {DRUM: 'bd'});
    b.blocks[kickHat].topLevel = true;
    b.blocks[kickHat].x = 24;
    b.blocks[kickHat].y = 1180;
    const big = b.block('looks_setsizeto');
    b.number(big, 'SIZE', 125);
    const wait = b.block('control_wait');
    b.blocks[wait].inputs.DURATION = [1, b.shadow(wait, 'math_positive_number', 'NUM', 0.1)];
    const normal = b.block('looks_setsizeto');
    b.number(normal, 'SIZE', 100);
    b.stack([kickHat, big, wait, normal]);
    const beatHat = b.strudel('whenBeat');
    b.blocks[beatHat].topLevel = true;
    b.blocks[beatHat].x = 24;
    b.blocks[beatHat].y = 1360;
    const color = b.block('looks_changeeffectby', {fields: {EFFECT: ['COLOR', null]}});
    b.number(color, 'CHANGE', 25);
    b.stack([beatHat, color]);

    await writeProject(b, out('trance'), 'xcx-strudel make-samples');
};

// ---- acid and trance gate: one song with the acid and trance gate blocks (master level) ----
const makeAcidGate = async () => {
    const b = new Blocks();
    const drums = code => b.strudel('drumMachine', {
        PATTERN: ['block', b.strudel('miniSound', {CODE: ['text', code]})], MACHINE: ['machine', 'RolandTR909']
    });
    const tone = (pattern, synth) => b.strudel('tone', {PATTERN: ['block', pattern], SYNTH: ['synth', synth]});
    const effect = (pattern, name, value) => b.strudel('effect', {
        PATTERN: ['block', pattern], VALUE: ['text', value]
    }, {EFFECT: name});

    const flag = b.block('event_whenflagclicked', {top: [24, 24]});
    const level = b.strudel('setLevel', {}, {LEVEL: '3'});
    const tempo = b.strudel('setBpm', {BPM: ['number', 138]});
    const kick = play(b, 'キック', drums('bd*4'));
    const hats = play(b, 'ハイハット', drums('[~ hh]*4, [~ cp]*2'));
    const acid = play(b, 'アシッド', b.strudel('acid', {
        PATTERN: ['block', b.strudel('miniNote', {CODE: ['text', '<a1*16 a1*16 f1*16 g1*16>']})],
        AMOUNT: ['number', 0.6]
    }));
    const pad = play(b, 'パッド', effect(b.strudel('trancegate', {
        PATTERN: ['block', tone(b.strudel('miniNote', {
            CODE: ['text', '<[a3,c4,e4] [f3,a3,c4] [c4,e4,g4] [g3,b3,d4]>']
        }), 'supersaw')],
        DENSITY: ['number', 0.8],
        SEED: ['number', 45],
        LENGTH: ['number', 1]
    }), 'lpf', '1897'));
    const lead = play(b, 'リード', effect(effect(b.strudel('transpose', {
        PATTERN: ['block', tone(b.strudel('scaleNotes', {
            STEPS: ['text', '<0 2 4 7 4 2 1 -1>*8'], ROOT: ['root', 'A'], SCALE: ['scale', 'minor']
        }), 'triangle')],
        SEMITONES: ['number', 24]
    }), 'delay', '.4'), 'delayfeedback', '.25'));
    const roll = b.strudel('showViz', {}, {VIZ: 'pianoroll'});
    b.stack([flag, level, tempo, kick, hats, acid, pad, lead, roll]);
    b.comment(flag, 'アシッドと トランスゲートの きょく。\n' +
        'Switch Angel さんの strudel-scripts の おとづくりを さんこうにした、ひこうしきの さくひんです' +
        '(ほんにんとは かんけいありません)。', 1100, 24);
    danceOnBeat(b, [24, 760]);

    await writeProject(b, out('acidgate'), 'xcx-strudel make-samples');
};

// ---- soul pop: jazzy chords on the piano with a shuffle (standard level) ----

const makeSoulPop = async () => {
    const b = new Blocks();
    const effect = (pattern, name, value) => b.strudel('effect', {
        PATTERN: ['block', pattern], VALUE: ['text', value]
    }, {EFFECT: name});
    const tone = (pattern, synth) => b.strudel('tone', {PATTERN: ['block', pattern], SYNTH: ['synth', synth]});
    const listMini = (name, how) => b.strudel('listMini', {}, {LISTNAME: name, HOW: how});
    // notes from a list, a bar in each cycle
    const listNotes = name => b.strudel('miniNote', {CODE: ['blockOnText', listMini(name, 'cycle')]});
    const piano = b.list('ピアノのコード', SOUL.piano);
    const rhythm = b.list('ピアノのリズム', PIANO_RHYTHM);
    const bass = b.list('ベース', SOUL.bass);
    const melody = b.list('メロディ', SOUL.melody);
    const drums = b.list('ドラム', SOUL.drums);
    const tracks = [
        ['1', 'ピアノ', () => tone(b.strudel('rhythm', {
            PATTERN: ['block', listNotes(piano)], RHYTHM: ['blockOnText', listMini(rhythm, 'seq')]
        }), 'piano')],
        ['2', 'ベース', () => effect(tone(listNotes(bass), 'sawtooth'), 'lpf', '350')],
        ['3', 'ドラム', () => effect(b.strudel('drumMachine', {
            PATTERN: ['block', b.strudel('miniSound', {CODE: ['blockOnText', listMini(drums, 'stack')]})],
            MACHINE: ['machine', 'RolandTR808']
        }), 'gain', '.8')],
        ['4', 'メロディ', () => effect(effect(tone(listNotes(melody), 'triangle'), 'room', '.4'), 'delay', '.2')]
    ];

    const flag = b.block('event_whenflagclicked', {top: [24, 24]});
    const hint = b.say('1〜4 キーで パートを ひとつずつ とめて、スペースで ぜんぶ もどるよ。', 6);
    b.stack([flag, b.strudel('setBpm', {BPM: ['number', 92]}), b.strudel('showViz', {}, {VIZ: 'pianoroll'}),
        b.broadcast('えんそう'), hint]);
    b.comment(flag, 'ジャズや ソウルの 和音を つかった ピアノ ポップ。\n' +
        '| FM7 | Em7 A7 | Dm7 G7 | Cmaj9 C9 |\n| FM7 | Fm6 | Em7 E♭dim7 | Dm7 G7sus4 |\n' +
        'ベースが 根音(ルート)を ひくので、ピアノは 根音を はぶいた 和音を ひいているよ。\n' +
        '1拍を 3つに わけた「シャッフル」の リズムで はねているよ。\n' +
        '和音・ベース・メロディは「変数」の リストに 1小節ずつ、\n' +
        'ピアノの リズムは 1拍ずつ、ドラムは 楽器ごとに 1行ずつ 入っているよ。', 1100, 24);
    b.stack([b.whenReceive('えんそう', [24, 280]), ...tracks.map(([, track, make]) => play(b, track, make()))]);
    b.stack([b.whenKey('space', [24, 760]), b.broadcast('えんそう')]);
    tracks.forEach(([key, track], i) => {
        onKey(b, key, [24, 880 + (i * 110)], [b.strudel('stopTrack', {TRACK: ['text', track]})]);
    });
    danceOnBeat(b, [24, 1460]);

    await writeProject(b, out('soulpop'), 'xcx-strudel make-samples');
};

await makeMelody();
await makeTrance();
await makeAcidGate();
await makeSoulPop();
console.log('made projects/melody.sb3, projects/trance.sb3, projects/acidgate.sb3 and projects/soulpop.sb3');
