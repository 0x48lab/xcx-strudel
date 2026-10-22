import {Cyclist} from '@strudel/core';
import {
    getSuperdoughAudioController,
    initAudio,
    registerSynthSounds,
    setAudioContext,
    soundMap,
    superdough
} from 'superdough';
import {registerDrumSounds} from './drums.js';
import {Tracks} from './tracks.js';
import {LIMIT} from './ast.js';

const BEAT_CHECK_INTERVAL = 10; // ms

/**
 * @param {object} value - hap value
 * @returns {?string} - key of the sound in the sound map, the same as superdough looks up
 */
export const soundKey = value => {
    if (!value || typeof value.s !== 'string') return null;
    const key = value.bank ? `${value.bank}_${value.s}` : value.s;
    return key.toLowerCase();
};
const LATENCY = 0.1; // seconds, the same as the default of Cyclist

/**
 * Strudel engine which shares the AudioContext with Scratch.
 */
export class Engine {
    /**
     * @param {AudioContext} audioContext - AudioContext of the Scratch audio engine
     */
    constructor (audioContext) {
        this.audioContext = setAudioContext(audioContext);
        this.tracks = new Tracks();
        /** Pattern of all tracks which is playing, or null. */
        this.pattern = null;
        this.beatsPerCycle = 4;
        this.ready = null;
        /** @type {AnalyserNode} */
        this.analyser = null;
        /** Called with the hap value when a sound starts. */
        this.onSound = null;
        /** Called with the beat number when a beat starts. */
        this.onBeat = null;
        this.lastBeat = -1;
        this.beatTimer = null;
        /** Timers of sound events which are waiting. */
        this.soundTimers = new Set();
        /** Increased by stopAll to cancel plays which are waiting for initialization. */
        this.generation = 0;
        /** Sound names which were warned as not found. */
        this.warnedSounds = new Set();
        this.scheduler = new Cyclist({
            getTime: () => this.audioContext.currentTime,
            latency: LATENCY,
            onTrigger: (hap, deadline, duration, cps, targetTime) => {
                this.trigger(hap.value, targetTime, duration, cps, hap.whole.begin.valueOf());
            },
            onToggle: started => (started ? this.startBeats() : this.stopBeats()),
            onError: e => console.warn('[strudel]', e)
        });
    }

    /**
     * Play a sound and tell it to the listener.
     * @param {object} value - hap value
     * @param {number} time - audio time to start
     * @param {number} duration - duration in seconds
     * @param {number} cps - cycles per second
     * @param {number} cycle - cycle position of the hap
     */
    trigger (value, time, duration, cps, cycle) {
        const name = soundKey(value);
        // superdough looks up sounds with obj[name], so names such as "constructor" must be checked here
        if (name !== null && !Object.prototype.hasOwnProperty.call(soundMap.get(), name)) {
            this.warnSound(name);
            return;
        }
        superdough(value, time, duration, cps, cycle).catch(e => this.warnSound(name, e));
        this.emitSound(value, time - this.audioContext.currentTime);
    }

    /**
     * @param {string} name - sound name
     * @param {Error} [error] - error from superdough
     */
    warnSound (name, error) {
        const key = String(name);
        if (this.warnedSounds.has(key)) return;
        this.warnedSounds.add(key);
        console.warn(`[strudel] sound "${key}" can not be played`, error || '');
    }

    /**
     * Call onSound when the sound is heard.
     * @param {object} value - hap value
     * @param {number} delay - seconds until the sound
     */
    emitSound (value, delay) {
        if (!this.onSound) return;
        const timer = setTimeout(() => {
            this.soundTimers.delete(timer);
            if (this.onSound) this.onSound(value);
        }, Math.max(0, delay) * 1000);
        this.soundTimers.add(timer);
    }

    /**
     * Prepare superdough on the shared AudioContext.
     * @returns {Promise} - resolves when audio is ready
     */
    async initAudio () {
        await initAudio();
        registerSynthSounds();
        registerDrumSounds();
        // the orbits which duck can duck, made before the first duck so that they are found.
        // [0, 1] are the default channels of superdough, because initAudio is called without multiChannelOrbits
        for (let orbit = 1; orbit <= LIMIT.ORBITS; orbit++) getSuperdoughAudioController().getOrbit(orbit, [0, 1]);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        getSuperdoughAudioController().output.destinationGain.connect(this.analyser);
    }

    /**
     * Initialize audio once. Call this from a user action.
     * @returns {Promise} - resolves when audio is ready
     */
    init () {
        if (!this.ready) {
            this.ready = this.initAudio().catch(e => {
                // allow to retry on the next play
                this.ready = null;
                throw e;
            });
        }
        return this.ready;
    }

    startBeats () {
        this.stopBeats();
        this.lastBeat = -1;
        this.beatTimer = setInterval(() => {
            const beat = this.beat();
            if (beat !== this.lastBeat) {
                this.lastBeat = beat;
                if (this.onBeat) this.onBeat(beat);
            }
        }, BEAT_CHECK_INTERVAL);
    }

    stopBeats () {
        if (this.beatTimer !== null) clearInterval(this.beatTimer);
        this.beatTimer = null;
    }

    /**
     * @returns {number} - cycle position which is heard now
     */
    now () {
        if (!this.scheduler.started) return 0;
        // the scheduler plays sounds LATENCY seconds after it queries them
        return Math.max(0, this.scheduler.now() - (LATENCY * this.scheduler.cps));
    }

    /**
     * @returns {number} - first cycle position which has not been queried yet
     */
    queried () {
        if (!this.scheduler.started) return 0;
        return Math.max(this.scheduler.now(), this.scheduler.lastEnd);
    }

    /**
     * @returns {number} - number of beats since start
     */
    beat () {
        return Math.floor(this.now() * this.beatsPerCycle);
    }

    /**
     * @param {string} name - track name
     * @param {Pattern} pattern - pattern to play
     */
    async play (name, pattern) {
        const generation = this.generation;
        await this.init();
        if (generation !== this.generation) return;
        this.tracks.set(name, pattern, this.queried());
        this.pattern = this.tracks.pattern();
        await this.scheduler.setPattern(this.pattern, true);
    }

    /**
     * @param {string} name - track name
     */
    stopTrack (name) {
        this.tracks.remove(name, this.queried());
        this.pattern = this.tracks.pattern();
        if (this.scheduler.started) this.scheduler.setPattern(this.pattern);
    }

    stopAll () {
        this.generation++;
        this.tracks.clear();
        this.pattern = null;
        this.soundTimers.forEach(timer => clearTimeout(timer));
        this.soundTimers.clear();
        if (this.scheduler.started) this.scheduler.stop();
    }

    /**
     * @param {number} bpm - beats per minute
     */
    setBpm (bpm) {
        this.scheduler.setCps(bpm / 60 / this.beatsPerCycle);
    }

    /**
     * @returns {number} - beats per minute
     */
    get bpm () {
        return this.scheduler.cps * 60 * this.beatsPerCycle;
    }

    /**
     * Change the number of beats in a cycle keeping the BPM.
     * @param {number} beats - beats per cycle
     */
    setBeatsPerCycle (beats) {
        const bpm = this.bpm;
        this.beatsPerCycle = beats;
        this.setBpm(bpm);
    }
}
