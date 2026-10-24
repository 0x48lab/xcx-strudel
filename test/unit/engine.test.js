import {sequence} from '@strudel/core';
import {Engine, soundKey} from '../../src/core/engine.js';
import {checkUzuDrums, registerUzuDrums} from '../../src/core/drum-kit.js';
import {registerDrumSounds} from '../../src/core/drums.js';

vi.mock('../../src/core/drum-kit.js', () => ({
    checkUzuDrums: vi.fn(() => Promise.resolve()),
    registerUzuDrums: vi.fn(() => Promise.resolve())
}));
vi.mock('../../src/core/drums.js', () => ({registerDrumSounds: vi.fn()}));

/**
 * Engine whose audio and scheduler are replaced by fakes.
 * @returns {Engine} - engine for tests
 */
const makeEngine = () => {
    const ctx = {currentTime: 10};
    const engine = new Engine(ctx);
    engine.init = vi.fn(() => Promise.resolve());
    const scheduler = {
        started: false,
        cps: 0.5,
        lastBegin: 0,
        lastEnd: 0,
        pattern: null,
        now: () => scheduler.lastBegin,
        setPattern: vi.fn(async (pattern, autostart) => {
            scheduler.pattern = pattern;
            if (autostart) scheduler.started = true;
        }),
        stop: vi.fn(() => {
            scheduler.started = false;
        }),
        setCps: vi.fn(cps => {
            scheduler.cps = cps;
        })
    };
    engine.scheduler = scheduler;
    return engine;
};

const onsets = (pattern, begin, end) => pattern.queryArc(begin, end)
    .filter(hap => hap.hasOnset())
    .map(hap => [hap.whole.begin.valueOf(), hap.value]);

describe('Engine', () => {
    test('a new pattern starts after the part which the scheduler already queried', async () => {
        const engine = makeEngine();
        await engine.play('a', sequence('x'));
        // the scheduler has queried until 4.05 while playing at 3.95
        engine.scheduler.lastBegin = 3.95;
        engine.scheduler.lastEnd = 4.05;
        await engine.play('a', sequence('y'));
        expect(onsets(engine.scheduler.pattern, 4, 6)).toEqual([[4, 'x'], [5, 'y']]);
    });

    test('stopAll during initialization cancels the play', async () => {
        const engine = makeEngine();
        let resolveInit;
        engine.init = () => new Promise(resolve => {
            resolveInit = resolve;
        });
        const playing = engine.play('a', sequence('x'));
        engine.stopAll();
        resolveInit();
        await playing;
        expect(engine.scheduler.setPattern).not.toHaveBeenCalled();
        expect(engine.tracks.size).toBe(0);
    });

    test('stopAll cancels sound events which are waiting', () => {
        vi.useFakeTimers();
        const engine = makeEngine();
        engine.onSound = vi.fn();
        engine.emitSound({s: 'bd'}, 0.5);
        engine.stopAll();
        vi.advanceTimersByTime(1000);
        expect(engine.onSound).not.toHaveBeenCalled();
        vi.useRealTimers();
    });

    test('sound events come at the time of the sound', () => {
        vi.useFakeTimers();
        const engine = makeEngine();
        engine.onSound = vi.fn();
        engine.emitSound({s: 'bd'}, 0.5);
        vi.advanceTimersByTime(400);
        expect(engine.onSound).not.toHaveBeenCalled();
        vi.advanceTimersByTime(200);
        expect(engine.onSound).toHaveBeenCalledWith({s: 'bd'});
        vi.useRealTimers();
    });

    test('beats follow what is heard, not what is scheduled', () => {
        const engine = makeEngine();
        engine.scheduler.started = true;
        engine.scheduler.cps = 0.5;
        engine.scheduler.lastBegin = 0.26;
        // 0.26 cycles minus the latency 0.1 s * 0.5 cps = 0.21 cycles = beat 0
        expect(engine.beat()).toBe(0);
        engine.scheduler.lastBegin = 0.31;
        expect(engine.beat()).toBe(1);
    });

    test('BPM keeps when the beats in a cycle change', () => {
        const engine = makeEngine();
        engine.setBpm(90);
        engine.setBeatsPerCycle(3);
        expect(engine.bpm).toBeCloseTo(90);
    });

    test('a failed initialization can be retried', async () => {
        const engine = new Engine({currentTime: 0});
        let calls = 0;
        engine.initAudio = () => {
            calls++;
            return calls === 1 ? Promise.reject(new Error('blocked')) : Promise.resolve();
        };
        await expect(engine.init()).rejects.toThrow('blocked');
        expect(engine.ready).toBeNull();
    });
});

describe('soundKey', () => {
    test.each([
        [{s: 'bd'}, 'bd'],
        [{s: 'BD'}, 'bd'],
        [{s: 'bd', bank: 'RolandTR909'}, 'rolandtr909_bd'],
        [{note: 'c4'}, null],
        [{s: 808}, null]
    ])('%j is %j', (value, key) => {
        expect(soundKey(value)).toBe(key);
    });
});

describe('drum kit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'warn').mockImplementation(() => null);
    });

    test('the synthesized drums are used first, and uzu-drumkit after the change', async () => {
        const engine = new Engine({currentTime: 0});
        expect(engine.drumKit).toBe('synth');
        await engine.setDrumKit('uzu');
        await engine.applyDrumKit();
        expect(registerUzuDrums).toHaveBeenCalledTimes(1);
        expect(registerDrumSounds).not.toHaveBeenCalled();
    });

    test('the synthesized drums play when uzu-drumkit can not be fetched', async () => {
        checkUzuDrums.mockImplementationOnce(() => Promise.reject(new Error('offline')));
        const engine = new Engine({currentTime: 0});
        engine.drumKit = 'uzu';
        await engine.applyDrumKit();
        expect(registerUzuDrums).not.toHaveBeenCalled();
        expect(registerDrumSounds).toHaveBeenCalledTimes(1);
    });

    test('the kit is changed after audio is ready, and kept for initialization before it', async () => {
        const engine = new Engine({currentTime: 0});
        await engine.setDrumKit('synth');
        expect(engine.drumKit).toBe('synth');
        expect(registerDrumSounds).not.toHaveBeenCalled();
        engine.ready = Promise.resolve();
        await engine.setDrumKit('synth');
        expect(registerDrumSounds).toHaveBeenCalledTimes(1);
        await engine.setDrumKit('uzu');
        expect(registerUzuDrums).toHaveBeenCalledTimes(1);
    });

    test('a change to synth while fetching uzu-drumkit keeps synth', async () => {
        let fetched;
        checkUzuDrums.mockImplementationOnce(() => new Promise(resolve => {
            fetched = resolve;
        }));
        const engine = new Engine({currentTime: 0});
        engine.drumKit = 'uzu';
        engine.ready = Promise.resolve();
        const first = engine.applyDrumKit();
        await engine.setDrumKit('synth');
        fetched();
        await first;
        expect(registerUzuDrums).not.toHaveBeenCalled();
        expect(registerDrumSounds).toHaveBeenCalledTimes(1);
    });
});
