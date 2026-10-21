const BARS = 48;
const MIN_FREQ = 80; // lower bars would share the same bins
const MAX_FREQ = 16000;

/**
 * Make a drawer of a spectrum. Bars are spaced on a log scale like a piano.
 * @param {AnalyserNode} analyser - source of the sound
 * @param {string} [color] - bar color
 * @returns {Function} - drawer(ctx, width, height)
 */
export const spectrumDrawer = (analyser, color = '#4c97ff') => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const nyquist = analyser.context.sampleRate / 2;
    const binOf = freq => Math.min(data.length - 1, Math.round((freq / nyquist) * data.length));
    return (ctx, width, height) => {
        analyser.getByteFrequencyData(data);
        const barWidth = width / BARS;
        ctx.fillStyle = color;
        for (let i = 0; i < BARS; i++) {
            const from = binOf(MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, i / BARS));
            const to = Math.max(from + 1, binOf(MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, (i + 1) / BARS)));
            let peak = 0;
            for (let b = from; b < to; b++) peak = Math.max(peak, data[b]);
            const barHeight = (peak / 255) * height;
            ctx.fillRect((i * barWidth) + 1, height - barHeight, barWidth - 2, barHeight);
        }
    };
};
