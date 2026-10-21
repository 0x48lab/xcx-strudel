import {getAudioContext, registerSound} from 'superdough';

/**
 * Drum sounds made with oscillators and noise.
 * They need no sample files, so they work offline and have no license issue.
 */

let noiseBuffer = null;

/**
 * @param {BaseAudioContext} ctx - audio context
 * @returns {AudioBuffer} - one second of white noise
 */
const getNoise = ctx => {
    if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
        noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2) - 1;
    }
    return noiseBuffer;
};

/**
 * Gain envelope which jumps to `peak` and decays exponentially.
 * @param {AudioParam} param - gain parameter
 * @param {number} t - start time
 * @param {number} peak - peak gain
 * @param {number} decay - decay time in seconds
 */
const decayEnvelope = (param, t, peak, decay) => {
    param.setValueAtTime(peak, t);
    param.exponentialRampToValueAtTime(0.0001, t + decay);
};

/**
 * @param {BaseAudioContext} ctx - audio context
 * @param {number} t - start time
 * @param {number} decay - decay time
 * @returns {AudioBufferSourceNode} - noise source which starts at t
 */
const noiseSource = (ctx, t, decay) => {
    const src = ctx.createBufferSource();
    src.buffer = getNoise(ctx);
    src.loop = true;
    src.start(t);
    src.stop(t + decay + 0.05);
    return src;
};

/**
 * Pitched sine drum such as a kick or a tom.
 * @param {number} from - start frequency
 * @param {number} to - end frequency
 * @param {number} decay - decay time
 * @returns {Function} - voice
 */
const pitchedDrum = (from, to, decay) => (ctx, t, out) => {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + (decay * 0.4));
    const amp = ctx.createGain();
    decayEnvelope(amp.gain, t, 1, decay);
    osc.connect(amp).connect(out);
    osc.start(t);
    osc.stop(t + decay + 0.05);
    return [osc];
};

/**
 * Filtered noise such as a hi-hat.
 * @param {BiquadFilterType} type - filter type
 * @param {number} freq - filter frequency
 * @param {number} decay - decay time
 * @param {number} peak - peak gain
 * @returns {Function} - voice
 */
const noiseDrum = (type, freq, decay, peak) => (ctx, t, out) => {
    const src = noiseSource(ctx, t, decay);
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const amp = ctx.createGain();
    decayEnvelope(amp.gain, t, peak, decay);
    src.connect(filter).connect(amp)
        .connect(out);
    return [src];
};

const snare = (ctx, t, out) => {
    const body = pitchedDrum(220, 160, 0.1)(ctx, t, out);
    const noise = noiseDrum('highpass', 1500, 0.2, 0.8)(ctx, t, out);
    return body.concat(noise);
};

const clap = (ctx, t, out) => {
    const src = noiseSource(ctx, t, 0.3);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    const amp = ctx.createGain();
    // three quick bursts and a tail
    [0, 0.01, 0.02].forEach(d => {
        amp.gain.setValueAtTime(1, t + d);
        amp.gain.exponentialRampToValueAtTime(0.1, t + d + 0.009);
    });
    decayEnvelope(amp.gain, t + 0.03, 0.8, 0.2);
    src.connect(filter).connect(amp)
        .connect(out);
    return [src];
};

const rim = (ctx, t, out) => {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 1700;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1700;
    const amp = ctx.createGain();
    decayEnvelope(amp.gain, t, 0.6, 0.03);
    osc.connect(filter).connect(amp)
        .connect(out);
    osc.start(t);
    osc.stop(t + 0.08);
    return [osc];
};

/** Drum name and its voice. Names follow the Strudel sample names. */
export const DRUMS = {
    bd: pitchedDrum(150, 45, 0.4),
    sd: snare,
    hh: noiseDrum('highpass', 7000, 0.05, 0.5),
    oh: noiseDrum('highpass', 7000, 0.3, 0.5),
    cp: clap,
    rim: rim,
    lt: pitchedDrum(120, 80, 0.3),
    mt: pitchedDrum(180, 120, 0.25),
    ht: pitchedDrum(260, 180, 0.2),
    cr: noiseDrum('highpass', 5000, 1.2, 0.5)
};

/**
 * Register all drums to superdough.
 */
export const registerDrumSounds = () => {
    Object.entries(DRUMS).forEach(([name, voice]) => {
        registerSound(name, (t, value, onended) => {
            const ctx = getAudioContext();
            const out = ctx.createGain();
            const sources = voice(ctx, t, out);
            sources[sources.length - 1].onended = () => {
                out.disconnect();
                onended();
            };
            return {
                node: out,
                stop: time => sources.forEach(src => {
                    try {
                        src.stop(time);
                    } catch (e) {
                        // already stopped
                    }
                })
            };
        }, {type: 'synth', prebake: true});
    });
};
