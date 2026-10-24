import {blockClass} from '../../src/vm/extensions/block/index.js';
import {BLOCKS, LEVEL, MENUS, levelOf} from '../../src/vm/extensions/block/blocks.js';
import {compile} from '../../src/core/ast.js';
import {s} from '@strudel/core';
import {mini} from '@strudel/mini';
import {build, codeOf, makeUtil, playTrack} from '../helpers/track.js';
import translations from '../../src/vm/extensions/block/translations.json';
import entryTranslations from '../../src/gui/lib/libraries/extensions/entry/translations.json';

const LOCALES = ['en', 'ja', 'ja-Hira'];

const makeRuntime = (targets = []) => {
    const formatMessage = msg => msg.default;
    formatMessage.setup = () => null;
    const listeners = {};
    return {
        formatMessage,
        targets,
        audioEngine: {audioContext: {currentTime: 0}},
        on: (event, fn) => {
            listeners[event] = fn;
        },
        emit: event => listeners[event] && listeners[event](),
        requestToolboxExtensionsUpdate: vi.fn(),
        startHats: vi.fn()
    };
};

const blockDefs = BLOCKS.filter(b => typeof b === 'object');
const infoOf = (ext, opcode) => ext.getInfo().blocks.find(b => b.opcode === opcode);

describe('translations', () => {
    test.each(LOCALES)('every block has a message in %s', locale => {
        blockDefs.forEach(b => expect(translations[locale]).toHaveProperty([`strudel.${b.opcode}`]));
    });

    test.each(LOCALES)('every menu item has a message in %s', locale => {
        Object.values(MENUS).forEach(menu => {
            menu.items.forEach(([value, , group = menu.group]) => {
                expect(translations[locale]).toHaveProperty([`strudel.menu.${group}.${value}`]);
            });
        });
    });

    test.each(LOCALES)('placeholders in %s match English', locale => {
        const placeholders = text => (text.match(/\[[A-Z]+\]/g) || []).sort();
        Object.keys(translations.en).forEach(key => {
            expect(placeholders(translations[locale][key])).toEqual(placeholders(translations.en[key]));
        });
    });

    test.each(LOCALES)('no block message in %s starts with a digit', locale => {
        // Scratch puts "%1%2" for the icon before the text, so "1..." becomes "%21"
        blockDefs.forEach(b => expect(translations[locale][`strudel.${b.opcode}`]).not.toMatch(/^\d/));
    });

    test('default texts are the English messages', () => {
        blockDefs.forEach(b => expect(translations.en[`strudel.${b.opcode}`]).toBe(b.text));
    });

    test.each([
        ['block', translations],
        ['entry', entryTranslations]
    ])('%s translations have the same keys in all locales', (_, table) => {
        const keys = Object.keys(table.en).sort();
        expect(Object.keys(table.ja).sort()).toEqual(keys);
        expect(Object.keys(table['ja-Hira']).sort()).toEqual(keys);
    });
});

describe('levels', () => {
    test('the beginner level shows about 20 blocks', () => {
        const ext = new blockClass(makeRuntime());
        const shown = ext.getInfo().blocks.filter(b => typeof b === 'object' && !b.hideFromPalette);
        expect(shown.length).toBeGreaterThanOrEqual(15);
        expect(shown.length).toBeLessThanOrEqual(22);
    });

    test('higher level blocks are hidden at the beginner level', () => {
        const ext = new blockClass(makeRuntime());
        expect(infoOf(ext, 'slow').hideFromPalette).toBe(true);
        expect(infoOf(ext, 'fast').hideFromPalette).toBe(false);
    });

    test('setLevel shows more blocks and refreshes the toolbox', () => {
        const runtime = makeRuntime();
        const ext = new blockClass(runtime);
        ext.setLevel({LEVEL: '2'});
        expect(infoOf(ext, 'slow').hideFromPalette).toBe(false);
        expect(runtime.requestToolboxExtensionsUpdate).toHaveBeenCalledTimes(1);
    });

    test('setLevel ignores the same level and invalid values', () => {
        const runtime = makeRuntime();
        const ext = new blockClass(runtime);
        ext.setLevel({LEVEL: '1'});
        ext.setLevel({LEVEL: '9'});
        expect(runtime.requestToolboxExtensionsUpdate).not.toHaveBeenCalled();
        expect(ext.level).toBe(LEVEL.BEGINNER);
    });

    test('block texts do not change with the level', () => {
        // the palette reuses rendered blocks, so a changed text would not be shown
        const ext = new blockClass(makeRuntime());
        const before = infoOf(ext, 'fast').text;
        ext.setLevel({LEVEL: '3'});
        expect(infoOf(ext, 'fast').text).toBe(before);
    });

    test('every argument has a non-blank default value', () => {
        // Scratch makes no field for a blank default and shows "undefined"
        blockDefs.forEach(b => Object.values(b.arguments || {}).forEach(arg => {
            if (arg.menu === 'spriteSound') return; // dynamic menu shows its first item
            expect(String(arg.defaultValue).trim()).not.toBe('');
        }));
    });

    test('block info has no private properties', () => {
        const ext = new blockClass(makeRuntime());
        ext.getInfo().blocks.filter(b => typeof b === 'object')
            .forEach(b => {
                expect(b).not.toHaveProperty('level');
                expect(b).not.toHaveProperty('maxLevel');
                expect(b).not.toHaveProperty('inTrack');
            });
    });

    test('loading a project shows the blocks which it uses', () => {
        const target = {blocks: {_blocks: {
            a: {opcode: 'strudel_track'},
            b: {opcode: 'strudel_slow'},
            c: {opcode: 'motion_movesteps'}
        }}};
        const runtime = makeRuntime([target]);
        const ext = new blockClass(runtime);
        runtime.emit('PROJECT_LOADED');
        expect(ext.level).toBe(LEVEL.STANDARD);
    });

    test('loading another project goes back to its level', () => {
        const target = {blocks: {_blocks: {a: {opcode: 'strudel_slow'}}}};
        const runtime = makeRuntime([target]);
        const ext = new blockClass(runtime);
        runtime.emit('PROJECT_LOADED');
        expect(ext.level).toBe(LEVEL.STANDARD);
        target.blocks._blocks = {};
        runtime.emit('PROJECT_LOADED');
        expect(ext.level).toBe(LEVEL.BEGINNER);
    });

    test('levelOf', () => {
        expect(levelOf('track')).toBe(LEVEL.BEGINNER);
        expect(levelOf('unknown')).toBe(0);
    });
});

