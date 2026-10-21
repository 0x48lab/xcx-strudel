import {note, s, stack} from '@strudel/core';
import {mini} from '@strudel/mini';
import {layout, rowKey} from '../../src/viz/pianoroll.js';

describe('rowKey', () => {
    test.each([
        [{note: 'c4'}, 60],
        [{note: 62}, 62],
        [{n: 'e4'}, 64],
        [{s: 'bd'}, 'bd'],
        ['x', 'x']
    ])('%j is %j', (value, key) => {
        expect(rowKey(value)).toBe(key);
    });
});

describe('layout', () => {
    const pattern = stack(note(mini('c4 e4')), s(mini('bd')));
    const haps = pattern.queryArc(-2, 2);

    test('notes are above drums and low notes are lower', () => {
        const rects = layout(haps, 0, 480, 360);
        const y = key => rects.find(r => r.key === key).y;
        expect(y('bd')).toBeGreaterThan(y(60));
        expect(y(60)).toBeGreaterThan(y(64));
    });

    test('the playhead is in the middle', () => {
        const rects = layout(haps, 0, 480, 360);
        const first = rects.find(r => r.key === 60 && r.active);
        expect(first.x).toBeCloseTo(240);
        expect(first.w).toBeCloseTo(60);
    });

    test('only haps at now are active', () => {
        const rects = layout(haps, 0.25, 480, 360);
        expect(rects.filter(r => r.active).map(r => r.key)
            .sort()).toEqual([60, 'bd'].sort());
    });
});

describe('rowKey of drums', () => {
    test('a drum with a sample number stays a drum row', () => {
        expect(rowKey({s: 'bd', n: 3})).toBe('bd');
    });

    test('n without a sound is a pitch', () => {
        expect(rowKey({n: 3})).toBe(3);
    });
});

describe('punch card view', () => {
    test('the current cycle fills the width', async () => {
        const {VIEW} = await import('../../src/viz/pianoroll.js');
        const haps = s(mini('bd sd')).queryArc(1, 2);
        const rects = layout(haps, 1.3, 480, 360, VIEW.PUNCHCARD);
        expect(rects.map(r => Math.round(r.x))).toEqual([0, 240]);
        expect(rects.find(r => r.active).key).toBe('bd');
    });
});
