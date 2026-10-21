#!/usr/bin/env node
/**
 * Make the projects of the tutorial: projects/tutorial/step1.sb3 ... step9.sb3.
 * Each step is a small project which tutorial.html shows and links to.
 * Run: npm run tutorial
 */
import path from 'path';
import {Blocks, inOrder, writeProject} from './sb3-builder.mjs';

const out = name => path.resolve(process.cwd(), `projects/tutorial/${name}.sb3`);

/**
 * @param {Blocks} b - builder
 * @param {string} track - track name
 * @param {string} pattern - block ID of the pattern
 * @returns {string} - block ID of "play on track"
 */
const play = (b, track, pattern) => b.strudel('playTrack', {PATTERN: ['block', pattern], TRACK: ['text', track]});

/**
 * "play on track" with a sound of the dropdown.
 * @param {Blocks} b - builder
 * @param {string} track - track name
 * @param {string} sound - value of the sound menu
 * @returns {string} - block ID
 */
const playSound = (b, track, sound) => b.strudel('playTrack', {PATTERN: ['sound', sound], TRACK: ['text', track]});

const flagAt = (b, y) => b.block('event_whenflagclicked', {top: [24, y]});
const tempo = (b, bpm) => b.strudel('setBpm', {BPM: ['number', bpm]});
const level = (b, value) => b.strudel('setLevel', {}, {LEVEL: value});
const drums = b => play(b, 'ドラム', inOrder(b, ['bd', '~', 'sd', '~']));
const hats = b => play(b, 'ハイハット', b.strudel('repeat', {PATTERN: ['sound', 'hh'], TIMES: ['number', 8]}));
const melody = b => {
    const turns = b.strudel('alternate', {});
    b.menu(turns, 'A', 'sound', 'c4');
    b.menu(turns, 'B', 'sound', 'g4');
    b.put(turns, 'A', inOrder(b, ['c4', 'e4', 'g4', 'c5']));
    b.put(turns, 'B', inOrder(b, ['a4', 'g4', 'e4', 'd4']));
    return play(b, 'メロディ', b.strudel('tone', {PATTERN: ['block', turns], SYNTH: ['synth', 'triangle']}));
};

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