describe('the track block', () => {
    const makeExt = () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        return ext;
    };

    test('runs its branch once, then plays what the blocks in it built', async () => {
        const ext = makeExt();
        const util = makeUtil();
        expect(ext.track({TRACK: 'drums'}, util)).toBeUndefined();
        expect(util.branches).toBe(1);
        util.thread.stackFrames.push({executionContext: null});
        ext.sMenu({SOUND: 'bd'}, util);
        ext.fast({TIMES: 4}, util);
        util.thread.stackFrames.pop();
        await ext.track({TRACK: 'drums'}, util);
        expect(util.branches).toBe(1);
        expect(ext.engine.play).toHaveBeenCalledWith('drums', expect.anything());
        expect(ext.strudelCode()).toContain('$: s("bd").fast(4)');
    });

    test('the blocks are the method chain from the top', () => {
        const ext = makeExt();
        expect(codeOf(ext, [
            ['noteMenu', {NOTE: 'c4'}],
            ['sMenu', {SOUND: 'sawtooth'}],
            ['effect', {EFFECT: 'lpf', VALUE: '500'}],
            ['fast', {TIMES: 2}]
        ])).toBe('note("c4").s("sawtooth").lpf(500).fast(2)');
    });

    test('an empty track plays silence', async () => {
        const ext = makeExt();
        await playTrack(ext, '1', []);
        expect(ext.strudelCode()).toContain('$: silence');
    });

    test('a later sound takes the place of the earlier one', () => {
        const ext = makeExt();
        expect(codeOf(ext, [['noteMenu', {NOTE: 'c4'}], ['seq', {A: 'bd', B: 'sd', C: '', D: ''}]]))
            .toBe('seq(s("bd"), s("sd"))');
    });

    test('a method before any sound is put on silence', () => {
        expect(codeOf(makeExt(), [['fast', {TIMES: 2}]])).toBe('silence.fast(2)');
    });

    test('blocks outside a track do nothing', () => {
        const ext = makeExt();
        expect(() => ext.fast({TIMES: 2}, makeUtil())).not.toThrow();
        expect(() => ext.sMenu({SOUND: 'bd'})).not.toThrow();
        expect(() => ext.spriteSound({SOUND: 'meow'}, makeUtil())).not.toThrow();
        expect(ext.spriteSounds.urls).toHaveLength(0);
    });

    test('blocks in a custom block which is used in the track also work', () => {
        const ext = makeExt();
        const util = makeUtil();
        util.stackFrame.strudelTrack = {node: null};
        // the frames of the branch and of the custom block
        util.thread.stackFrames.push({executionContext: {}}, {executionContext: null});
        ext.sMenu({SOUND: 'hh'}, util);
        ext.fast({TIMES: 8}, util);
        expect(String(util.thread.stackFrames[0].executionContext.strudelTrack.node)).toBe('s("hh").fast(8)');
    });

    test('a track in a track is a track of its own', async () => {
        const ext = makeExt();
        const util = makeUtil();
        ext.track({TRACK: 'outer'}, util);
        util.thread.stackFrames.push({executionContext: null});
        ext.sMenu({SOUND: 'bd'}, util);
        ext.track({TRACK: 'inner'}, util);
        util.thread.stackFrames.push({executionContext: null});
        ext.sMenu({SOUND: 'hh'}, util);
        util.thread.stackFrames.pop();
        await ext.track({TRACK: 'inner'}, util);
        ext.fast({TIMES: 2}, util);
        util.thread.stackFrames.pop();
        await ext.track({TRACK: 'outer'}, util);
        expect(ext.strudelCode().split('\n').filter(line => line.startsWith('$:')))
            .toEqual(['$: s("hh")', '$: s("bd").fast(2)']);
    });

    test('blocks in the track are commands and only values are reporters', () => {
        blockDefs.forEach(b => {
            if (b.inTrack) expect(b.blockType).toBe(b.opcode === 'stackBranch' ? 'conditional' : 'command');
            if (b.blockType === 'reporter') expect(Object.keys(b.arguments || {})).not.toContain('PATTERN');
        });
        expect(blockDefs.find(b => b.opcode === 'track').blockType).toBe('conditional');
    });

    test('the dropdown s and note are shown only at the beginner level', () => {
        const ext = new blockClass(makeRuntime());
        expect(infoOf(ext, 'sMenu').hideFromPalette).toBe(false);
        expect(infoOf(ext, 's').hideFromPalette).toBe(true);
        ext.setLevel({LEVEL: '2'});
        expect(infoOf(ext, 'sMenu').hideFromPalette).toBe(true);
        expect(infoOf(ext, 'noteMenu').hideFromPalette).toBe(true);
        expect(infoOf(ext, 's').hideFromPalette).toBe(false);
        expect(infoOf(ext, 'note').hideFromPalette).toBe(false);
    });
});

describe('pattern blocks', () => {
    const ext = new blockClass(makeRuntime());

    test.each([
        ['seq', {A: 'bd', B: 'sd', C: '', D: 'hh'}, 'seq(s("bd"), s("sd"), s("hh"))'],
        ['stack', {A: 'bd sd', B: 'hh*4'}, 'stack(s("bd sd"), s("hh*4"))'],
        ['cat', {A: 'c4', B: 'e4'}, 'cat(note("c4"), note("e4"))'],
        ['sMenu', {SOUND: 'hh'}, 's("hh")'],
        ['sMenu', {SOUND: '~'}, 'silence'],
        ['noteMenu', {NOTE: 'c4'}, 'note("c4")']
    ])('%s', (opcode, args, code) => {
        expect(codeOf(ext, [[opcode, args]])).toBe(code);
    });

    test.each([
        ['fast', {TIMES: '4'}, 's("hh").fast(4)'],
        ['slow', {CYCLES: 2}, 's("hh").slow(2)'],
        ['sMenu', {SOUND: 'square'}, 's("hh").s("square")']
    ])('%s after s', (opcode, args, code) => {
        expect(codeOf(ext, [['sMenu', {SOUND: 'hh'}], [opcode, args]])).toBe(code);
    });

    test('there is no block which executes code', () => {
        expect(ext.doIt).toBeUndefined();
        blockDefs.forEach(b => expect(b.opcode).not.toMatch(/eval|exec|run|doIt/i));
    });
});

