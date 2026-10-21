import * as core from '@strudel/core';
import * as miniModule from '@strudel/mini';
import * as tonal from '@strudel/tonal';
import {evaluate} from '@strudel/transpiler';
import {FILL_GAPS_CODE, fillGaps} from '../../src/core/fill.js';
import {
    callNode,
    classify,
    compile,
    isNode,
    methodNode,
    miniNode,
    signalArg,
    silenceNode,
    toCode,
    toNode
} from '../../src/core/ast.js';

const events = (pattern, cycles = 4) => pattern.queryArc(0, cycles)
    .filter(hap => hap.hasOnset())
    .map(hap => [hap.whole.begin.valueOf(), hap.whole.end.valueOf(), hap.value])
    .sort((a, b) => (a[0] - b[0]) || JSON.stringify(a[2]).localeCompare(JSON.stringify(b[2])));

beforeAll(async () => {
    await core.evalScope(core, miniModule, tonal);
    // exported code with the trance gate defines fillGaps first
    await evaluate(FILL_GAPS_CODE);
});

/**
 * The pattern compiled from the AST and the pattern evaluated from its code
 * must produce the same events.
 * @param {object} n - AST node
 */
const expectSameAsStrudel = async n => {
    const {pattern} = await evaluate(toCode(n));
    const expected = events(pattern);
    expect(expected.length).toBeGreaterThan(0);
    expect(events(compile(n))).toEqual(expected);
};

describe('classify', () => {
    test.each([
        ['bd sd', 's'],
        ['bd*2 [sd hh]', 's'],
        ['c4 e4 g4', 'note'],
        ['c e g', 'note'],
        ['c#4 eb3', 'note'],
        ['0 2 4', 'note'],
        ['c*2 <e g>', 'note'],
        ['bd(3,8)', 's'],
        ['c(3,8)', 'note'],
        ['bd c4', 's'],
        ['~ c4', 'note']
    ])('%s is %s', (code, control) => {
        expect(classify(code)).toBe(control);
    });
});

describe('toNode', () => {
    test('blank values are null', () => {
        expect(toNode('')).toBeNull();
        expect(toNode('   ')).toBeNull();
        expect(toNode(null)).toBeNull();
    });

    test('strings become mini nodes', () => {
        expect(toNode('bd sd')).toMatchObject({type: 'mini', code: 'bd sd'});
    });

    test('numbers become mini nodes', () => {
        expect(toNode(3)).toMatchObject({type: 'mini', code: '3'});
    });

    test('nodes are kept', () => {
        const n = miniNode('bd', 's');
        expect(toNode(n)).toBe(n);
    });
});

describe('toCode', () => {
    test('mini with explicit control', () => {
        expect(toCode(miniNode('c4', 's'))).toBe('s("c4")');
    });

    test('mini without control is classified', () => {
        expect(toCode(miniNode('c e g'))).toBe('note("c e g")');
        expect(toCode(miniNode('bd sd'))).toBe('s("bd sd")');
    });

    test('quotes are escaped', () => {
        expect(toCode(miniNode('a"b', 's'))).toBe('s("a\\"b")');
    });

    test('calls and methods', () => {
        const n = methodNode(callNode('seq', ['bd', '', 'sd']), 'fast', [2]);
        expect(toCode(n)).toBe('seq(s("bd"), s("sd")).fast(2)');
    });

    test('string arguments of methods are quoted', () => {
        expect(toCode(methodNode('c e', 's', ['sawtooth']))).toBe('note("c e").s("sawtooth")');
    });

    test('reporter value is shown as code', () => {
        expect(String(callNode('stack', ['bd', 'hh']))).toBe('stack(s("bd"), s("hh"))');
    });
});

describe('callNode', () => {
    test('no arguments is silence', () => {
        expect(callNode('seq', ['', ''])).toMatchObject({type: 'silence'});
    });

    test('one argument is the argument itself', () => {
        expect(callNode('seq', ['', 'bd'])).toMatchObject({type: 'mini', code: 'bd'});
    });
});

describe('compile', () => {
    test('rejects unknown functions', () => {
        const n = callNode('seq', ['bd', 'sd']);
        n.fn = 'evaluate';
        expect(() => compile(n)).toThrow('unknown function');
    });

    test('rejects unknown methods', () => {
        expect(() => compile(methodNode('bd', 'constructor', []))).toThrow('unknown method');
    });

    test('isNode', () => {
        expect(isNode(silenceNode())).toBe(true);
        expect(isNode({type: 'mini'})).toBe(false);
    });
});

