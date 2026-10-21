import {cat, n as nControl, note, perlin, rand, s, saw, seq, silence, sine, square, stack, tri} from '@strudel/core';
import {mini, mini2ast} from '@strudel/mini';
// registers Pattern.prototype.scale and transpose
import '@strudel/tonal';

/**
 * Pattern AST built by blocks.
 * Every node compiles to a Strudel Pattern and converts to Strudel code.
 *
 * Node shapes:
 *   {type: 'mini', code, control?}   mini-notation leaf. control is 's', 'note' or 'n'.
 *   {type: 'silence'}
 *   {type: 'call', fn, args}         top level function such as seq or stack
 *   {type: 'method', target, fn, args} method chain such as .fast(2)
 *
 * A method argument is a number, a string, a transform {fn, args},
 * which becomes a function such as `x => x.rev()`,
 * or a signal {signal, min, max, cycles}, which becomes `sine.range(min, max).slow(cycles)`.
 */

const NODE = Symbol('strudel-ast');

/** Functions which combine patterns. */
const CALLS = {seq, stack, cat};

/** Functions which make a pattern from mini-notation. */
const CONTROLS = {s, note, n: nControl};

/**
 * @param {object} table - table of allowed names
 * @param {*} key - name
 * @returns {boolean} - true if the name is in the table itself, not in its prototype
 */
const has = (table, key) => typeof key === 'string' && Object.prototype.hasOwnProperty.call(table, key);

/** Continuous signals which can be values of effects. */
const SIGNALS = {sine, saw, square, tri, rand, perlin};

/** Limits which keep a shared project from freezing the browser. */
export const LIMIT = {
    CODE_LENGTH: 4000,
    MODIFIER: 64,
    SLOW: 1024,
    EVENTS: 4096, // estimated events in a cycle
    DEPTH: 32
};

const number = (min, max) => ({kind: 'number', min, max});
const value = (min, max) => ({kind: 'value', min, max});
const name = pattern => ({kind: 'name', pattern});
const letters = pattern => ({kind: 'letters', pattern});
const TRANSFORM = {kind: 'transform'};