describe('hats', () => {
    test('engine events start hat blocks', () => {
        const runtime = makeRuntime();
        const ext = new blockClass(runtime);
        ext.connectHats();
        ext.engine.onBeat(1);
        ext.engine.onSound({s: 'bd'});
        ext.engine.onSound({note: 'c4'});
        expect(runtime.startHats).toHaveBeenCalledWith('strudel_whenBeat');
        expect(runtime.startHats).toHaveBeenCalledWith('strudel_whenSound', {DRUM: 'bd'});
        expect(runtime.startHats).toHaveBeenCalledTimes(2);
    });

    test('hat functions let the scripts run', () => {
        const ext = new blockClass(makeRuntime());
        expect(ext.whenBeat()).toBe(true);
        expect(ext.whenSound()).toBe(true);
    });

    test('beat and cycle are 0 before playing', () => {
        const ext = new blockClass(makeRuntime());
        expect(ext.beatInCycle()).toBe(0);
        expect(ext.cycle()).toBe(0);
    });
});

describe('input limits', () => {
    const ext = new blockClass(makeRuntime());

    test.each([
        ['fast', {TIMES: 1e9}, 's("hh").fast(64)'],
        ['fast', {TIMES: -3}, 's("hh").fast(0)'],
        ['slow', {CYCLES: 0}, 's("hh").slow(0.01)'],
        ['slow', {CYCLES: 'Infinity'}, 's("hh").slow(1024)']
    ])('%s %j', (opcode, args, code) => {
        expect(codeOf(ext, [['sMenu', {SOUND: 'hh'}], [opcode, args]])).toBe(code);
    });

    test('BPM is kept in a range', () => {
        ext.setBpm({BPM: 'Infinity'});
        expect(ext.engine.bpm).toBeCloseTo(400);
        ext.setBpm({BPM: 0});
        expect(ext.engine.bpm).toBeCloseTo(10);
    });

    test('number sound names start the hat with a string', () => {
        const runtime = makeRuntime();
        const e = new blockClass(runtime);
        e.connectHats();
        e.engine.onSound({s: 808});
        expect(runtime.startHats).toHaveBeenCalledWith('strudel_whenSound', {DRUM: '808'});
    });

    test('pictures of sound are skipped without a renderer', () => {
        const e = new blockClass(makeRuntime());
        expect(() => e.showViz({VIZ: 'pianoroll'})).not.toThrow();
        expect(() => e.vizLayer({LAYER: 'front'})).not.toThrow();
        expect(() => e.hideViz()).not.toThrow();
    });
});

describe('P2 blocks', () => {
    const ext = new blockClass(makeRuntime());
    const notes = ['note', {CODE: 'c e'}];

    test.each([
        [[['s', {CODE: 'bd*2 c4'}]], 's("bd*2 c4")'],
        [[['note', {CODE: 'c3 e3'}]], 'note("c3 e3")'],
        [[['n', {CODE: '0 2 4'}], ['scale', {ROOT: 'D4', SCALE: 'minor:pentatonic'}]], 'n("0 2 4").scale("D4:minor:pentatonic")'],
        [[notes, ['effect', {EFFECT: 'lpf', VALUE: '800'}]], 'note("c e").lpf(800)'],
        [[notes, ['effect', {EFFECT: 'lpf', VALUE: '5'}]], 'note("c e").lpf(20)'],
        [[notes, ['effect', {EFFECT: 'room', VALUE: '800'}]], 'note("c e").room(10)'],
        [[notes, ['effect', {EFFECT: 'pan', VALUE: '0 1'}]], 'note("c e").pan("0 1")'],
        [[notes, ['rev']], 'note("c e").rev()'],
        [[['s', {CODE: 'bd'}], ['ply', {TIMES: 100}]], 's("bd").ply(8)'],
        [[notes, ['every', {CYCLES: 4, TRANSFORM: 'fast'}]], 'note("c e").every(4, x => x.fast(2))'],
        [[notes, ['every', {CYCLES: 0, TRANSFORM: 'evil'}]], 'note("c e").every(1, x => x.rev())'],
        [[notes, ['every', {CYCLES: 2, TRANSFORM: 'constructor'}]], 'note("c e").every(2, x => x.rev())'],
        [[notes, ['effect', {EFFECT: 'vowel', VALUE: '<a o>'}]], 'note("c e").vowel("<a o>")'],
        [[['s', {CODE: 'bd'}], ['effect', {EFFECT: 'speed', VALUE: '-9'}]], 's("bd").speed(-4)'],
        [[['s', {CODE: 'bd sd'}], ['bank', {MACHINE: 'RolandTR808'}]], 's("bd sd").bank("RolandTR808")'],
        [[notes, ['s', {CODE: 'piano'}]], 'note("c e").s("piano")']
    ])('%j', (steps, code) => {
        expect(codeOf(ext, steps)).toBe(code);
    });

    test('an unknown effect keeps the pattern', () => {
        expect(codeOf(ext, [notes, ['effect', {EFFECT: 'constructor', VALUE: '1'}]])).toBe('note("c e")');
    });

    test.each(MENUS.scale.items.map(([v]) => v))('scale %s makes notes', scale => {
        const pattern = compile(build(ext, [['n', {CODE: '0 1 2'}], ['scale', {ROOT: 'C4', SCALE: scale}]]));
        const values = pattern.queryArc(0, 1).map(hap => hap.value.note);
        expect(values.every(n => typeof n !== 'undefined')).toBe(true);
    });

    test('a sprite sound becomes a sample', () => {
        const sound = {name: 'meow', assetId: 'abc123def456789', dataFormat: 'wav', asset: {data: new Uint8Array(4)}};
        const target = {sprite: {sounds: [sound]}};
        expect(codeOf(ext, [['spriteSound', {SOUND: 'meow'}]], target)).toBe('s("scratch_abc123def456")');
        expect(ext.spriteSounds.urls).toHaveLength(1);
        build(ext, [['spriteSound', {SOUND: 'meow'}]], target);
        expect(ext.spriteSounds.urls).toHaveLength(1);
    });

    test('a missing sprite sound is silence', () => {
        expect(codeOf(ext, [['spriteSound', {SOUND: 'none'}]], {sprite: {sounds: []}})).toBe('silence');
    });

    test('the sprite sound menu lists the sounds of the editing sprite', () => {
        const runtime = makeRuntime();
        runtime.getEditingTarget = () => ({sprite: {sounds: [{name: 'a'}, {name: 'b'}]}});
        expect(new blockClass(runtime).getSpriteSoundMenu()).toEqual(['a', 'b']);
    });
});

describe('sample banks', () => {
    test('an unknown bank is not loaded', async () => {
        const {loadBank} = await import('../../src/core/sample-banks.js');
        await expect(loadBank('https://example.com/evil.json')).rejects.toThrow('unknown bank');
        await expect(loadBank('constructor')).rejects.toThrow('unknown bank');
    });
});