describe('same events as Strudel', () => {
    test.each([
        ['drum', miniNode('bd', 's')],
        ['melody', miniNode('c4 e4 g4')],
        ['sequence', callNode('seq', ['bd', 'sd', 'bd', 'sd'])],
        ['stack', callNode('stack', ['bd sd', 'hh*4'])],
        ['alternate', callNode('cat', ['bd', 'sd'])],
        ['repeat', methodNode(callNode('seq', ['bd', 'sd']), 'fast', [2])],
        ['slow', methodNode('c e g b', 'slow', [2])],
        ['tone', methodNode('c e g', 's', ['sawtooth'])],
        ['nested', callNode('stack', [
            methodNode(miniNode('bd', 's'), 'fast', [4]),
            callNode('cat', ['c4 e4', methodNode('g4', 's', ['square'])])
        ])],
        ['silence in sequence', callNode('seq', ['bd', silenceNode(), 'sd'])],
        ['mini-notation features', miniNode('bd*2 [~ sd] <hh oh> bd(3,8)')]
    ])('%s', async (_, n) => {
        await expectSameAsStrudel(n);
    });
});

describe('limits against heavy patterns', () => {
    test.each([
        'bd*99999999',
        'bd(100000,200000)',
        'bd!1000',
        'bd/100000'
    ])('rejects a too large number in "%s"', code => {
        expect(() => compile(miniNode(code))).toThrow('too large');
    });

    test('rejects too long mini-notation', () => {
        expect(() => compile(miniNode('~ '.repeat(2100)))).toThrow('too long');
    });

    test('accepts usual numbers', () => {
        expect(() => compile(miniNode('bd*16 [sd hh]*2 bd(3,8) c4@3 <a b>/2'))).not.toThrow();
    });

    test('accepts note numbers above the limit', () => {
        // numbers which are values, not modifiers, are not limited
        expect(() => compile(miniNode('60 72 127'))).not.toThrow();
    });
});

describe('revive', () => {
    test('a node saved as JSON in a variable becomes a node again', () => {
        const n = methodNode(callNode('seq', ['bd', 'sd']), 'fast', [2]);
        const loaded = JSON.parse(JSON.stringify(n));
        const revived = toNode(loaded);
        expect(isNode(revived)).toBe(true);
        expect(toCode(revived)).toBe('seq(s("bd"), s("sd")).fast(2)');
    });

    test('an unknown object is not a node', () => {
        expect(toNode({type: 'evil', code: 'x'})).toMatchObject({type: 'mini', code: '[object Object]'});
    });

    test('a revived node still checks the allow list', () => {
        const loaded = {type: 'method', target: {type: 'mini', code: 'bd'}, fn: 'constructor', args: []};
        expect(() => compile(toNode(loaded))).toThrow('unknown method');
    });

    test('a revived node with a broken child is rejected', () => {
        const loaded = {type: 'call', fn: 'seq', args: [{type: 'mini', code: 'bd'}, 'not a node']};
        expect(toNode(loaded)).toMatchObject({type: 'mini', code: '[object Object]'});
    });
});

