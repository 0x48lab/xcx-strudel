import {blockClass} from '../../src/vm/extensions/block/index.js';
import {compile} from '../../src/core/ast.js';
import {build, codeOf} from '../helpers/track.js';
import {BASE, RHYTHMS, STEPS, TECHNIQUES, gridOf, miniSteps, rowsOf} from '../../scripts/rhythm-book.mjs';

const formatMessage = msg => msg.default;
formatMessage.setup = () => null;
const ext = new blockClass({formatMessage, on: () => {}, audioEngine: {audioContext: {currentTime: 0}}});

/**
 * Blocks of the book as the tests run them: a wave becomes the value of the wave block.
 * @param {Array} track - blocks of the book
 * @returns {Array} - blocks for build and codeOf
 */
const steps = track => track.map(([opcode, args, inner]) => {
    const value = args.VALUE && args.VALUE.wave;
    const real = value ? Object.assign({}, args, {VALUE: ext.wave({SHAPE: value[0], MIN: value[1], MAX: value[2], CYCLES: value[3]})}) : args;
    return inner ? [opcode, real, steps(inner)] : [opcode, real];
});

/**
 * Texts which are typed in the inputs of a track.
 * @param {Array} track - blocks of the book
 * @returns {Array<string>} - texts
 */
const textsOf = track => track.flatMap(([, args, inner]) => [
    ...['CODE', 'BEATS', 'VALUE'].map(k => args[k]).filter(v => typeof v === 'string'),
    ...(inner ? textsOf(inner) : [])
]);

describe('rhythm book', () => {
    test.each([...RHYTHMS, ...TECHNIQUES].map(r => [r.id, r]))('%s has the code which the page shows', (id, r) => {
        expect(codeOf(ext, steps(r.track))).toBe(r.code);
    });

    test.each(BASE.map(b => [b.name, b]))('base track %s builds a pattern', (name, b) => {
        expect(compile(build(ext, steps(b.track))).queryArc(0, 1).length).toBeGreaterThan(0);
    });

    // Xcratch shows an input of 13 letters or more as 12 letters and "…"
    test.each([...RHYTHMS, ...TECHNIQUES, ...BASE].map(r => [r.id || r.name, r]))('%s fits in the inputs', (id, r) => {
        textsOf(r.track).forEach(text => expect(text.length).toBeLessThanOrEqual(12));
    });

    test.each(RHYTHMS.map(r => [r.id, r]))('the grid of %s is what Strudel plays', (id, r) => {
        const top = r.track.filter(([opcode]) => opcode !== 'stackBranch' && opcode !== 'bank');
        const chains = [top, ...r.track.filter(([opcode]) => opcode === 'stackBranch').map(([, , inner]) => inner)];
        const played = chains.flatMap(chain => {
            // the grid shows a cycle where every does not change the pattern
            const haps = compile(build(ext, steps(chain))).queryArc(1, 2).filter(h => h.hasOnset())
                .sort((x, y) => x.whole.begin.valueOf() - y.whole.begin.valueOf());
            return rowsOf(haps.map(h => [(h.whole.begin.valueOf() - 1) * STEPS, h.value.s]));
        });
        expect(gridOf(r.track)).toEqual(played);
    });

    test('keys are not used twice', () => {
        expect(new Set(RHYTHMS.map(r => r.key)).size).toBe(RHYTHMS.length);
        expect(new Set(TECHNIQUES.map(t => t.key)).size).toBe(TECHNIQUES.length);
    });

    test('mini steps', () => {
        expect(miniSteps('bd*4')).toEqual([[0, 'bd'], [4, 'bd'], [8, 'bd'], [12, 'bd']]);
        expect(miniSteps('[~ oh]*4')).toEqual([[2, 'oh'], [6, 'oh'], [10, 'oh'], [14, 'oh']]);
        expect(miniSteps('bd [~ sd] hh*2 ~')).toEqual([[0, 'bd'], [6, 'sd'], [8, 'hh'], [10, 'hh']]);
    });
});
