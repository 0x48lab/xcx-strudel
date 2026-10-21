import {noteToMidi} from '@strudel/core';

/** Views: a piano roll scrolls 4 cycles, a punch card shows the current cycle. */
export const VIEW = {
    PIANOROLL: {cycles: 4, scroll: true, dots: false},
    PUNCHCARD: {cycles: 1, scroll: false, dots: true}
};
const PLAYHEAD = 0.5; // position of now from the left when scrolling
const COLORS = ['#4c97ff', '#ff6680', '#59c059', '#ffab19', '#9966ff', '#ff8c1a', '#5cb1d6', '#cf63cf'];

/**
 * @param {object} value - hap value
 * @returns {number|string} - row key, a MIDI number for notes or a sound name
 */
export const rowKey = value => {
    if (typeof value !== 'object' || value === null) return String(value);
    // n of a sound is the number of the sample, not a pitch
    const pitch = typeof value.note === 'undefined' && typeof value.s === 'undefined' ? value.n : value.note;
    if (typeof pitch === 'number') return pitch;
    if (typeof pitch === 'string') {
        try {
            return noteToMidi(pitch);
        } catch (e) {
            return pitch;
        }
    }
    return String(value.s);
};

const compareKeys = (a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'number') return 1; // notes above drums
    if (typeof b === 'number') return -1;
    return a < b ? -1 : (a > b ? 1 : 0);
};

/**
 * @param {number} now - current cycle position
 * @param {object} view - one of VIEW
 * @returns {number} - cycle position at the left edge
 */
export const leftEdge = (now, view) => (view.scroll ? now - (view.cycles * PLAYHEAD) : Math.floor(now));

/**
 * Lay out haps as rectangles. Rows are the distinct notes or sounds, low at the bottom.
 * @param {Array<Hap>} haps - haps with whole spans
 * @param {number} now - current cycle position
 * @param {number} width - width of the canvas
 * @param {number} height - height of the canvas
 * @param {object} [view] - one of VIEW
 * @returns {Array<object>} - rectangles {x, y, w, h, key, active}
 */
export const layout = (haps, now, width, height, view = VIEW.PIANOROLL) => {
    const from = leftEdge(now, view);
    const cycles = view.cycles;
    const withKeys = haps.filter(hap => hap.whole).map(hap => ({hap, key: rowKey(hap.value)}));
    const keys = Array.from(new Set(withKeys.map(h => h.key))).sort(compareKeys);
    const rowHeight = height / Math.max(1, keys.length);
    return withKeys.map(({hap, key}) => {
        const begin = hap.whole.begin.valueOf();
        const end = hap.whole.end.valueOf();
        const row = keys.indexOf(key);
        return {
            x: ((begin - from) / cycles) * width,
            y: height - ((row + 1) * rowHeight),
            w: Math.max(1, ((end - begin) / cycles) * width),
            h: rowHeight,
            key,
            active: begin <= now && now < end
        };
    });
};

const colorOf = key => {
    const text = String(key);
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = ((hash * 31) + text.charCodeAt(i)) | 0;
    return COLORS[Math.abs(hash) % COLORS.length];
};

/**
 * Make a drawer of a piano roll or a punch card.
 * @param {Function} getPattern - returns the pattern which is playing
 * @param {Function} getNow - returns the current cycle position
 * @param {object} [view] - one of VIEW
 * @returns {Function} - drawer(ctx, width, height)
 */
export const pianorollDrawer = (getPattern, getNow, view = VIEW.PIANOROLL) => (ctx, width, height) => {
    const pattern = getPattern();
    if (!pattern) return;
    const now = getNow();
    const from = leftEdge(now, view);
    let haps;
    try {
        haps = pattern.queryArc(from, from + view.cycles);
    } catch (e) {
        return;
    }
    layout(haps, now, width, height, view).forEach(rect => {
        ctx.globalAlpha = rect.active ? 1 : 0.45;
        ctx.fillStyle = colorOf(typeof rect.key === 'number' ? 'note' : rect.key);
        if (view.dots) {
            const r = Math.max(2, Math.min(rect.h, rect.w) * 0.4);
            ctx.beginPath();
            ctx.arc(rect.x + (rect.w / 2), rect.y + (rect.h / 2), r, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(rect.x + 1, rect.y + 1, rect.w - 2, Math.max(1, rect.h - 2));
        }
    });
    ctx.globalAlpha = 1;
    // playhead
    ctx.fillStyle = '#575e75';
    const x = view.scroll ? width * PLAYHEAD : ((now - from) / view.cycles) * width;
    ctx.fillRect(x - 1, 0, 2, height);
};
