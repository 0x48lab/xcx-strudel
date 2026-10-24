import {blockClass} from '../../src/vm/extensions/block/index.js';
import {BLOCKS, levelOf} from '../../src/vm/extensions/block/blocks.js';
import {compile} from '../../src/core/ast.js';
import {build, codeOf} from '../helpers/track.js';
import {SECTIONS} from '../../scripts/dictionary-book.mjs';

const formatMessage = msg => msg.default;
formatMessage.setup = () => null;
const ext = new blockClass({formatMessage, on: () => {}, audioEngine: {audioContext: {currentTime: 0}}});

/**
 * Blocks of the book as the tests run them: a wave or random value becomes its reporter.
 * @param {Array} track - blocks of the book
 * @returns {Array} - blocks for build and codeOf
 */
const steps = track => track.map(([opcode, args, inner]) => {
    const real = Object.assign({}, args);
    Object.entries(args).forEach(([name, v]) => {
        if (v && v.wave) real[name] = ext.wave({SHAPE: v.wave[0], MIN: v.wave[1], MAX: v.wave[2], CYCLES: v.wave[3]});
        if (v && v.random) {
            const [MIN, MAX, STEPS, SEED, LENGTH] = v.random;
            real[name] = ext.randomSteps({MIN, MAX, STEPS, SEED, LENGTH});
        }
    });
    return inner ? [opcode, real, steps(inner)] : [opcode, real];
});

const entries = SECTIONS.flatMap(section => section.entries);
const tracks = entries.filter(e => e.track);

describe('dictionary book', () => {
    test.each(tracks.map(e => [e.id, e]))('%s has the code which the page shows', (id, e) => {
        expect(codeOf(ext, steps(e.track))).toBe(e.code);
    });

    test.each(tracks.map(e => [e.id, e]))('the example of %s plays', (id, e) => {
        expect(compile(build(ext, steps(e.track))).queryArc(0, 4).length).toBeGreaterThan(0);
    });

    test.each(entries.map(e => [e.id, e]))('%s has the level of its block', (id, e) => {
        expect(levelOf(e.label || e.opcode)).toBe(e.level);
    });

    test('every block of the palette has an entry', () => {
        const opcodes = new Set(entries.flatMap(e => [e.opcode, e.label]).filter(Boolean));
        const missing = BLOCKS.filter(b => typeof b === 'object').map(b => b.opcode).filter(op => !opcodes.has(op));
        expect(missing).toEqual([]);
    });

    test('ids are not used twice', () => {
        const ids = entries.flatMap(e => [e.id, ...(e.items || []).map(i => i.id)]);
        expect(new Set(ids).size).toBe(ids.length);
    });

    // Xcratch shows an input of 13 letters or more as 12 letters and "…"
    test.each(tracks.map(e => [e.id, e]))('%s fits in the inputs', (id, e) => {
        const texts = track => track.flatMap(([, args, inner]) => [
            ...['CODE', 'BEATS', 'VALUE', 'RHYTHM', 'ORDER'].map(k => args[k]).filter(v => typeof v === 'string'),
            ...(inner ? texts(inner) : [])
        ]);
        texts(e.track).forEach(text => expect(text.length).toBeLessThanOrEqual(12));
    });
});