describe('P2 same events as Strudel', () => {
    test.each([
        ['low pass filter', methodNode('bd sd', 'lpf', [800])],
        ['filter pattern', methodNode('c3 e3 g3', 'lpf', ['<300 2000>'])],
        ['effects chain', methodNode(methodNode(methodNode('c e g', 'room', [0.5]), 'delay', [0.25]), 'pan', ['0 1'])],
        ['gain and crush', methodNode(methodNode('hh*8', 'gain', ['0.4 1']), 'crush', [4])],
        ['high pass', methodNode('hh*4', 'hpf', [2000])],
        ['reverse', methodNode('c e g b', 'rev', [])],
        ['ply', methodNode('bd sd', 'ply', [2])],
        ['every', methodNode('c3 d3 e3 g3', 'every', [4, {fn: 'rev', args: []}])],
        ['every fast', methodNode('bd sd', 'every', [2, {fn: 'fast', args: [2]}])],
        ['scale', methodNode(miniNode('0 2 4 <6 7>', 'n'), 'scale', ['C4:major'])],
        ['minor pentatonic', methodNode(miniNode('0 1 2 3 4', 'n'), 'scale', ['A3:minor:pentatonic'])],
        ['scale with tone', methodNode(methodNode(miniNode('0 .. 7', 'n'), 'scale', ['D:dorian']), 's', ['sawtooth'])],
        ['vowel', methodNode(methodNode('c3 e3', 's', ['sawtooth']), 'vowel', ['<a e i o>'])],
        ['speed and adsr', methodNode(methodNode(methodNode('bd sd', 'speed', ['<1 2 -1>']), 'attack', [0.1]), 'release', [0.5])],
        ['bank', methodNode('bd hh sd hh', 'bank', ['RolandTR909'])],
        ['sample index', miniNode('casio:1 jazz:0 [jazz:4 jazz:2]', 's')]
    ])('%s', async (_, n) => {
        await expectSameAsStrudel(n);
    });

    test('every is written as an arrow function', () => {
        expect(toCode(methodNode('c d', 'every', [4, {fn: 'fast', args: [2]}])))
            .toBe('note("c d").every(4, x => x.fast(2))');
    });
});

describe('P2 argument checks', () => {
    test.each([
        ['lpf', [5]],
        ['lpf', [99999]],
        ['lpf', ['<300 99999>']],
        ['lpf', ['300; alert(1)']],
        ['gain', [-1]],
        ['s', ['saw tooth']],
        ['s', [{fn: 'rev', args: []}]],
        ['scale', ['C:major"); evil("']],
        ['every', [4, {fn: 'every', args: [2]}]],
        ['every', [4, {fn: 'constructor', args: []}]],
        ['every', [4, 'rev']],
        ['every', [99, {fn: 'rev', args: []}]],
        ['rev', [1]],
        ['ply', [100]],
        ['toString', []],
        ['vowel', ['<a x>']],
        ['vowel', [1]],
        ['bank', ['Roland TR909']],
        ['speed', [9]],
        ['__proto__', []]
    ])('%s %j is rejected', (fn, args) => {
        expect(() => compile(methodNode('c e', fn, args))).toThrow();
    });

    test('modifiers in a value pattern are not checked as values', () => {
        expect(() => compile(methodNode('c e', 'lpf', ['<300 2000>*2']))).not.toThrow();
    });

    test('an unknown control is rejected', () => {
        expect(() => compile(miniNode('c', 'constructor'))).toThrow('unknown control');
    });

    test('a revived transform is checked again', () => {
        const loaded = JSON.parse(JSON.stringify(methodNode('c e', 'every', [2, {fn: 'rev', args: []}])));
        loaded.args[1].fn = 'constructor';
        expect(() => compile(toNode(loaded))).toThrow();
    });
});

describe('event budget', () => {
    test.each([
        ['patterned multiplier', miniNode('bd*[2000]', 's')],
        ['alternating multiplier', miniNode('bd*<2000>', 's')],
        ['patterned euclid', miniNode('bd(<3>,100000)', 's')],
        ['nested multipliers', miniNode('[[bd*64]*64]*64', 's')],
        ['big range', miniNode('0 .. 1000', 'n')],
        ['chained fast', methodNode(methodNode(methodNode('bd*16', 'fast', [64]), 'ply', [8]), 'fast', [64])],
        ['every fast chain', methodNode(methodNode('bd*64', 'every', [2, {fn: 'fast', args: [64]}]), 'ply', [8])],
        ['value pattern splits events', methodNode('bd*64', 'lpf', ['300*64 200'])]
    ])('rejects %s', (_, n) => {
        expect(() => compile(n)).toThrow();
    });

    test.each([
        ['tutorial hats', miniNode('bd hh*32 rim hh*16', 's')],
        ['tutorial stack', miniNode('bd*2, hh*2 [hh oh]', 's')],
        ['euclid', miniNode('bd(3,8) hh(5,16)', 's')],
        ['small range', miniNode('0 .. 7', 'n')],
        ['usual chain', methodNode(methodNode('bd sd', 'fast', [2]), 'every', [4, {fn: 'fast', args: [2]}])]
    ])('accepts %s', (_, n) => {
        expect(() => compile(n)).not.toThrow();
    });

    test('a patterned replicate is not a multiplier in Strudel', () => {
        // Strudel reads bd!<100> as a few events, not 100 copies
        expect(compile(miniNode('bd!<100>', 's')).queryArc(0, 1).length).toBeLessThan(10);
    });

    test('too deep nodes are rejected', () => {
        let n = miniNode('bd', 's');
        for (let i = 0; i < 40; i++) n = methodNode(n, 'rev', []);
        expect(() => compile(n)).toThrow('too deep');
    });
});