describe('sound dropdowns', () => {
    test('sounds of the beginner level are dropdowns, not text', () => {
        const slots = blockDefs.filter(b => b.level === LEVEL.BEGINNER && b.inTrack)
            .flatMap(b => Object.values(b.arguments || {}))
            .filter(arg => arg.type === 'string');
        expect(slots.length).toBeGreaterThan(0);
        slots.forEach(arg => expect(arg.menu).toBeTruthy());
    });

    test('the sound menus accept value blocks', () => {
        expect(MENUS.sound.acceptReporters).toBe(true);
        expect(MENUS.sName.acceptReporters).toBe(true);
        expect(MENUS.note.acceptReporters).toBe(true);
    });

    test('the sound menu has drums, notes and a rest', () => {
        const values = MENUS.sound.items.map(([value]) => value);
        expect(values).toEqual(expect.arrayContaining(['bd', 'sd', 'hh', 'c4', 'g4', '~']));
    });

    test('the menu of s has drums, synths and a rest, but no notes', () => {
        const values = MENUS.sName.items.map(([value]) => value);
        expect(values).toEqual(expect.arrayContaining(['bd', 'hh', 'sawtooth', 'supersaw', '~', 'white']));
        expect(values).not.toContain('c4');
    });

    test('items of the sound menu become sounds, notes and a rest', () => {
        const ext = new blockClass(makeRuntime());
        expect(codeOf(ext, [['seq', {A: 'bd', B: 'c4', C: '~', D: 'hh'}]]))
            .toBe('seq(s("bd"), note("c4"), silence, s("hh"))');
        const events = compile(build(ext, [['seq', {A: 'bd', B: '~', C: '~', D: 'hh'}]])).queryArc(0, 1);
        expect(events.map(hap => hap.value.s)).toEqual(['bd', 'hh']);
    });

    test('the menu is shown in each language', () => {
        const ja = new blockClass(makeRuntime());
        const items = ja.getInfo().menus.sound.items.map(item => item.text);
        // sounds are shown by their Strudel names
        expect(items).toEqual(expect.arrayContaining(['bd', 'c4', '~']));
    });
});

describe('P3 blocks', () => {
    const ext = new blockClass(makeRuntime());
    const hh = ['s', {CODE: 'hh'}];
    const c4 = ['note', {CODE: 'c4'}];
    const bd = ['s', {CODE: 'bd'}];

    test.each([
        [[hh, ['degradeBy', {PERCENT: 30}]], 's("hh").degradeBy(0.3)'],
        [[hh, ['degradeBy', {PERCENT: 300}]], 's("hh").degradeBy(1)'],
        [[c4, ['sometimes', {TRANSFORM: 'up12'}]], 'note("c4").sometimes(x => x.transpose(12))'],
        [[bd, ['euclid', {PULSES: 3, STEPS: 8}]], 's("bd").euclid(3, 8)'],
        [[bd, ['euclid', {PULSES: 20, STEPS: 8}]], 's("bd").euclid(8, 8)'],
        [[c4, ['jux', {TRANSFORM: 'rev'}]], 'note("c4").jux(x => x.rev())'],
        [[c4, ['off', {TRANSFORM: 'up7', TIME: '0.125'}]], 'note("c4").off(0.125, x => x.transpose(7))'],
        [[bd, ['chop', {PIECES: 99}]], 's("bd").chop(16)'],
        [[c4, ['transpose', {SEMITONES: -50}]], 'note("c4").transpose(-24)'],
        [[['chord', {ROOT: 'C4', CHORD: 'major'}]], 'note("[c4,e4,g4]")'],
        [[['chord', {ROOT: 'A3', CHORD: 'minor7'}]], 'note("[a3,c4,e4,g4]")'],
        [[['chord', {ROOT: 'D4', CHORD: 'constructor'}]], 'note("[d4,f#4,a4]")'],
        [[c4, ['arp', {ORDER: '0 1 2'}]], 'note("c4").arp("0 1 2")']
    ])('%j', (steps, code) => {
        expect(codeOf(ext, steps)).toBe(code);
    });

    test('a wave goes into an effect', () => {
        const wave = ext.wave({SHAPE: 'sine', MIN: 200, MAX: 2000, CYCLES: 4});
        expect(codeOf(ext, [c4, ['effect', {EFFECT: 'lpf', VALUE: wave}]]))
            .toBe('note("c4").lpf(sine.range(200, 2000).slow(4))');
    });

    test('a wave is kept in the range of the effect', () => {
        const wave = ext.wave({SHAPE: 'saw', MIN: -5, MAX: 99, CYCLES: 1});
        expect(codeOf(ext, [c4, ['effect', {EFFECT: 'pan', VALUE: wave}]]))
            .toBe('note("c4").pan(saw.range(0, 1).slow(1))');
    });

    test('a wave in vowel is ignored', () => {
        const wave = ext.wave({SHAPE: 'sine', MIN: 0, MAX: 1, CYCLES: 1});
        expect(codeOf(ext, [c4, ['effect', {EFFECT: 'vowel', VALUE: wave}]])).toBe('note("c4")');
    });

    test('P3 blocks compile', () => {
        const tracks = [
            // a single sound can be rested by chance, so use many
            [hh, ['fast', {TIMES: 16}], ['degradeBy', {PERCENT: 50}]],
            [c4, ['sometimes', {TRANSFORM: 'fast'}]],
            [bd, ['euclid', {PULSES: 5, STEPS: 8}]],
            [c4, ['jux', {TRANSFORM: 'up12'}]],
            [c4, ['off', {TRANSFORM: 'up7', TIME: '0.25'}]],
            [bd, ['chop', {PIECES: 4}]],
            [['chord', {ROOT: 'C4', CHORD: 'major'}], ['arp', {ORDER: '0 1 2 1'}]],
            [c4, ['effect', {EFFECT: 'gain', VALUE: ext.wave({SHAPE: 'perlin', MIN: 0, MAX: 1, CYCLES: 2})}]]
        ];
        tracks.map(steps => build(ext, steps))
            .forEach(n => expect([String(n), compile(n).queryArc(0, 1).length]).not.toEqual([String(n), 0]));
    });
});

