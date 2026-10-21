import {blockClass} from '../../src/vm/extensions/block/index.js';
import {BLOCKS, LEVEL, MENUS, levelOf} from '../../src/vm/extensions/block/blocks.js';
import {compile} from '../../src/core/ast.js';
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
        expect(infoOf(ext, 'repeat').hideFromPalette).toBe(false);
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
        const before = infoOf(ext, 'repeat').text;
        ext.setLevel({LEVEL: '3'});
        expect(infoOf(ext, 'repeat').text).toBe(before);
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
            });
    });

    test('loading a project shows the blocks which it uses', () => {
        const target = {blocks: {_blocks: {
            a: {opcode: 'strudel_playTrack'},
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
        expect(levelOf('playTrack')).toBe(LEVEL.BEGINNER);
        expect(levelOf('unknown')).toBe(0);
    });
});

describe('pattern blocks', () => {
    const ext = new blockClass(makeRuntime());

    test.each([
        ['sequence', {A: 'bd', B: 'sd', C: '', D: 'hh'}, 'seq(s("bd"), s("sd"), s("hh"))'],
        ['together', {A: 'bd sd', B: 'hh*4'}, 'stack(s("bd sd"), s("hh*4"))'],
        ['alternate', {A: 'c4', B: 'e4'}, 'cat(note("c4"), note("e4"))'],
        ['repeat', {PATTERN: 'hh', TIMES: '4'}, 's("hh").fast(4)'],
        ['slow', {PATTERN: 'c e', CYCLES: 2}, 'note("c e").slow(2)'],
        ['tone', {PATTERN: 'c e', SYNTH: 'square'}, 'note("c e").s("square")']
    ])('%s', (opcode, args, code) => {
        expect(String(ext[opcode](args))).toBe(code);
    });

    test('blocks can be nested', () => {
        const kick = ext.repeat({PATTERN: 'bd', TIMES: 4});
        const melody = ext.tone({PATTERN: 'c4', SYNTH: 'sine'});
        expect(String(ext.together({A: kick, B: melody})))
            .toBe('stack(s("bd").fast(4), note("c4").s("sine"))');
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
        ['repeat', {PATTERN: 'hh', TIMES: 1e9}, 's("hh").fast(64)'],
        ['repeat', {PATTERN: 'hh', TIMES: -3}, 's("hh").fast(0)'],
        ['slow', {PATTERN: 'c', CYCLES: 0}, 'note("c").slow(0.01)'],
        ['slow', {PATTERN: 'c', CYCLES: 'Infinity'}, 'note("c").slow(1024)']
    ])('%s %j', (opcode, args, code) => {
        expect(String(ext[opcode](args))).toBe(code);
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

    test.each([
        ['miniSound', {CODE: 'bd*2 c4'}, 's("bd*2 c4")'],
        ['miniNote', {CODE: 'c3 e3'}, 'note("c3 e3")'],
        ['scaleNotes', {STEPS: '0 2 4', ROOT: 'D4', SCALE: 'minor:pentatonic'}, 'n("0 2 4").scale("D4:minor:pentatonic")'],
        ['effect', {PATTERN: 'c e', EFFECT: 'lpf', VALUE: '800'}, 'note("c e").lpf(800)'],
        ['effect', {PATTERN: 'c e', EFFECT: 'lpf', VALUE: '5'}, 'note("c e").lpf(20)'],
        ['effect', {PATTERN: 'c e', EFFECT: 'room', VALUE: '800'}, 'note("c e").room(10)'],
        ['effect', {PATTERN: 'c e', EFFECT: 'pan', VALUE: '0 1'}, 'note("c e").pan("0 1")'],
        ['reverse', {PATTERN: 'c e'}, 'note("c e").rev()'],
        ['ply', {PATTERN: 'bd', TIMES: 100}, 's("bd").ply(8)'],
        ['every', {CYCLES: 4, TRANSFORM: 'fast', PATTERN: 'c e'}, 'note("c e").every(4, x => x.fast(2))'],
        ['every', {CYCLES: 0, TRANSFORM: 'evil', PATTERN: 'c e'}, 'note("c e").every(1, x => x.rev())'],
        ['every', {CYCLES: 2, TRANSFORM: 'constructor', PATTERN: 'c e'}, 'note("c e").every(2, x => x.rev())'],
        ['effect', {PATTERN: 'c e', EFFECT: 'vowel', VALUE: '<a o>'}, 'note("c e").vowel("<a o>")'],
        ['effect', {PATTERN: 'bd', EFFECT: 'speed', VALUE: '-9'}, 's("bd").speed(-4)'],
        ['drumMachine', {PATTERN: 'bd sd', MACHINE: 'RolandTR808'}, 's("bd sd").bank("RolandTR808")']
    ])('%s %j', (opcode, args, code) => {
        expect(String(ext[opcode](args))).toBe(code);
    });

    test('an unknown effect keeps the pattern', () => {
        expect(String(ext.effect({PATTERN: 'c e', EFFECT: 'constructor', VALUE: '1'}))).toBe('note("c e")');
    });

    test.each(MENUS.scale.items.map(([v]) => v))('scale %s makes notes', scale => {
        const pattern = compile(ext.scaleNotes({STEPS: '0 1 2', ROOT: 'C4', SCALE: scale}));
        const notes = pattern.queryArc(0, 1).map(hap => hap.value.note);
        expect(notes.every(n => typeof n !== 'undefined')).toBe(true);
    });

    test('a sprite sound becomes a sample', () => {
        const sound = {name: 'meow', assetId: 'abc123def456789', dataFormat: 'wav', asset: {data: new Uint8Array(4)}};
        const util = {target: {sprite: {sounds: [sound]}}};
        expect(String(ext.spriteSound({SOUND: 'meow'}, util))).toBe('s("scratch_abc123def456")');
        expect(ext.spriteSounds.urls).toHaveLength(1);
        ext.spriteSound({SOUND: 'meow'}, util);
        expect(ext.spriteSounds.urls).toHaveLength(1);
    });

    test('a missing sprite sound is silence', () => {
        expect(String(ext.spriteSound({SOUND: 'none'}, {target: {sprite: {sounds: []}}}))).toBe('silence');
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
    test('pattern slots of the beginner level are dropdowns, not text', () => {
        const patternSlots = blockDefs.filter(b => b.level === LEVEL.BEGINNER)
            .flatMap(b => Object.entries(b.arguments || {}))
            .filter(([name]) => ['PATTERN', 'A', 'B', 'C', 'D'].includes(name));
        expect(patternSlots.length).toBeGreaterThan(0);
        patternSlots.forEach(([, arg]) => expect(arg.menu).toBe('sound'));
    });

    test('the sound menu accepts pattern blocks', () => {
        expect(MENUS.sound.acceptReporters).toBe(true);
    });

    test('the sound menu has drums, notes and a rest', () => {
        const values = MENUS.sound.items.map(([value]) => value);
        expect(values).toEqual(expect.arrayContaining(['bd', 'sd', 'hh', 'c4', 'g4', '~']));
    });

    test('items of the sound menu become sounds, notes and a rest', () => {
        const ext = new blockClass(makeRuntime());
        expect(String(ext.sequence({A: 'bd', B: 'c4', C: '~', D: 'hh'})))
            .toBe('seq(s("bd"), note("c4"), silence, s("hh"))');
        const events = compile(ext.sequence({A: 'bd', B: '~', C: '~', D: 'hh'})).queryArc(0, 1);
        expect(events.map(hap => hap.value.s)).toEqual(['bd', 'hh']);
    });

    test('the menu is shown in each language', () => {
        const ja = new blockClass(makeRuntime());
        const items = ja.getInfo().menus.sound.items.map(item => item.text);
        expect(items).toEqual(expect.arrayContaining(['bass drum', 'C', 'rest']));
    });
});

describe('P3 blocks', () => {
    const ext = new blockClass(makeRuntime());

    test.each([
        ['degrade', {PATTERN: 'hh', PERCENT: 30}, 's("hh").degradeBy(0.3)'],
        ['degrade', {PATTERN: 'hh', PERCENT: 300}, 's("hh").degradeBy(1)'],
        ['sometimes', {PATTERN: 'c4', TRANSFORM: 'up12'}, 'note("c4").sometimes(x => x.transpose(12))'],
        ['euclid', {PATTERN: 'bd', PULSES: 3, STEPS: 8}, 's("bd").euclid(3, 8)'],
        ['euclid', {PATTERN: 'bd', PULSES: 20, STEPS: 8}, 's("bd").euclid(8, 8)'],
        ['jux', {PATTERN: 'c4', TRANSFORM: 'rev'}, 'note("c4").jux(x => x.rev())'],
        ['off', {PATTERN: 'c4', TRANSFORM: 'up7', TIME: '0.125'}, 'note("c4").off(0.125, x => x.transpose(7))'],
        ['chop', {PATTERN: 'bd', PIECES: 99}, 's("bd").chop(16)'],
        ['transpose', {PATTERN: 'c4', SEMITONES: -50}, 'note("c4").transpose(-24)'],
        ['chord', {ROOT: 'C4', CHORD: 'major'}, 'note("[c4,e4,g4]")'],
        ['chord', {ROOT: 'A3', CHORD: 'minor7'}, 'note("[a3,c4,e4,g4]")'],
        ['chord', {ROOT: 'D4', CHORD: 'constructor'}, 'note("[d4,f#4,a4]")'],
        ['arp', {PATTERN: 'c4', ORDER: '0 1 2'}, 'note("c4").arp("0 1 2")']
    ])('%s %j', (opcode, args, code) => {
        expect(String(ext[opcode](args))).toBe(code);
    });

    test('a wave goes into an effect', () => {
        const wave = ext.wave({SHAPE: 'sine', MIN: 200, MAX: 2000, CYCLES: 4});
        expect(String(ext.effect({PATTERN: 'c4', EFFECT: 'lpf', VALUE: wave})))
            .toBe('note("c4").lpf(sine.range(200, 2000).slow(4))');
    });

    test('a wave is kept in the range of the effect', () => {
        const wave = ext.wave({SHAPE: 'saw', MIN: -5, MAX: 99, CYCLES: 1});
        expect(String(ext.effect({PATTERN: 'c4', EFFECT: 'pan', VALUE: wave})))
            .toBe('note("c4").pan(saw.range(0, 1).slow(1))');
    });

    test('a wave in vowel is ignored', () => {
        const wave = ext.wave({SHAPE: 'sine', MIN: 0, MAX: 1, CYCLES: 1});
        expect(String(ext.effect({PATTERN: 'c4', EFFECT: 'vowel', VALUE: wave}))).toBe('note("c4")');
    });

    test('P3 blocks compile', () => {
        const blocks = [
            // a single sound can be rested by chance, so use many
            ext.degrade({PATTERN: ext.repeat({PATTERN: 'hh', TIMES: 16}), PERCENT: 50}),
            ext.sometimes({PATTERN: 'c4', TRANSFORM: 'fast'}),
            ext.euclid({PATTERN: 'bd', PULSES: 5, STEPS: 8}),
            ext.jux({PATTERN: 'c4', TRANSFORM: 'up12'}),
            ext.off({PATTERN: 'c4', TRANSFORM: 'up7', TIME: '0.25'}),
            ext.chop({PATTERN: 'bd', PIECES: 4}),
            ext.arp({PATTERN: ext.chord({ROOT: 'C4', CHORD: 'major'}), ORDER: '0 1 2 1'}),
            ext.effect({PATTERN: 'c4', EFFECT: 'gain', VALUE: ext.wave({SHAPE: 'perlin', MIN: 0, MAX: 1, CYCLES: 2})})
        ];
        blocks.forEach(n => expect([String(n), compile(n).queryArc(0, 1).length]).not.toEqual([String(n), 0]));
    });
});

describe('Strudel code of tracks', () => {
    test('playing tracks are written with setcpm and $:', async () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        ext.engine.init = vi.fn(() => Promise.resolve());
        ext.setBpm({BPM: 120});
        await ext.playTrack({PATTERN: ext.sequence({A: 'bd', B: 'hh', C: 'sd', D: 'hh'}), TRACK: 'drums'});
        await ext.playTrack({PATTERN: 'c4', TRACK: 'melody'});
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
        expect(ext.strudelCode()).toBe('setcpm(30)');
    });

    test('a track name can not break the code', async () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        await ext.playTrack({PATTERN: 'bd', TRACK: 'a\n$: evil()'});
        expect(ext.strudelCode().split('\n').filter(line => line.startsWith('$:'))).toEqual(['$: s("bd")']);
    });

    test('sprite sounds are noted', async () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        await ext.playTrack({PATTERN: 'scratch_abc', TRACK: '1'});
        expect(ext.strudelCode()).toMatch(/^\/\/ sounds of sprites/);
    });

    test('a pattern which fails to compile is not written', async () => {
        const ext = new blockClass(makeRuntime());
        await ext.playTrack({PATTERN: 'bd*99999', TRACK: '1'});
        expect(ext.strudelCode()).toBe('setcpm(30)');
    });

    test('strudel.cc is opened with the code in the hash', async () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        await ext.playTrack({PATTERN: 'bd', TRACK: '1'});
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

    test.each([
        ['line separator', 'x\u2028fetch("//evil")//'],
        ['paragraph separator', 'x\u2029fetch("//evil")//'],
        ['carriage return', 'x\rfetch("//evil")//'],
        ['next line', 'x\u0085fetch("//evil")//'],
        ['block comment end', 'x */ fetch("//evil") /*']
    ])('a track name with %s stays in the comment', async (_, track) => {
        const ext = makeExt();
        await ext.playTrack({PATTERN: 'bd', TRACK: track});
        const code = ext.strudelCode();
        expect(liveLines(code)).toEqual(['setcpm(30)', '$: s("bd")']);
        expect(code).not.toMatch(/[\u2028\u2029\r\u0085]/);
    });

    test('a long track name is cut', async () => {
        const ext = makeExt();
        await ext.playTrack({PATTERN: 'bd', TRACK: 'a'.repeat(500)});
        expect(ext.strudelCode().split('\n')[1].length).toBeLessThan(60);
    });

    test('a track which fails to play is not written', async () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.reject(new Error('no audio')));
        await ext.playTrack({PATTERN: 'bd', TRACK: '1'});
        expect(ext.strudelCode()).toBe('setcpm(30)');
    });
});

describe('add, superimpose, acid and trance gate blocks', () => {
    const ext = new blockClass(makeRuntime());

    test.each([
        ['addNotes', {PATTERN: 'c4', VALUE: '<0 3>'}, 'note("c4").add(note("<0 3>"))'],
        ['addNotes', {PATTERN: 'c4', VALUE: '99'}, 'note("c4").add(note(48))'],
        ['superimpose', {PATTERN: 'c4', TRANSFORM: 'up7'}, 'note("c4").superimpose(x => x.transpose(7))'],
        ['acid', {PATTERN: 'c4', AMOUNT: 0.5}, 'note("c4").s("sawtooth").lpf(100).lpenv(4.5).lps(0.2).lpd(0.12).lpq(2)'],
        ['effect', {PATTERN: 'c4', EFFECT: 'lpq', VALUE: '99'}, 'note("c4").lpq(30)'],
        ['trancegate', {PATTERN: 'c4', DENSITY: 2, SEED: 3.4, LENGTH: 0}, 'note("c4").struct(rand.mul(1.5).round().seg(16).rib(3, 1)).fillGaps().clip(0.7)'],
        ['effect', {PATTERN: 'c4', EFFECT: 'delayfeedback', VALUE: '3'}, 'note("c4").delayfeedback(0.95)'],
        ['effect', {PATTERN: 'c4', EFFECT: 'clip', VALUE: '.5'}, 'note("c4").clip(".5")']
    ])('%s %j', (opcode, args, code) => {
        expect(String(ext[opcode](args))).toBe(code);
    });

    test('the add block in the scale block adds steps', () => {
        const steps = ext.addNotes({PATTERN: ext.miniNote({CODE: '0 2 4'}), VALUE: '<0 1>'});
        expect(String(ext.scaleNotes({STEPS: steps, ROOT: 'C', SCALE: 'minor'})))
            .toBe('n("0 2 4").add(n("<0 1>")).scale("C:minor")');
    });

    test('new blocks compile', () => {
        [
            ext.addNotes({PATTERN: 'c4', VALUE: '0,7'}),
            ext.superimpose({PATTERN: 'c4', TRANSFORM: 'fast'}),
            ext.acid({PATTERN: ext.miniNote({CODE: 'c2*8'}), AMOUNT: 1}),
            ext.trancegate({PATTERN: ext.tone({PATTERN: 'c4', SYNTH: 'supersaw'}), DENSITY: 0.5, SEED: 1, LENGTH: 2})
        ].forEach(n => expect(compile(n).queryArc(0, 1).length).toBeGreaterThan(0));
    });

    test('adding to drums is not played', async () => {
        const e = new blockClass(makeRuntime());
        e.engine.play = vi.fn(() => Promise.resolve());
        await e.playTrack({PATTERN: e.addNotes({PATTERN: 'bd', VALUE: '1'}), TRACK: '1'});
        expect(e.engine.play).not.toHaveBeenCalled();
    });
});

describe('sample maps are loaded when a pattern needs them', () => {
    const make = () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        ext.loadBank = vi.fn(() => Promise.resolve());
        return ext;
    };

    test.each([
        ['a drum machine', e => e.drumMachine({PATTERN: 'bd sd', MACHINE: 'RolandTR909'}), ['drums']],
        ['the piano tone', e => e.tone({PATTERN: 'c4', SYNTH: 'piano'}), ['piano']],
        ['Dirt-Samples', e => e.miniSound({CODE: 'casio:1 jazz'}), ['dirt']],
        ['VCSL', e => e.miniSound({CODE: 'marimba kalimba'}), ['vcsl']],
        ['built-in sounds only', e => e.tone({PATTERN: e.miniSound({CODE: 'bd hh'}), SYNTH: 'sawtooth'}), []],
        ['notes', e => e.miniNote({CODE: 'c4 e4'}), []]
    ])('%s', async (_, make1, banks) => {
        const ext = make();
        await ext.playTrack({PATTERN: make1(ext), TRACK: '1'});
        expect(ext.loadBank.mock.calls.map(c => c[0]).sort()).toEqual(banks);
        expect(ext.engine.play).toHaveBeenCalled();
    });

    test('a failed load still plays', async () => {
        const ext = make();
        ext.loadBank = vi.fn(() => Promise.reject(new Error('offline')));
        await ext.playTrack({PATTERN: ext.tone({PATTERN: 'c4', SYNTH: 'piano'}), TRACK: '1'});
        expect(ext.engine.play).toHaveBeenCalled();
    });

    test('stopping while loading cancels the play', async () => {
        const ext = make();
        let finish;
        ext.loadBank = vi.fn(() => new Promise(resolve => {
            finish = resolve;
        }));
        const playing = ext.playTrack({PATTERN: ext.tone({PATTERN: 'c4', SYNTH: 'piano'}), TRACK: '1'});
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
        await ext.playTrack({PATTERN: ext.trancegate({PATTERN: 'c4', DENSITY: 0.5, SEED: 1, LENGTH: 1}), TRACK: 'pad'});
        const lines = ext.strudelCode().split('\n');
        expect(lines[2].startsWith("register('fillGaps'")).toBe(true);
        expect(lines[lines.length - 1]).toContain('.fillGaps().clip(0.7)');
    });

    test('does not define fillGaps without the trance gate', async () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        await ext.playTrack({PATTERN: 'bd', TRACK: '1'});
        expect(ext.strudelCode()).not.toContain('fillGaps');
    });
});