describe('event estimate is not too strict', () => {
    test.each([
        'bd*16 hh*16 sd*16 cp*16',
        '[bd*8 [sd hh]*4]*4, hh*32',
        '<[bd*16] [sd*16] [hh*16]>*4'
    ])('accepts %s', code => {
        expect(() => compile(miniNode(code, 's'))).not.toThrow();
    });
});

describe('P3 same events as Strudel', () => {
    const t = (fn, args = []) => ({fn, args});
    test.each([
        ['signal filter', methodNode(methodNode('c3*8', 's', ['sawtooth']), 'lpf', [signalArg('sine', 200, 2000, 4)])],
        ['saw gain', methodNode('hh*16', 'gain', [signalArg('saw', 0.2, 1, 1)])],
        ['square pan', methodNode('bd*8', 'pan', [signalArg('square', 0, 1, 2)])],
        ['tri room', methodNode('c e g', 'room', [signalArg('tri', 0, 1, 0.5)])],
        ['euclid', methodNode('bd', 'euclid', [3, 8])],
        ['jux', methodNode(miniNode('0 2 4 6', 'n'), 'jux', [t('rev')])],
        ['off', methodNode(methodNode(miniNode('0 2 4', 'n'), 'scale', ['C4:major']), 'off', [0.125, t('transpose', [12])])],
        ['chop', methodNode('bd sd', 'chop', [4])],
        ['transpose', methodNode('c3 e3 g3', 'transpose', [7])],
        ['arp', methodNode(miniNode('<[c3,e3,g3] [d3,f3,a3]>', 'note'), 'arp', ['0 1 2 1'])],
        ['every transpose', methodNode('c3 e3', 'every', [2, t('transpose', [12])])]
    ])('%s', async (_, n) => {
        await expectSameAsStrudel(n);
    });

    test('random patterns are the same as Strudel', async () => {
        await expectSameAsStrudel(methodNode('hh*16', 'degradeBy', [0.5]));
        await expectSameAsStrudel(methodNode('c3*8', 'sometimes', [t('transpose', [12])]));
        await expectSameAsStrudel(methodNode('bd*8', 'gain', [signalArg('rand', 0.3, 1, 1)]));
    });

    test('a signal is written as Strudel code', () => {
        expect(String(signalArg('sine', 200, 2000, 4))).toBe('sine.range(200, 2000).slow(4)');
        expect(toCode(methodNode('c e', 'lpf', [signalArg('perlin', 300, 900, 2)])))
            .toBe('note("c e").lpf(perlin.range(300, 900).slow(2))');
    });
});

describe('P3 argument checks', () => {
    test.each([
        ['lpf', [{signal: 'constructor', min: 200, max: 2000, cycles: 1}]],
        ['lpf', [{signal: 'sine', min: 1, max: 2000, cycles: 1}]],
        ['lpf', [{signal: 'sine', min: 200, max: 2000, cycles: 0}]],
        ['degradeBy', [2]],
        ['euclid', [3, 1000]],
        ['jux', ['rev']],
        ['off', [0.25, {fn: 'off', args: []}]],
        ['chop', [100]],
        ['transpose', [99]],
        ['arp', ['0 1; x']]
    ])('%s %j is rejected', (fn, args) => {
        expect(() => compile(methodNode('c e', fn, args))).toThrow();
    });

    test('a signal saved in a variable comes back', () => {
        const loaded = JSON.parse(JSON.stringify(methodNode('c e', 'lpf', [signalArg('sine', 200, 900, 2)])));
        expect(() => compile(toNode(loaded))).not.toThrow();
    });

    test.each([
        ['euclid steps', methodNode('bd*64 sd', 'euclid', [3, 64])],
        ['chop', methodNode('bd*64 sd*64 hh*64 cp*64 oh', 'chop', [16])],
        ['off of fast', methodNode('bd*64', 'off', [0.25, {fn: 'fast', args: [64]}])]
    ])('%s counts in the event budget', (_, n) => {
        expect(() => compile(n)).toThrow('too many events');
    });
});