describe('Strudel code of tracks', () => {
    const NO_TRACK = '// no track has been played. Click the green flag, then open strudel.cc.';

    test('playing tracks are written with setcpm and $:', async () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        ext.engine.init = vi.fn(() => Promise.resolve());
        ext.setBpm({BPM: 120});
        await playTrack(ext, 'drums', [['seq', {A: 'bd', B: 'hh', C: 'sd', D: 'hh'}]]);
        await playTrack(ext, 'melody', [['noteMenu', {NOTE: 'c4'}]]);
        expect(ext.strudelCode()).toBe([
            'setcpm(30)',
            '// track drums',
            '$: seq(s("bd"), s("hh"), s("sd"), s("hh"))',
            '// track melody',
            '$: note("c4")'
        ].join('\n'));
        ext.stopTrack({TRACK: 'drums'});
        expect(ext.strudelCode()).not.toContain('drums');
        ext.stopAll();
        expect(ext.strudelCode()).toBe(['setcpm(30)', NO_TRACK].join('\n'));
    });

    test('the code is kept after the stop sign and forgotten at the green flag', async () => {
        const runtime = makeRuntime();
        const ext = new blockClass(runtime);
        ext.engine.play = vi.fn(() => Promise.resolve());
        ext.engine.stopAll = vi.fn();
        await playTrack(ext, 'melody', [['noteMenu', {NOTE: 'c4'}]]);
        runtime.emit('PROJECT_STOP_ALL');
        expect(ext.engine.stopAll).toHaveBeenCalled();
        expect(ext.strudelCode()).toContain('$: note("c4")');
        // the green flag stops all, then starts
        runtime.emit('PROJECT_STOP_ALL');
        runtime.emit('PROJECT_START');
        expect(ext.strudelCode()).toBe(['setcpm(30)', NO_TRACK].join('\n'));
    });

    test('a track which ducks the others is written last', async () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        await playTrack(ext, 'kick', [['sMenu', {SOUND: 'bd'}], ['effect', {EFFECT: 'duck', VALUE: '2'}]]);
        await playTrack(ext, 'pad', [['noteMenu', {NOTE: 'c4'}]]);
        expect(ext.strudelCode().split('\n').filter(line => line.startsWith('$:'))).toEqual([
            '$: note("c4")',
            '$: s("bd").duck("2")'
        ]);
    });

    test('a track name can not break the code', async () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        await playTrack(ext, 'a\n$: evil()', [['sMenu', {SOUND: 'bd'}]]);
        expect(ext.strudelCode().split('\n').filter(line => line.startsWith('$:'))).toEqual(['$: s("bd")']);
    });

    test('sprite sounds are noted', async () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        await playTrack(ext, '1', [['s', {CODE: 'scratch_abc'}]]);
        expect(ext.strudelCode()).toMatch(/^\/\/ sounds of sprites/);
    });

    test('a pattern which fails to compile is not written', async () => {
        const ext = new blockClass(makeRuntime());
        await playTrack(ext, '1', [['s', {CODE: 'bd*99999'}]]);
        expect(ext.strudelCode()).toBe(['setcpm(30)', NO_TRACK].join('\n'));
    });

    test('strudel.cc is opened with the code in the hash', async () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        await playTrack(ext, '1', [['sMenu', {SOUND: 'bd'}]]);
        const open = vi.fn();
        globalThis.window = {open};
        ext.openStrudel();
        delete globalThis.window;
        const url = open.mock.calls[0][0];
        expect(url.startsWith('https://strudel.cc/#')).toBe(true);
        const {hash2code} = await import('@strudel/core');
        expect(hash2code(url.split('#')[1])).toBe(ext.strudelCode());
        expect(open.mock.calls[0][2]).toContain('noopener');
    });
});

describe('exported code can not be injected', () => {
    const makeExt = () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        return ext;
    };
    const liveLines = code => code.split(/\r\n|[\n\r\u2028\u2029]/).filter(line => !line.trim().startsWith('//'));
    const bd = [['sMenu', {SOUND: 'bd'}]];

    test.each([
        ['line separator', 'x\u2028fetch("//evil")//'],
        ['paragraph separator', 'x\u2029fetch("//evil")//'],
        ['carriage return', 'x\rfetch("//evil")//'],
        ['next line', 'x\u0085fetch("//evil")//'],
        ['block comment end', 'x */ fetch("//evil") /*']
    ])('a track name with %s stays in the comment', async (_, track) => {
        const ext = makeExt();
        await playTrack(ext, track, bd);
        const code = ext.strudelCode();
        expect(liveLines(code)).toEqual(['setcpm(30)', '$: s("bd")']);
        expect(code).not.toMatch(/[\u2028\u2029\r\u0085]/);
    });

    test('a long track name is cut', async () => {
        const ext = makeExt();
        await playTrack(ext, 'a'.repeat(500), bd);
        expect(ext.strudelCode().split('\n')[1].length).toBeLessThan(60);
    });

    test('a track which fails to play is not written', async () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.reject(new Error('no audio')));
        await playTrack(ext, '1', bd);
        expect(ext.strudelCode()).not.toContain('$:');
    });
});

describe('add, superimpose, acid and trance gate blocks', () => {
    const ext = new blockClass(makeRuntime());
    const c4 = ['note', {CODE: 'c4'}];

    test.each([
        [[c4, ['add', {VALUE: '<0 3>'}]], 'note("c4").add(note("<0 3>"))'],
        [[c4, ['add', {VALUE: '99'}]], 'note("c4").add(note(48))'],
        [[c4, ['superimpose', {TRANSFORM: 'up7'}]], 'note("c4").superimpose(x => x.transpose(7))'],
        [[c4, ['acidenv', {AMOUNT: 0.5}]], 'note("c4").s("sawtooth").lpf(100).lpenv(4.5).lps(0.2).lpd(0.12).lpq(2)'],
        [[c4, ['effect', {EFFECT: 'lpq', VALUE: '99'}]], 'note("c4").lpq(30)'],
        [[c4, ['trancegate', {DENSITY: 2, SEED: 3.4, LENGTH: 0}]], 'note("c4").struct(rand.mul(1.5).round().seg(16).rib(3, 1)).fillGaps().clip(0.7)'],
        [[c4, ['effect', {EFFECT: 'delayfeedback', VALUE: '3'}]], 'note("c4").delayfeedback(0.95)'],
        [[c4, ['effect', {EFFECT: 'clip', VALUE: '.5'}]], 'note("c4").clip(".5")']
    ])('%j', (steps, code) => {
        expect(codeOf(ext, steps)).toBe(code);
    });

    test('add before scale adds steps', () => {
        expect(codeOf(ext, [
            ['n', {CODE: '0 2 4'}],
            ['add', {VALUE: '<0 1>'}],
            ['scale', {ROOT: 'C', SCALE: 'minor'}]
        ])).toBe('n("0 2 4").add(n("<0 1>")).scale("C:minor")');
    });

    test('new blocks compile', () => {
        [
            [c4, ['add', {VALUE: '0,7'}]],
            [c4, ['superimpose', {TRANSFORM: 'fast'}]],
            [['note', {CODE: 'c2*8'}], ['acidenv', {AMOUNT: 1}]],
            [c4, ['s', {CODE: 'supersaw'}], ['trancegate', {DENSITY: 0.5, SEED: 1, LENGTH: 2}]]
        ].forEach(steps => expect(compile(build(ext, steps)).queryArc(0, 1).length).toBeGreaterThan(0));
    });

    test('adding to drums is not played', async () => {
        const e = new blockClass(makeRuntime());
        e.engine.play = vi.fn(() => Promise.resolve());
        await playTrack(e, '1', [['sMenu', {SOUND: 'bd'}], ['add', {VALUE: '1'}]]);
        expect(e.engine.play).not.toHaveBeenCalled();
    });
});