const STEPS = {
    // 1. one sound
    step1: b => {
        b.stack([flagAt(b, 24), playSound(b, '1', 'bd')]);
    },
    // 2. sounds in order
    step2: b => {
        b.stack([flagAt(b, 24), tempo(b, 110), drums(b)]);
    },
    // 3. layers of tracks
    step3: b => {
        b.stack([flagAt(b, 24), tempo(b, 110), drums(b), hats(b)]);
    },
    // 4. melody
    step4: b => {
        b.stack([flagAt(b, 24), tempo(b, 110), drums(b), hats(b), melody(b)]);
    },
    // 5. change and stop by keys
    step5: b => {
        b.stack([flagAt(b, 24), tempo(b, 110), drums(b), hats(b)]);
        b.stack([b.whenKey('space', [24, 300]), play(b, 'ドラム', inOrder(b, ['bd', 'bd', 'sd', 'cp']))]);
        b.stack([b.whenKey('s', [24, 420]), b.strudel('stopTrack', {TRACK: ['text', 'ハイハット']})]);
        b.stack([b.whenKey('0', [24, 520]), b.strudel('stopAll')]);
    },
    // 6. pictures of sound
    step6: b => {
        b.stack([flagAt(b, 24), tempo(b, 110), drums(b), hats(b), melody(b),
            b.strudel('showViz', {}, {VIZ: 'pianoroll'})]);
        b.stack([b.whenKey('1', [24, 380]), b.strudel('showViz', {}, {VIZ: 'scope'})]);
        b.stack([b.whenKey('2', [24, 480]), b.strudel('showViz', {}, {VIZ: 'spectrum'})]);
        b.stack([b.whenKey('3', [24, 580]), b.strudel('hideViz')]);
    },
    // 7. a dancing sprite
    step7: b => {
        b.stack([flagAt(b, 24), tempo(b, 110), drums(b), hats(b)]);
        b.stack([hat(b, 'whenBeat', {}, [24, 260]), b.block('looks_nextcostume')]);
        const big = b.block('looks_setsizeto');
        b.number(big, 'SIZE', 120);
        const wait = b.block('control_wait');
        b.blocks[wait].inputs.DURATION = [1, b.shadow(wait, 'math_positive_number', 'NUM', 0.1)];
        const normal = b.block('looks_setsizeto');
        b.number(normal, 'SIZE', 100);
        b.stack([hat(b, 'whenSound', {DRUM: 'bd'}, [24, 400]), big, wait, normal]);
    },
    // 8. standard level: mini-notation, effects and scales
    step8: b => {
        const beat = play(b, 'ドラム', b.strudel('miniSound', {CODE: ['text', 'bd*2 [~ sd] <hh oh> sd']}));
        const bass = play(b, 'ベース', b.strudel('effect', {
            PATTERN: ['block', b.strudel('tone', {
                PATTERN: ['block', b.strudel('miniNote', {CODE: ['text', '<c2 a1 f1 g1>*2']})],
                SYNTH: ['synth', 'sawtooth']
            })],
            VALUE: ['text', '600']
        }, {EFFECT: 'lpf'}));
        const tune = play(b, 'メロディ', b.strudel('tone', {
            PATTERN: ['block', b.strudel('scaleNotes', {
                STEPS: ['text', '0 2 4 <5 7>'], ROOT: ['root', 'C4'], SCALE: ['scale', 'major:pentatonic']
            })],
            SYNTH: ['synth', 'piano']
        }));
        b.stack([flagAt(b, 24), level(b, '2'), tempo(b, 100), beat, bass, tune]);
        const say = b.say('', 4);
        b.put(say, 'MESSAGE', b.strudel('strudelCode'));
        b.stack([b.whenKey('c', [24, 380]), say]);
        b.stack([b.whenKey('o', [24, 500]), b.strudel('openStrudel')]);
    },
    // 9. master level: euclid, acid, trance gate and a wave
    step9: b => {
        const kick = play(b, 'キック', b.strudel('drumMachine', {
            PATTERN: ['block', b.strudel('euclid', {
                PULSES: ['number', 5], PATTERN: ['sound', 'bd'], STEPS: ['number', 8]
            })],
            MACHINE: ['machine', 'RolandTR909']
        }));
        const acid = play(b, 'アシッド', b.strudel('acid', {
            PATTERN: ['block', b.strudel('miniNote', {CODE: ['text', '<a1*16 f1*16>']})],
            AMOUNT: ['number', 0.6]
        }));
        const hats = play(b, 'ハイハット', b.strudel('effect', {
            PATTERN: ['block', b.strudel('repeat', {PATTERN: ['sound', 'hh'], TIMES: ['number', 16]})],
            VALUE: ['blockOnText', b.strudel('wave', {
                MIN: ['number', 0], MAX: ['number', 1], CYCLES: ['number', 2]
            }, {SHAPE: 'sine'})]
        }, {EFFECT: 'pan'}));
        const pad = play(b, 'パッド', b.strudel('trancegate', {
            PATTERN: ['block', b.strudel('tone', {
                PATTERN: ['block', b.strudel('chord', {ROOT: ['root', 'A3'], CHORD: ['chord', 'minor']})],
                SYNTH: ['synth', 'supersaw']
            })],
            DENSITY: ['number', 0.7],
            SEED: ['number', 3],
            LENGTH: ['number', 1]
        }));
        b.stack([flagAt(b, 24), level(b, '3'), tempo(b, 138), kick, hats, acid, pad,
            b.strudel('showViz', {}, {VIZ: 'spectrum'})]);
    },
    // 10. advanced: sounds of EDM and trance, a part on each key
    step10: b => {
        // value is a text, or {wave: block ID}
        const effect = (pattern, name, value) => b.strudel('effect', {
            PATTERN: ['block', pattern], VALUE: typeof value === 'string' ? ['text', value] : ['blockOnText', value.wave]
        }, {EFFECT: name});
        const tone = (pattern, synth) => b.strudel('tone', {PATTERN: ['block', pattern], SYNTH: ['synth', synth]});
        const note = code => b.strudel('miniNote', {CODE: ['text', code]});
        const tr909 = code => b.strudel('drumMachine', {
            PATTERN: ['block', b.strudel('miniSound', {CODE: ['text', code]})], MACHINE: ['machine', 'RolandTR909']
        });
        const rising = (min, max) => ({wave: b.strudel('wave', {
            MIN: ['number', min], MAX: ['number', max], CYCLES: ['number', 4]
        }, {SHAPE: 'saw'})});
        const CHORDS = '<[a3,c4,e4] [f3,a3,c4] [c4,e4,g4] [g3,b3,d4]>';
        const parts = [
            ['1', [play(b, 'キック', tr909('bd*4'))]],
            ['2', [play(b, 'ベース', effect(tone(note('<[~ a1]*4 [~ f1]*4 [~ c2]*4 [~ g1]*4>'), 'sawtooth'), 'lpf', '500'))]],
            ['3', [play(b, 'パッド', effect(b.strudel('trancegate', {
                PATTERN: ['block', tone(note(CHORDS), 'supersaw')],
                DENSITY: ['number', 0.8], SEED: ['number', 45], LENGTH: ['number', 1]
            }), 'room', '.6'))]],
            ['4', [play(b, 'プラック', effect(effect(tone(b.strudel('arp', {
                PATTERN: ['block', note('<[a3,c4,e4,a4] [f3,a3,c4,f4] [c4,e4,g4,c5] [g3,b3,d4,g4]>')],
                ORDER: ['text', '0 1 2 3 2 1 2 3']
            }), 'square'), 'clip', '.3'), 'delay', '.4'))]],
            ['5', [play(b, 'リード', effect(effect(b.strudel('superimpose', {
                PATTERN: ['block', tone(b.strudel('scaleNotes', {
                    STEPS: ['text', '<[7 ~ 9 11] [12 11 ~ 9] [11 ~ 9 7] [8 ~ 9 6]>*2'],
                    ROOT: ['root', 'A3'], SCALE: ['scale', 'minor']
                }), 'supersaw')]
            }, {TRANSFORM: 'up12'}), 'unison', '7'), 'room', '.8'))]],
            ['6', [
                play(b, 'スネア', effect(tr909('<sd*4 sd*8 sd*16 sd*32>'), 'gain', rising(0.3, 1))),
                play(b, 'ライザー', effect(effect(b.strudel('repeat', {
                    PATTERN: ['sound', 'white'], TIMES: ['number', 16]
                }), 'hpf', rising(300, 9000)), 'gain', rising(0, 0.4)))
            ]],
            ['space', [
                b.strudel('stopTrack', {TRACK: ['text', 'スネア']}),
                b.strudel('stopTrack', {TRACK: ['text', 'ライザー']})
            ]],
            ['7', [play(b, 'キック', b.strudel('duck', {
                PATTERN: ['block', tr909('bd*4')], DEPTH: ['number', 0.85]
            }))]],
            ['0', [b.strudel('stopAll')]]
        ];
        const flag = flagAt(b, 24);
        b.stack([flag, level(b, '3'), tempo(b, 140), b.strudel('showViz', {}, {VIZ: 'spectrum'}),
            b.say('1〜6 キーで パートを ふやそう。7 で ポンピング、1 で もとの キック。スペースで ドロップ、0 で とめる', 8)]);
        b.comment(flag, 'EDM・トランスの 音づくり。\nキーを 1つずつ おして、パートの やくわりを 耳で たしかめよう。', 900, 24);
        parts.forEach(([key, blocks], i) => b.stack([b.whenKey(key, [24, 260 + (i * 150)]), ...blocks]));
    }
};

for (const [name, make] of Object.entries(STEPS)) {
    const b = new Blocks();
    make(b);
    await writeProject(b, out(name), 'xcx-strudel make-tutorial');
}
console.log(`made ${Object.keys(STEPS).length} projects in projects/tutorial`);