describe('code of broken nodes', () => {
    test.each([
        ['signal name', {type: 'method', target: {type: 'mini', code: 'c'}, fn: 'lpf',
            args: [{signal: 'sine);evil((', min: 1, max: 2, cycles: 1}]}],
        ['transform name', {type: 'method', target: {type: 'mini', code: 'c'}, fn: 'every',
            args: [2, {fn: 'rev();evil', args: []}]}],
        ['method name', {type: 'method', target: {type: 'mini', code: 'c'}, fn: 'x);evil(', args: []}],
        ['call name', {type: 'call', fn: 'evil', args: [{type: 'mini', code: 'c'}, {type: 'mini', code: 'd'}]}]
    ])('a revived node with a bad %s is not written as code', (_, loaded) => {
        const n = toNode(loaded);
        expect(() => toCode(n)).toThrow();
        expect(String(n)).not.toContain('evil');
    });

    test('a control must be a string', () => {
        expect(toNode({type: 'mini', code: 'c', control: ['s']})).toMatchObject({type: 'mini', code: '[object Object]'});
    });

    test('a deeply nested object does not overflow the stack', () => {
        let loaded = {type: 'mini', code: 'c'};
        for (let i = 0; i < 100000; i++) loaded = {type: 'method', target: loaded, fn: 'rev', args: []};
        expect(() => toNode(loaded)).not.toThrow();
    });
});

describe('numbers found by porting Strudel examples', () => {
    test.each([
        ['gain', '[.25 1]*4'],
        ['delay', '.5'],
        ['pan', '0 0.3 .6 1'],
        ['delay', '<0 .5>'],
        ['delayfeedback', '.6 | .8'],
        ['gain', '1 .5?']
    ])('%s accepts "%s"', (fn, v) => {
        expect(() => compile(methodNode('bd', fn, [v]))).not.toThrow();
    });

    test('a leading dot number is still checked', () => {
        expect(() => compile(methodNode('bd', 'pan', ['.5 1.5']))).toThrow();
    });

    test('a multiplier written as a pattern is estimated by its largest number', () => {
        expect(() => compile(miniNode('[bd*4,~ rim ~ cp]*<1 [2 4]>', 's'))).not.toThrow();
        expect(() => compile(miniNode('bd*<1 99999>', 's'))).toThrow();
    });
});

describe('add, superimpose, trancegate and more effects', () => {
    test.each([
        ['add to notes', methodNode(miniNode('c2 [eb3,g3]', 'note'), 'add', ['<0 <1 -1>>'])],
        ['add a chord', methodNode(methodNode(miniNode('c2 [eb3,g3]', 'note'), 'add', ['<0 <1 -1>>']), 'add', ['0,7'])],
        ['add to steps before scale', methodNode(methodNode(miniNode('0 2 4 6 ~ 7 9 5', 'n'), 'add', ['<0 1 2 1>']), 'scale', ['C:minor'])],
        ['add to notes after scale', methodNode(methodNode(miniNode('0 2 4', 'n'), 'scale', ['C4:major']), 'add', [12])],
        ['add a number', methodNode(miniNode('48 52', 'note'), 'add', [7])],
        ['superimpose', methodNode(miniNode('c3 e3', 'note'), 'superimpose', [{fn: 'transpose', args: [12]}])],
        ['envelope and delay', methodNode(methodNode(methodNode(methodNode(methodNode('bd sd', 'clip', ['.5']), 'decay', [0.2]), 'sustain', [0.3]), 'delaytime', ['.16']), 'delayfeedback', [0.6])],
        ['acid', methodNode(methodNode(methodNode(methodNode(methodNode(methodNode(miniNode('c2*8', 'note'), 's', ['sawtooth']), 'lpf', [100]), 'lpenv', [4]), 'lpq', [12]), 'lpd', [0.15]), 'lps', [0.2])],
        ['supersaw', methodNode(methodNode(methodNode(miniNode('c3', 'note'), 's', ['supersaw']), 'detune', [0.5]), 'unison', [3])]
    ])('%s', async (_, n) => {
        await expectSameAsStrudel(n);
    });

    test('add is written with the control of the pattern', () => {
        expect(toCode(methodNode(miniNode('c2', 'note'), 'add', ['<0 7>']))).toBe('note("c2").add(note("<0 7>"))');
        expect(toCode(methodNode(methodNode(miniNode('0 2', 'n'), 'add', [1]), 'scale', ['C:minor'])))
            .toBe('n("0 2").add(n(1)).scale("C:minor")');
    });

    test('add to drums is rejected', () => {
        expect(() => compile(methodNode(miniNode('bd', 's'), 'add', [1]))).toThrow('only to notes');
    });

    test('a trance gate is written with Strudel functions only', async () => {
        const n = methodNode(methodNode(miniNode('c3', 'note'), 's', ['supersaw']), 'trancegate', [0.5, 3, 1]);
        expect(toCode(n)).toBe('note("c3").s("supersaw").struct(rand.mul(1).round().seg(16).rib(3, 1)).fillGaps().clip(0.7)');
        await expectSameAsStrudel(n);
    });

    test.each([
        ['delayfeedback', [1]],
        ['add', [99]],
        ['trancegate', [2, 0, 1]],
        ['unison', [20]]
    ])('%s %j is rejected', (fn, args) => {
        expect(() => compile(methodNode(miniNode('c e', 'note'), fn, args))).toThrow();
    });
});