describe('ducking, noise and thickness blocks', () => {
    const ext = new blockClass(makeRuntime());
    const c4 = ['note', {CODE: 'c4'}];
    const c2 = ['note', {CODE: 'c2'}];

    test.each([
        [[c4, ['effect', {EFFECT: 'unison', VALUE: '20'}]], 'note("c4").unison(8)'],
        [[c4, ['effect', {EFFECT: 'detune', VALUE: '.4'}]], 'note("c4").detune(".4")'],
        [[c4, ['effect', {EFFECT: 'spread', VALUE: '2'}]], 'note("c4").spread(1)'],
        [[['sMenu', {SOUND: 'white'}], ['fast', {TIMES: 16}]], 's("white").fast(16)'],
        [[c2, ['effect', {EFFECT: 'distort', VALUE: '2.2'}]], 'note("c2").distort(2.2).distortvol(0.3)'],
        [[c2, ['effect', {EFFECT: 'distort', VALUE: '50'}]], 'note("c2").distort(10).distortvol(0.3)'],
        [[c2, ['effect', {EFFECT: 'fm', VALUE: '2'}]], 'note("c2").fm(2)'],
        [[['sMenu', {SOUND: 'sbd'}], ['fast', {TIMES: 4}]], 's("sbd").fast(4)']
    ])('%j', (steps, code) => {
        expect(codeOf(ext, steps)).toBe(code);
    });

    test.each([
        [{MIN: -7, MAX: 2, STEPS: 16, SEED: 46, LENGTH: 1}, 'n(irand(10).add(-7).seg(16).rib(46, 1))'],
        [{MIN: 5, MAX: -1.4, STEPS: 999, SEED: -3, LENGTH: 0}, 'n(irand(7).add(-1).seg(64).rib(0, 1))']
    ])('random steps %j', (args, code) => {
        expect(String(ext.randomSteps(args))).toBe(code);
    });

    test('random steps are steps of n', () => {
        const steps = ext.randomSteps({MIN: -7, MAX: 2, STEPS: 16, SEED: 46, LENGTH: 1});
        expect(codeOf(ext, [['n', {CODE: steps}], ['scale', {ROOT: 'C4', SCALE: 'minor'}]]))
            .toBe('n(irand(10).add(-7).seg(16).rib(46, 1)).scale("C4:minor")');
    });

    test('noise is in the sound dropdowns', () => {
        expect(MENUS.sound.items.some(item => item[0] === 'white')).toBe(true);
        expect(MENUS.sName.items.some(item => item[0] === 'white')).toBe(true);
    });

    test.each([
        [{EFFECT: 'duck', VALUE: '2'}, 's("bd").duck("2")'],
        [{EFFECT: 'duck', VALUE: '2:3:4'}, 's("bd").duck("2:3:4")'],
        [{EFFECT: 'duckattack', VALUE: '.2'}, 's("bd").duckattack(".2")'],
        [{EFFECT: 'duckdepth', VALUE: '5'}, 's("bd").duckdepth(1)'],
        [{EFFECT: 'orbit', VALUE: '2.6'}, 's("bd").orbit(3)'],
        [{EFFECT: 'orbit', VALUE: '99'}, 's("bd").orbit(8)']
    ])('the duck effects %j', (args, code) => {
        expect(codeOf(ext, [['s', {CODE: 'bd'}], ['effect', args]])).toBe(code);
    });

    test('the duck effects compile as in Strudel', () => {
        const n = build(ext, [
            ['s', {CODE: 'bd'}],
            ['effect', {EFFECT: 'duck', VALUE: '2:3'}],
            ['effect', {EFFECT: 'duckdepth', VALUE: '.8'}]
        ]);
        expect(compile(n).queryArc(0, 1)[0].value).toMatchObject({s: 'bd', duckorbit: [2, 3], duckdepth: 0.8});
    });
});

