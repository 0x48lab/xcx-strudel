/**
 * Make a drawer of an oscilloscope.
 * @param {AnalyserNode} analyser - source of the waveform
 * @param {string} [color] - line color
 * @returns {Function} - drawer(ctx, width, height)
 */
export const scopeDrawer = (analyser, color = '#4c97ff') => {
    const buffer = new Float32Array(analyser.fftSize);
    return (ctx, width, height) => {
        analyser.getFloatTimeDomainData(buffer);
        // start at a rising zero crossing so the wave stands still
        let start = 0;
        for (let i = 1; i < buffer.length / 2; i++) {
            if (buffer[i - 1] < 0 && buffer[i] >= 0) {
                start = i;
                break;
            }
        }
        const length = buffer.length / 2;
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.beginPath();
        for (let i = 0; i < length; i++) {
            const x = (i / length) * width;
            const y = (0.5 - (buffer[start + i] / 2)) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    };
};