describe('polymeter steps and other estimates', () => {
    test.each([
        ['big steps', '{bd}%1000'],
        ['nested steps', '{{{bd}%64}%64}%64'],
        ['patterned steps', '{bd}%<1 999>']
    ])('rejects %s', (_, code) => {
        expect(() => compile(miniNode(code, 's'))).toThrow();
    });

    test('a usual polymeter is accepted and estimated with its steps', () => {
        expect(() => compile(miniNode('{bd sd, hh hh hh}%4', 's'))).not.toThrow();
        expect(() => compile(miniNode('{bd}%64', 's'))).not.toThrow();
    });

    test('euclid is not over-counted', () => {
        expect(() => compile(miniNode('bd(64,64)', 's'))).not.toThrow();
    });

    test('add finds the notes in a stack which starts with drums', () => {
        const n = methodNode(callNode('stack', [miniNode('bd', 's'), miniNode('c3', 'note')]), 'add', [12]);
        expect(toCode(n)).toBe('stack(s("bd"), note("c3")).add(note(12))');
    });
});

describe('fillGaps', () => {
    const spans = pattern => pattern.queryArc(0, 2).filter(h => h.hasOnset())
        .map(h => [h.whole.begin.valueOf(), h.whole.end.valueOf()])
        .sort((a, b) => a[0] - b[0]);

    test('each sound reaches the next one', () => {
        expect(spans(fillGaps(core.s(miniModule.mini('bd ~ ~ sd'))))).toEqual([[0, 0.75], [0.75, 1], [1, 1.75], [1.75, 2]]);
    });

    test('a chord stays together', () => {
        const values = fillGaps(core.note(miniModule.mini('[c3,e3] ~ g3 ~'))).queryArc(0, 1)
            .filter(h => h.hasOnset())
            .map(h => [h.whole.begin.valueOf(), h.whole.end.valueOf()]);
        expect(values).toEqual([[0, 0.5], [0, 0.5], [0.5, 1]]);
    });

    test('a query in the middle of a sound returns its part', () => {
        const haps = fillGaps(core.s(miniModule.mini('bd ~ ~ ~'))).queryArc(0.5, 0.75);
        expect(haps.map(h => [h.whole.begin.valueOf(), h.whole.end.valueOf(), h.part.begin.valueOf()]))
            .toEqual([[0, 1, 0.5]]);
    });

    test('the code version gives the same events', async () => {
        const {pattern} = await evaluate('s("bd ~ hh [~ sd]").fillGaps()');
        expect(spans(pattern)).toEqual(spans(fillGaps(core.s(miniModule.mini('bd ~ hh [~ sd]')))));
    });
});

describe('fillGaps performance', () => {
    test('many events are filled quickly', () => {
        const pattern = fillGaps(core.s(miniModule.mini('[bd*64]!64')));
        const start = Date.now();
        const haps = pattern.queryArc(0, 1);
        expect(haps.length).toBe(4096);
        expect(Date.now() - start).toBeLessThan(2000);
    });
});