describe('list and rhythm blocks', () => {
    const ext = new blockClass(makeRuntime());
    const lists = {
        chords: ['[f3,a3,c4,e4]', '[e3,g3,b3,d4] [g3,a3,c#4,e4]', '', '  '],
        empty: []
    };
    const util = {target: {lookupVariableByNameAndType: (name, type) => (
        type === 'list' && Object.prototype.hasOwnProperty.call(lists, name) ? {value: lists[name]} : null
    )}};

    test.each([
        ['cycle', '<[[f3,a3,c4,e4]] [[e3,g3,b3,d4] [g3,a3,c#4,e4]]>'],
        ['seq', '[[f3,a3,c4,e4]] [[e3,g3,b3,d4] [g3,a3,c#4,e4]]'],
        ['stack', '[[f3,a3,c4,e4]], [[e3,g3,b3,d4] [g3,a3,c#4,e4]]'],
        ['unknown', '<[[f3,a3,c4,e4]] [[e3,g3,b3,d4] [g3,a3,c#4,e4]]>']
    ])('items %s', (how, code) => {
        expect(ext.listMini({LISTNAME: 'chords', HOW: how}, util)).toBe(code);
    });

    test('a missing or empty list is an empty text', () => {
        expect(ext.listMini({LISTNAME: 'empty', HOW: 'cycle'}, util)).toBe('');
        expect(ext.listMini({LISTNAME: 'nothing', HOW: 'cycle'}, util)).toBe('');
        expect(ext.listMini({LISTNAME: 'chords', HOW: 'cycle'}, {})).toBe('');
    });

    test('an empty text of mini-notation is a rest', () => {
        expect(codeOf(ext, [['note', {CODE: ''}]])).toBe('silence');
        expect(codeOf(ext, [['s', {CODE: '  '}]])).toBe('silence');
        expect(codeOf(ext, [['n', {CODE: ''}]])).toBe('silence');
    });

    test('an empty s or a rest below notes keeps the notes', () => {
        expect(codeOf(ext, [['note', {CODE: 'c4'}], ['s', {CODE: ''}]])).toBe('note("c4")');
        expect(codeOf(ext, [['note', {CODE: 'c4'}], ['sMenu', {SOUND: '~'}]])).toBe('note("c4")');
    });

    test('a list is played as notes', () => {
        const n = build(ext, [['note', {CODE: ext.listMini({LISTNAME: 'chords', HOW: 'cycle'}, util)}]]);
        expect(compile(n).queryArc(0, 1).map(hap => hap.value.note)).toEqual(['f3', 'a3', 'c4', 'e4']);
    });

    test('struct plays the pattern on the rhythm', () => {
        const n = build(ext, [['note', {CODE: '[c3,e3]'}], ['struct', {RHYTHM: '[x ~ ~] [~ ~ x]'}]]);
        expect(String(n)).toBe('note("[c3,e3]").struct("[x ~ ~] [~ ~ x]")');
        const haps = compile(n).queryArc(0, 1);
        expect(haps).toHaveLength(4);
        expect(haps.map(hap => hap.whole.begin.valueOf()).sort()).toEqual([0, 0, 5 / 6, 5 / 6]);
    });

    test('beat plays the sound on the steps', () => {
        const n = build(ext, [['s', {CODE: 'bd'}], ['beat', {BEATS: ' 0,7,10 ', STEPS: 16}]]);
        expect(String(n)).toBe('s("bd").beat("0,7,10", 16)');
        expect(compile(n).queryArc(0, 1).map(hap => hap.whole.begin.valueOf() * 16)).toEqual([0, 7, 10]);
    });

    test('beat drops a step with ? sometimes', () => {
        const n = build(ext, [['s', {CODE: 'bd'}], ['beat', {BEATS: '0,7?,10', STEPS: 16}]]);
        const steps = c => compile(n).queryArc(c, c + 1).map(hap => (hap.whole.begin.valueOf() - c) * 16);
        const all = [0, 1, 2, 3].map(steps);
        all.forEach(s => {
            expect(s).toEqual(expect.arrayContaining([0, 10]));
        });
        expect(all.some(s => s.includes(7))).toBe(true);
        expect(all.some(s => !s.includes(7))).toBe(true);
    });

    test.each([[0, 1], [100, 64], [7.6, 8]])('beat in %j steps uses %j steps', (steps, used) => {
        expect(codeOf(ext, [['s', {CODE: 'bd'}], ['beat', {BEATS: '0', STEPS: steps}]])).toBe(`s("bd").beat("0", ${used})`);
    });

    test.each(['0, evil()', 'x ~ x', '0; alert(1)', '0*100'])('beat steps %j are not played', beats => {
        expect(() => compile(build(ext, [['s', {CODE: 'bd'}], ['beat', {BEATS: beats, STEPS: 16}]]))).toThrow();
    });

    test('note and n below the top are methods, in the order of Strudel code', () => {
        const n = build(ext, [['s', {CODE: 'supersaw!8'}], ['note', {CODE: '<C# f d# [d# a#2]>/2'}],
            ['add', {VALUE: '-12'}]]);
        expect(String(n)).toBe('s("supersaw!8").note("<C# f d# [d# a#2]>/2").add(note(-12))');
        const original = s(mini('supersaw!8')).note(mini('<C# f d# [d# a#2]>/2').sub(12));
        const events = p => p.queryArc(0, 8).map(hap => [hap.whole.begin.valueOf(), hap.value.s, hap.value.note]);
        expect(events(compile(n))).toEqual(events(original));
        expect(codeOf(ext, [['s', {CODE: 'piano'}], ['n', {CODE: '0 2'}], ['scale', {ROOT: 'C4', SCALE: 'major'}]]))
            .toBe('s("piano").n("0 2").scale("C4:major")');
    });

    test('s below the top takes mini-notation, such as sd:2', () => {
        const n = build(ext, [['note', {CODE: 'c3 e3'}], ['s', {CODE: 'sd:2 <hh:1 hh:2>'}]]);
        expect(String(n)).toBe('note("c3 e3").s("sd:2 <hh:1 hh:2>")');
        expect(compile(n).queryArc(0, 1).map(hap => [hap.value.s, hap.value.n])).toEqual([['sd', 2], ['hh', 1]]);
    });

    test('a rest below the top does not change the pattern', () => {
        expect(codeOf(ext, [['s', {CODE: 'bd'}], ['note', {CODE: '~'}], ['n', {CODE: ' '}]])).toBe('s("bd")');
    });

    test('the drum kit block changes the kit of the engine, and ignores unknown kits', async () => {
        const e = new blockClass(makeRuntime());
        e.engine.setDrumKit = vi.fn(() => Promise.resolve());
        await e.setDrumKit({KIT: 'synth'});
        e.setDrumKit({KIT: 'evil'});
        expect(e.engine.setDrumKit.mock.calls).toEqual([['synth']]);
    });

    test('stack plays the chain in it with the chain above, and a method below is on all', () => {
        const n = build(ext, [
            ['s', {CODE: 'bd:1'}], ['beat', {BEATS: '0,7?,10', STEPS: 16}],
            ['stackBranch', {}, [['s', {CODE: 'sd:2'}], ['beat', {BEATS: '4,12', STEPS: 16}]]],
            ['stackBranch', {}, [['s', {CODE: 'hh:4!8'}]]],
            ['fast', {TIMES: 2}]
        ]);
        expect(String(n)).toBe('stack(s("bd:1").beat("0,7?,10", 16), s("sd:2").beat("4,12", 16), ' +
            's("hh:4!8")).fast(2)');
        const sounds = compile(n).queryArc(0, 0.5).map(hap => hap.value.s);
        expect(sounds.filter(x => x === 'sd')).toHaveLength(2);
        expect(sounds.filter(x => x === 'hh')).toHaveLength(8);
    });

    test('stack at the top of a track is the chain in it', () => {
        expect(codeOf(ext, [['stackBranch', {}, [['s', {CODE: 'bd'}]]], ['fast', {TIMES: 2}]])).toBe('s("bd").fast(2)');
    });

    test('an empty stack does not change the track', () => {
        expect(codeOf(ext, [['s', {CODE: 'bd'}], ['stackBranch', {}, []]])).toBe('s("bd")');
    });

    test('a stack below a method keeps the method on the chain above only', () => {
        expect(codeOf(ext, [['s', {CODE: 'bd'}], ['fast', {TIMES: 2}], ['stackBranch', {}, [['s', {CODE: 'hh'}]]]]))
            .toBe('stack(s("bd").fast(2), s("hh"))');
    });

    test('stack in stack is a stack in the inner chain', () => {
        expect(codeOf(ext, [['s', {CODE: 'bd'}], ['stackBranch', {}, [
            ['s', {CODE: 'sd'}], ['stackBranch', {}, [['s', {CODE: 'hh'}]]], ['fast', {TIMES: 2}]
        ]]])).toBe('stack(s("bd"), stack(s("sd"), s("hh")).fast(2))');
    });

    test('stack outside a track does nothing', () => {
        const util = makeUtil();
        ext.stackBranch({}, util);
        expect(util.branches).toBe(0);
    });

    test('a track with stacks plays and exports the code', async () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        ext.engine.init = vi.fn(() => Promise.resolve());
        await playTrack(ext, 'drums', [
            ['s', {CODE: 'bd'}], ['stackBranch', {}, [['s', {CODE: 'sd'}]]]
        ]);
        expect(ext.strudelCode()).toContain('$: stack(s("bd"), s("sd"))');
        expect(ext.engine.play).toHaveBeenCalledTimes(1);
    });

    test.each(['x evil()', 'note("a")', 'x; alert(1)'])('a rhythm %j is not played', rhythm => {
        expect(() => compile(build(ext, [['note', {CODE: 'c4'}], ['struct', {RHYTHM: rhythm}]]))).toThrow();
    });

    test('lists of the sprite and the stage are in the menu', () => {
        const e = new blockClass(Object.assign(makeRuntime(), {
            getEditingTarget: () => ({variables: {a: {type: 'list', name: 'chords'}, b: {type: '', name: 'x'}}}),
            getTargetForStage: () => ({variables: {c: {type: 'list', name: 'melody'}, d: {type: 'list', name: 'chords'}}})
        }));
        expect(e.getListMenu()).toEqual(['chords', 'melody']);
        expect(new blockClass(makeRuntime()).getListMenu()).toEqual(['']);
    });
});

