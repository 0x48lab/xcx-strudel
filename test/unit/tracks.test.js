import {note, sequence} from '@strudel/core';
import {mini} from '@strudel/mini';
import {Tracks, switchAt} from '../../src/core/tracks.js';

const onsets = (pattern, begin, end) => pattern.queryArc(begin, end)
    .filter(hap => hap.hasOnset())
    .map(hap => [hap.whole.begin.valueOf(), hap.value]);

describe('switchAt', () => {
    test('plays the first pattern before and the second after the switch', () => {
        const pattern = switchAt(sequence('a', 'b'), sequence('x', 'y'), 1);
        expect(onsets(pattern, 0, 2)).toEqual([[0, 'a'], [0.5, 'b'], [1, 'x'], [1.5, 'y']]);
    });

    test('splits a query which crosses the switch', () => {
        const pattern = switchAt(sequence('a', 'b'), sequence('x', 'y'), 1);
        expect(onsets(pattern, 0.75, 1.25)).toEqual([[1, 'x']]);
    });
});

describe('Tracks', () => {
    test('stacks named tracks', () => {
        const tracks = new Tracks();
        tracks.set('a', sequence('a'), 0);
        tracks.set('b', sequence('b'), 0);
        expect(onsets(tracks.pattern(), 0, 1).map(([, v]) => v).sort()).toEqual(['a', 'b']);
    });

    test('replacing a track waits for the next cycle', () => {
        const tracks = new Tracks();
        tracks.set('a', sequence('a', 'a'), 0);
        tracks.set('a', sequence('z', 'z'), 0.3);
        expect(onsets(tracks.pattern(), 0, 2)).toEqual([[0, 'a'], [0.5, 'a'], [1, 'z'], [1.5, 'z']]);
    });

    test('replacing twice in one cycle keeps the pattern which is sounding', () => {
        const tracks = new Tracks();
        tracks.set('a', sequence('a'), 0);
        tracks.set('a', sequence('b'), 0.2);
        tracks.set('a', sequence('c'), 0.6);
        expect(onsets(tracks.pattern(), 0, 2)).toEqual([[0, 'a'], [1, 'c']]);
    });

    test('removing a track silences it from the next cycle', () => {
        const tracks = new Tracks();
        tracks.set('a', sequence('a'), 0);
        tracks.remove('a', 0.5);
        expect(onsets(tracks.pattern(), 0, 3)).toEqual([[0, 'a']]);
    });

    test('mini-notation note pattern produces note values', () => {
        const pattern = note(mini('c3 e3')).s('sine');
        expect(onsets(pattern, 0, 1)).toEqual([[0, {note: 'c3', s: 'sine'}], [0.5, {note: 'e3', s: 'sine'}]]);
    });
});

describe('Tracks cleanup', () => {
    test('a removed track is deleted after its switch', () => {
        const tracks = new Tracks();
        tracks.set('a', sequence('a'), 0);
        tracks.set('b', sequence('b'), 0);
        tracks.remove('a', 0.5);
        expect(tracks.size).toBe(2);
        tracks.set('b', sequence('c'), 1.2);
        expect(tracks.size).toBe(1);
    });

    test('removing a track which does not exist does nothing', () => {
        const tracks = new Tracks();
        tracks.remove('x', 0);
        expect(tracks.size).toBe(0);
    });
});