describe('races while loading samples', () => {
    const make = () => {
        const ext = new blockClass(makeRuntime());
        ext.engine.play = vi.fn(() => Promise.resolve());
        return ext;
    };

    test('stopping the track while loading cancels the play', async () => {
        const ext = make();
        let finish;
        ext.loadBank = vi.fn(() => new Promise(resolve => {
            finish = resolve;
        }));
        const playing = ext.playTrack({PATTERN: ext.tone({PATTERN: 'c4', SYNTH: 'piano'}), TRACK: 'p'});
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
        const slow = ext.playTrack({PATTERN: ext.tone({PATTERN: 'c4', SYNTH: 'piano'}), TRACK: 'p'});
        ext.loadBank = vi.fn(() => Promise.resolve());
        await ext.playTrack({PATTERN: 'bd', TRACK: 'p'});
        finishSlow();
        await slow;
        expect(ext.engine.play).toHaveBeenCalledTimes(1);
        expect(ext.strudelCode()).toContain('$: s("bd")');
    });

    test('the definition of fillGaps is added only for the trance gate', async () => {
        const ext = make();
        await ext.playTrack({PATTERN: ext.miniNote({CODE: 'c4'}), TRACK: '1'});
        await ext.playTrack({PATTERN: ext.miniSound({CODE: 'a).fillGaps()'}), TRACK: '2'});
        expect(ext.strudelCode()).not.toContain("register('fillGaps'");
    });
});