describe('sample maps are loaded when a pattern needs them', () => {
    const make = () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        ext.loadBank = vi.fn(() => Promise.resolve());
        return ext;
    };
    const piano = [['noteMenu', {NOTE: 'c4'}], ['s', {CODE: 'piano'}]];

    test.each([
        ['a drum machine', [['s', {CODE: 'bd sd'}], ['bank', {MACHINE: 'RolandTR909'}]], ['drums']],
        ['the piano', piano, ['piano']],
        ['Dirt-Samples', [['s', {CODE: 'casio:1 jazz'}]], ['dirt']],
        ['VCSL', [['s', {CODE: 'marimba kalimba'}]], ['vcsl']],
        ['built-in sounds only', [['s', {CODE: 'bd hh'}], ['sMenu', {SOUND: 'sawtooth'}]], []],
        ['notes', [['note', {CODE: 'c4 e4'}]], []]
    ])('%s', async (_, steps, banks) => {
        const ext = make();
        await playTrack(ext, '1', steps);
        expect(ext.loadBank.mock.calls.map(c => c[0]).sort()).toEqual(banks);
        expect(ext.engine.play).toHaveBeenCalled();
    });

    test('a failed load still plays', async () => {
        const ext = make();
        ext.loadBank = vi.fn(() => Promise.reject(new Error('offline')));
        await playTrack(ext, '1', piano);
        expect(ext.engine.play).toHaveBeenCalled();
    });

    test('stopping while loading cancels the play', async () => {
        const ext = make();
        let finish;
        ext.loadBank = vi.fn(() => new Promise(resolve => {
            finish = resolve;
        }));
        const playing = playTrack(ext, '1', piano);
        ext.stopAll();
        finish();
        await playing;
        expect(ext.engine.play).not.toHaveBeenCalled();
    });
});

describe('exported code with the trance gate', () => {
    test('defines fillGaps first', async () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        ext.loadBank = vi.fn(() => Promise.resolve());
        await playTrack(ext, 'pad', [['noteMenu', {NOTE: 'c4'}], ['trancegate', {DENSITY: 0.5, SEED: 1, LENGTH: 1}]]);
        const lines = ext.strudelCode().split('\n');
        expect(lines[2].startsWith("register('fillGaps'")).toBe(true);
        expect(lines[lines.length - 1]).toContain('.fillGaps().clip(0.7)');
    });

    test('does not define fillGaps without the trance gate', async () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        await playTrack(ext, '1', [['sMenu', {SOUND: 'bd'}]]);
        expect(ext.strudelCode()).not.toContain('fillGaps');
    });
});

describe('races while loading samples', () => {
    const make = () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        return ext;
    };
    const piano = [['noteMenu', {NOTE: 'c4'}], ['s', {CODE: 'piano'}]];

    test('stopping the track while loading cancels the play', async () => {
        const ext = make();
        let finish;
        ext.loadBank = vi.fn(() => new Promise(resolve => {
            finish = resolve;
        }));
        const playing = playTrack(ext, 'p', piano);
        ext.stopTrack({TRACK: 'p'});
        finish();
        await playing;
        expect(ext.engine.play).not.toHaveBeenCalled();
    });

    test('a later play of the same track wins over a slower load', async () => {
        const ext = make();
        let finishSlow;
        ext.loadBank = vi.fn(() => new Promise(resolve => {
            finishSlow = resolve;
        }));
        const slow = playTrack(ext, 'p', piano);
        ext.loadBank = vi.fn(() => Promise.resolve());
        await playTrack(ext, 'p', [['sMenu', {SOUND: 'bd'}]]);
        finishSlow();
        await slow;
        expect(ext.engine.play).toHaveBeenCalledTimes(1);
        expect(ext.strudelCode()).toContain('$: s("bd")');
    });

    test('the definition of fillGaps is added only for the trance gate', async () => {
        const ext = make();
        await playTrack(ext, '1', [['note', {CODE: 'c4'}]]);
        await playTrack(ext, '2', [['s', {CODE: 'a).fillGaps()'}]]);
        expect(ext.strudelCode()).not.toContain("register('fillGaps'");
    });
});