const SOUND_NAME = /^[a-z0-9_]+$/i;
const BANK_NAME = /^[a-z0-9]+$/i;
const VOWEL_CODE = /^[aeiou\s<>[\]~,*!@/.-]+$/;
const SCALE_NAME = /^[A-G](?:#|b)?\d?:[a-z]+(?::[a-z]+)*$/;

/**
 * Methods and the specs of their arguments.
 * Nothing else can be called on a pattern.
 */
const METHODS = {
    fast: [number(0, LIMIT.MODIFIER)],
    slow: [number(0.01, LIMIT.SLOW)],
    ply: [number(1, 8)],
    rev: [],
    every: [number(1, 16), TRANSFORM],
    s: [name(SOUND_NAME)],
    scale: [name(SCALE_NAME)],
    lpf: [value(20, 20000)],
    hpf: [value(20, 20000)],
    room: [value(0, 10)],
    delay: [value(0, 1)],
    gain: [value(0, 4)],
    pan: [value(0, 1)],
    crush: [value(1, 16)],
    speed: [value(-4, 4)],
    attack: [value(0, 4)],
    release: [value(0, 8)],
    vowel: [letters(VOWEL_CODE)],
    bank: [name(BANK_NAME)],
    degradeBy: [number(0, 1)],
    sometimes: [TRANSFORM],
    euclid: [number(1, LIMIT.MODIFIER), number(1, LIMIT.MODIFIER)],
    jux: [TRANSFORM],
    off: [number(0, 1), TRANSFORM],
    chop: [number(1, 16)],
    transpose: [number(-24, 24)],
    arp: [value(0, 16)],
    add: [value(-48, 48)],
    superimpose: [TRANSFORM],
    trancegate: [number(0, 1), number(0, 1000), number(1, 16)],
    clip: [value(0, 4)],
    decay: [value(0, 4)],
    sustain: [value(0, 1)],
    delaytime: [value(0, 2)],
    delayfeedback: [value(0, 0.95)],
    lpenv: [value(-8, 8)],
    lpq: [value(0, 30)],
    lpd: [value(0, 2)],
    lps: [value(0, 1)],
    detune: [value(0, 2)],
    unison: [value(1, 8)]
};

/** Methods which can be used in a transform. */
const TRANSFORMS = ['rev', 'fast', 'slow', 'ply', 'transpose'];

/**
 * How many times a method multiplies events in a cycle, for the estimate.
 * Transforms are counted separately.
 */
const MULTIPLIERS = {
    fast: args => args[0],
    ply: args => args[0],
    chop: args => args[0],
    euclid: args => args[1],
    jux: () => 2,
    off: () => 2,
    superimpose: () => 2,
    trancegate: () => 16
};


/**
 * @param {object} props - node properties
 * @returns {object} - AST node
 */
const node = props => {
    const n = Object.assign({[NODE]: true}, props);
    // Scratch shows reporter values as strings, so show them as Strudel code.
    // toCode is called later, after the module has been evaluated.
    // eslint-disable-next-line no-use-before-define
    Object.defineProperty(n, 'toString', {value: () => safeCode(n)});
    return n;
};

/**
 * @param {*} v - any value
 * @returns {boolean} - true if the value is an AST node
 */
export const isNode = v => !!(v && v[NODE]);

const NOTE_WORD = /^[a-g](?:#|b|s|f)*-?\d*$/i;
const NUMBER_WORD = /^-?\d+(?:\.\d+)?$/;

/**
 * Decide the control of a mini-notation which was typed without one.
 * Notes and numbers go to `note`, others go to `s`.
 * @param {string} code - mini-notation
 * @returns {string} - 's' or 'note'
 */
export const classify = code => {
    const values = code
        .replace(/[*/@!:%?]\d+(?:\.\d+)?/g, ' ') // modifiers such as *2 or @3
        .replace(/\(\s*\d+\s*,\s*\d+\s*(?:,\s*\d+\s*)?\)/g, ' '); // euclid such as (3,8)
    const words = values.match(/[A-Za-z0-9#.-]+/g) || [];
    if (words.length && words.every(w => NOTE_WORD.test(w) || NUMBER_WORD.test(w))) return 'note';
    return 's';
};

/**
 * Control of the values of a pattern, to know how to add numbers to it.
 * @param {object} n - node
 * @returns {?string} - 's', 'note' or 'n', or null for silence
 */
export const controlOf = n => {
    switch (n.type) {
    case 'mini':
        return n.control || classify(n.code);
    case 'call': {
        // notes are found first, so that numbers can be added to a stack of drums and notes
        const controls = n.args.map(controlOf);
        return controls.find(c => c === 'note' || c === 'n') || controls.find(c => c) || null;
    }
    case 'method':
        // scale turns steps into notes
        return n.fn === 'scale' ? 'note' : controlOf(n.target);
    default:
        return null;
    }
};

/**
 * @param {object} target - node to add to
 * @returns {string} - 'note' or 'n'
 */
const addControl = target => {
    const control = controlOf(target);
    if (control !== 'note' && control !== 'n') throw new Error('numbers can be added only to notes');
    return control;
};

/**
 * @param {string} code - mini-notation
 * @param {string} [control] - 's', 'note' or 'n'
 * @returns {object} - mini node
 */
export const miniNode = (code, control) => node({type: 'mini', code: String(code), control});

/** @returns {object} - silence node */
export const silenceNode = () => node({type: 'silence'});

const isTransform = a => !!a && typeof a === 'object' && typeof a.fn === 'string' && Array.isArray(a.args) &&
    a.args.every(x => typeof x === 'number' || typeof x === 'string');
const isSignal = a => !!a && typeof a === 'object' && typeof a.signal === 'string' &&
    ['min', 'max', 'cycles'].every(k => typeof a[k] === 'number');
const isMethodArg = a => typeof a === 'number' || typeof a === 'string' || isTransform(a) || isSignal(a);

/**
 * @param {string} shape - one of SIGNALS
 * @param {number} min - lowest value
 * @param {number} max - highest value
 * @param {number} cycles - cycles of a wave
 * @returns {object} - signal argument which shows itself as Strudel code
 */
export const signalArg = (shape, min, max, cycles) => {
    const a = {signal: shape, min, max, cycles};
    // eslint-disable-next-line no-use-before-define
    Object.defineProperty(a, 'toString', {value: () => safeCode(a, argCode)});
    return a;
};

/**
 * Make a node again from a plain object.
 * A node stored in a Scratch variable is saved as JSON and loses its identity.
 * The function names are checked again when it is compiled.
 * @param {*} v - plain object
 * @param {number} [depth] - depth of the node, to stop at too deep objects
 * @returns {?object} - node, or null if the value is not a node shape
 */
const revive = (v, depth = 0) => {
    if (!v || typeof v !== 'object' || depth > LIMIT.DEPTH) return null;
    switch (v.type) {
    case 'mini':
        if (typeof v.code !== 'string') return null;
        if (v.control && !has(CONTROLS, v.control)) return null;
        return miniNode(v.code, v.control);
    case 'silence':
        return silenceNode();
    case 'call': {
        if (typeof v.fn !== 'string' || !Array.isArray(v.args)) return null;
        const args = v.args.map(a => revive(a, depth + 1));
        if (args.some(a => !a)) return null;
        return node({type: 'call', fn: v.fn, args});
    }
    case 'method': {
        const target = revive(v.target, depth + 1);
        if (!target || typeof v.fn !== 'string' || !Array.isArray(v.args)) return null;
        if (!v.args.every(isMethodArg)) return null;
        return node({type: 'method', target, fn: v.fn, args: v.args});
    }
    default:
        return null;
    }
};

/**
 * Convert a block argument to a node.
 * Blank strings are null, other strings are mini-notation.
 * @param {*} v - block argument
 * @returns {?object} - node or null
 */
export const toNode = v => {
    if (isNode(v)) return v;
    if (v === null || typeof v === 'undefined') return null;
    const revived = revive(v);
    if (revived) return revived;
    const code = String(v).trim();
    if (code === '') return null;
    // a rest of the sound menu
    if (code === '~' || code === '-') return silenceNode();
    return miniNode(code);
};

/**
 * Use notes and numbers of a pattern as steps of a scale, for the scale block.
 * @param {object} n - node
 * @returns {object} - node whose numbers are steps (n)
 */
export const asSteps = n => {
    switch (n.type) {
    case 'mini':
        return n.control === 's' || n.control === 'n' ? n : miniNode(n.code, 'n');
    case 'call':
        return node({type: 'call', fn: n.fn, args: n.args.map(asSteps)});
    case 'method':
        return node({type: 'method', target: asSteps(n.target), fn: n.fn, args: n.args});
    default:
        return n;
    }
};

/**
 * @param {string} fn - one of seq, stack, cat
 * @param {Array} args - block arguments
 * @returns {object} - call node
 */
export const callNode = (fn, args) => {
    const nodes = args.map(toNode).filter(x => x);
    if (nodes.length === 0) return silenceNode();
    if (nodes.length === 1) return nodes[0];
    return node({type: 'call', fn, args: nodes});
};

/**
 * @param {*} target - pattern argument
 * @param {string} fn - method name
 * @param {Array<number|string|object>} args - plain arguments or transforms
 * @returns {object} - method node
 */
export const methodNode = (target, fn, args) => node({
    type: 'method',
    target: toNode(target) || silenceNode(),
    fn,
    args
});

const quote = code => JSON.stringify(code);

/**
 * Write a number into code. Only finite numbers are written.
 * @param {number} x - number
 * @returns {string} - code
 */
const numberCode = x => {
    if (typeof x !== 'number' || !Number.isFinite(x)) throw new Error(`not a number: ${x}`);
    return String(x);
};

/**
 * Rhythm of a trance gate: 16th notes picked by random numbers with a seed,
 * repeating `length` cycles from the cycle `seed`.
 * @param {number} density - 0 to 1, more notes with a larger number
 * @param {number} seed - cycle of random numbers to use
 * @param {number} length - cycles to repeat
 * @returns {string} - Strudel code
 */
const gateCode = (density, seed, length) =>
    `rand.mul(${numberCode(density + 0.5)}).round().seg(16).rib(${numberCode(seed)}, ${numberCode(length)})`;
/**
 * @param {number} density - 0 to 1
 * @param {number} seed - cycle of random numbers to use
 * @param {number} length - cycles to repeat
 * @returns {Pattern} - the same rhythm as gateCode
 */
const gatePattern = (density, seed, length) => rand.mul(density + 0.5).round()
    .seg(16)
    .rib(seed, length);

/**
 * Write a method argument into code. Names are checked here too, so that
 * nothing but allowed names reaches code even if a node was not compiled.
 * @param {*} a - method argument
 * @returns {string} - code
 */
const argCode = a => {
    if (typeof a === 'number') return numberCode(a);
    if (typeof a === 'string') return quote(a);
    if (isSignal(a)) {
        if (!has(SIGNALS, a.signal)) throw new Error(`unknown signal: ${a.signal}`);
        return `${a.signal}.range(${numberCode(a.min)}, ${numberCode(a.max)}).slow(${numberCode(a.cycles)})`;
    }
    if (isTransform(a) && TRANSFORMS.includes(a.fn)) return `x => x.${a.fn}(${a.args.map(argCode).join(', ')})`;
    throw new Error('a bad argument');
};

/**
 * @param {object} n - node
 * @returns {string} - Strudel code
 */
export const toCode = n => {
    switch (n.type) {
    case 'mini': {
        const control = n.control || classify(n.code);
        if (!has(CONTROLS, control)) throw new Error(`unknown control: ${control}`);
        return `${control}(${quote(n.code)})`;
    }
    case 'silence':
        return 'silence';
    case 'call':
        if (!has(CALLS, n.fn)) throw new Error(`unknown function: ${n.fn}`);
        return `${n.fn}(${n.args.map(toCode).join(', ')})`;
    case 'method':
        if (!has(METHODS, n.fn)) throw new Error(`unknown method: ${n.fn}`);
        if (n.fn === 'add') {
            // the number is added to the same control, such as .add(note("<0 7>"))
            return `${toCode(n.target)}.add(${addControl(n.target)}(${argCode(n.args[0])}))`;
        }
        if (n.fn === 'trancegate') {
            return `${toCode(n.target)}.struct(${gateCode(...n.args)}).clip(0.7)`;
        }
        return `${toCode(n.target)}.${n.fn}(${n.args.map(argCode).join(', ')})`;
    default:
        throw new Error(`unknown node: ${n.type}`);
    }
};

/**
 * Code for showing a value in Scratch. A broken value is not shown as code.
 * @param {*} v - node or argument
 * @param {Function} [write] - toCode or argCode
 * @returns {string} - code, or a note that it is broken
 */
const safeCode = (v, write = toCode) => {
    try {
        return write(v);
    } catch (e) {
        return '(broken pattern)';
    }
};

/**
 * Check numbers which multiply events, such as bd*16, bd!4, bd/2 or bd(3,8).
 * Multipliers written as patterns, such as bd*<1 2>, are estimated by their largest number.
 * @param {string} code - mini-notation
 */
const checkMini = code => {
    if (code.length > LIMIT.CODE_LENGTH) throw new Error('mini-notation is too long');
    const numbers = [];
    code.replace(/[*/!%]\s*(\d+(?:\.\d+)?)/g, (_, num) => numbers.push(num));
    code.replace(/\(([\d\s,.]+)\)/g, (_, list) => numbers.push(...list.split(',')));
    if (numbers.some(num => Number(num) > LIMIT.MODIFIER)) {
        throw new Error(`a number in mini-notation is too large (max ${LIMIT.MODIFIER})`);
    }
    code.replace(/(-?\d+)\s*\.\.\s*(-?\d+)/g, (_, a, b) => {
        if (Math.abs(Number(b) - Number(a)) > LIMIT.MODIFIER) throw new Error('a range is too large');
    });
};

/**
 * The largest number in a node of the parser, such as 4 in <1 [2 4]>.
 * @param {object} parsed - node of mini2ast
 * @returns {number} - the largest absolute number, or Infinity if something is not a number
 */
const atomNumber = parsed => {
    if (!parsed || typeof parsed !== 'object') return Infinity;
    if (parsed.type_ === 'atom') {
        const num = Number(parsed.source_);
        return Number.isFinite(num) ? Math.abs(num) : Infinity;
    }
    if (parsed.type_ === 'element') return atomNumber(parsed.source_);
    if (parsed.type_ === 'pattern') return Math.max(0, ...(parsed.source_ || []).map(atomNumber));
    return Infinity;
};

/**
 * A number which multiplies events, with the same limit as plain numbers,
 * also for numbers in a pattern such as *<1 2>.
 * @param {object} amount - node of mini2ast
 * @returns {number} - the largest number
 */
const multiplier = amount => {
    const num = atomNumber(amount);
    if (num > LIMIT.MODIFIER) throw new Error(`a number in mini-notation is too large (max ${LIMIT.MODIFIER})`);
    return num;
};

/**
 * Upper bound of events in a cycle of a node of the mini-notation parser.
 * Nested multipliers multiply, side by side events add up and alternatives take the largest.
 * @param {object} parsed - node of mini2ast
 * @returns {number} - estimated events
 */
const parsedWeight = parsed => {
    if (!parsed || typeof parsed !== 'object') return 1;
    switch (parsed.type_) {
    case 'atom':
        return 1;
    case 'element': {
        const options = parsed.options_ || {};
        let weight = parsedWeight(parsed.source_) * Math.max(1, Number(options.reps) || 1);
        (options.ops || []).forEach(op => {
            const args = op.arguments_ || {};
            if (op.type_ === 'stretch' && args.type === 'fast') weight *= multiplier(args.amount);
            // euclid makes at most `step` events from one event
            if (op.type_ === 'bjorklund') weight *= Math.max(multiplier(args.step), multiplier(args.pulse));
            if (op.type_ === 'range') weight *= Math.abs(atomNumber(args.element) - atomNumber(parsed.source_)) + 1;
        });
        return weight;
    }
    case 'pattern': {
        const weights = (parsed.source_ || []).map(parsedWeight);
        const alignment = parsed.arguments_ && parsed.arguments_.alignment;
        if (alignment === 'polymeter_slowcat' || alignment === 'rand') return Math.max(1, ...weights);
        const sum = weights.reduce((a, b) => a + b, 0);
        if (alignment !== 'polymeter') return sum;
        // a polymeter repeats its parts to the longest one, or to the steps of {...}%steps
        const steps = parsed.arguments_.stepsPerCycle ? multiplier(parsed.arguments_.stepsPerCycle) : 1;
        return sum * Math.max(1, steps, ...weights);
    }
    default:
        return 1;
    }
};

/**
 * Upper bound of events in a cycle of mini-notation.
 * @param {string} code - checked mini-notation
 * @returns {number} - estimated events
 */
const miniWeight = code => parsedWeight(mini2ast(`"${code}"`));

/**
 * @param {*} a - method argument
 * @returns {number} - how many times the argument multiplies events
 */
const argWeight = a => {
    if (typeof a === 'string') return miniWeight(a);
    if (isTransform(a) && Object.prototype.hasOwnProperty.call(MULTIPLIERS, a.fn)) {
        return Math.max(1, Number(MULTIPLIERS[a.fn](a.args)) || 1);
    }
    return 1;
};

/**
 * Upper bound of events in a cycle, to reject patterns which freeze the browser.
 * @param {object} n - node
 * @param {number} depth - depth of the node
 * @returns {number} - estimated events in a cycle
 */
const estimate = (n, depth = 0) => {
    if (depth > LIMIT.DEPTH) throw new Error('the pattern is too deep');
    switch (n.type) {
    case 'mini':
        return miniWeight(n.code);
    case 'call':
        return n.args.reduce((sum, a) => sum + estimate(a, depth + 1), 0);
    case 'method': {
        let events = estimate(n.target, depth + 1);
        if (Object.prototype.hasOwnProperty.call(MULTIPLIERS, n.fn)) {
            events *= Math.max(1, Number(MULTIPLIERS[n.fn](n.args)) || 1);
        }
        // a pattern of values splits events, such as .lpf("300*4"), and a transform can add events
        n.args.forEach(a => {
            events *= argWeight(a);
        });
        return events;
    }
    default:
        return 1;
    }
};

// numbers and the symbols of mini-notation, such as <> [] , * ! @ / | ?
const VALUE_CODE = /^[\d\s.<>[\]~,*!@/|?-]+$/;

/**
 * @param {string} fn - method name
 * @param {object} spec - argument spec
 * @param {*} a - argument
 * @returns {*} - argument for Strudel
 */
const checkArg = (fn, spec, a) => {
    const fail = () => {
        throw new Error(`a bad argument for ${fn}: ${JSON.stringify(a)}`);
    };
    const inRange = x => Number.isFinite(x) && x >= spec.min && x <= spec.max;
    switch (spec.kind) {
    case 'number':
        if (typeof a !== 'number' || !inRange(a)) fail();
        return a;
    case 'value':
        if (typeof a === 'number') {
            if (!inRange(a)) fail();
            return a;
        }
        if (isSignal(a)) {
            if (!Object.prototype.hasOwnProperty.call(SIGNALS, a.signal)) fail();
            if (!inRange(a.min) || !inRange(a.max) || !(a.cycles >= 0.25 && a.cycles <= LIMIT.MODIFIER)) fail();
            return SIGNALS[a.signal].range(a.min, a.max).slow(a.cycles);
        }
        // mini-notation of numbers such as "<200 2000>"
        if (typeof a !== 'string' || !VALUE_CODE.test(a)) fail();
        checkMini(a);
        // numbers such as 1, 0.5 and .5, except multipliers such as *4
        if (!(a.replace(/[*/!@]\s*\d+(?:\.\d+)?/g, ' ').match(/-?(?:\d+(?:\.\d*)?|\.\d+)/g) || [])
            .every(x => inRange(Number(x)))) fail();
        // the Strudel REPL turns string literals into mini-notation
        return mini(a);
    case 'name':
        if (typeof a !== 'string' || !spec.pattern.test(a)) fail();
        return a;
    case 'letters':
        // mini-notation of letters such as "<a e i>"
        if (typeof a !== 'string' || !spec.pattern.test(a)) fail();
        checkMini(a);
        return mini(a);
    case 'transform': {
        if (!isTransform(a) || !TRANSFORMS.includes(a.fn)) fail();
        // eslint-disable-next-line no-use-before-define
        const args = checkArgs(a.fn, a.args);
        return x => x[a.fn](...args);
    }
    default:
        return fail();
    }
};

/**
 * @param {string} fn - method name
 * @param {Array} args - method arguments
 * @returns {Array} - arguments for Strudel
 */
const checkArgs = (fn, args) => {
    if (!Object.prototype.hasOwnProperty.call(METHODS, fn)) throw new Error(`unknown method: ${fn}`);
    const specs = METHODS[fn];
    if (args.length !== specs.length) throw new Error(`${fn} needs ${specs.length} arguments`);
    return specs.map((spec, i) => checkArg(fn, spec, args[i]));
};

/**
 * @param {object} n - node
 * @returns {Pattern} - Strudel pattern
 */
const compileNode = n => {
    switch (n.type) {
    case 'mini': {
        checkMini(n.code);
        const control = n.control || classify(n.code);
        if (!Object.prototype.hasOwnProperty.call(CONTROLS, control)) throw new Error(`unknown control: ${control}`);
        return CONTROLS[control](mini(n.code));
    }
    case 'silence':
        return silence;
    case 'call':
        if (!Object.prototype.hasOwnProperty.call(CALLS, n.fn)) throw new Error(`unknown function: ${n.fn}`);
        return CALLS[n.fn](...n.args.map(compileNode));
    case 'method': {
        const args = checkArgs(n.fn, n.args);
        const target = compileNode(n.target);
        if (n.fn === 'add') return target.add(CONTROLS[addControl(n.target)](args[0]));
        if (n.fn === 'trancegate') return target.struct(gatePattern(...args)).clip(0.7);
        return target[n.fn](...args);
    }
    default:
        throw new Error(`unknown node: ${n.type}`);
    }
};

/**
 * @param {object} n - node
 * @returns {Pattern} - Strudel pattern
 */
export const compile = n => {
    const pattern = compileNode(n);
    // estimate after compiling, so that the arguments have been checked
    if (estimate(n) > LIMIT.EVENTS) throw new Error(`the pattern has too many events (max ${LIMIT.EVENTS} in a cycle)`);
    return pattern;
};
