import Cast from '../../util/cast';
import translations from './translations.json';
import blockIcon from './block-icon.png';
import {code2hash, noteToMidi} from '@strudel/core';
import {BLOCKS, CHORDS, EFFECTS, LEVEL, MENUS, TRANSFORMS, levelOf} from './blocks.js';
import {
    LIMIT,
    asSteps,
    callNode,
    compile,
    methodNode,
    isNode,
    miniNode,
    randomNode,
    signalArg,
    silenceNode,
    soundsOf,
    toCode,
    usesMethod
} from '../../../core/ast.js';
import {Engine} from '../../../core/engine.js';
import {SpriteSounds} from '../../../core/sprite-sounds.js';
import {FILL_GAPS_CODE} from '../../../core/fill.js';
import {banksFor, loadBank} from '../../../core/sample-banks.js';
import {DRUM_KITS} from '../../../core/drum-kit.js';
import {LAYER, StageLayer} from '../../../viz/layer.js';
import {VIEW, pianorollDrawer} from '../../../viz/pianoroll.js';
import {scopeDrawer} from '../../../viz/scope.js';
import {spectrumDrawer} from '../../../viz/spectrum.js';

/**
 * Formatter which is used for translation.
 * This will be replaced which is used in the runtime.
 * @param {object} messageData - format-message object
 * @returns {string} - message for the locale
 */
let formatMessage = messageData => messageData.default;

/**
 * Setup format-message for this extension.
 */
const setupTranslations = () => {
    const localeSetup = formatMessage.setup();
    if (localeSetup && localeSetup.translations[localeSetup.locale]) {
        Object.assign(
            localeSetup.translations[localeSetup.locale],
            translations[localeSetup.locale]
        );
    }
};

const EXTENSION_ID = 'strudel';

const BPM_RANGE = [10, 400];

/** A note in the exported code when no track has been played. */
const NO_TRACK_COMMENT = '// no track has been played. Click the green flag, then open strudel.cc.';

/**
 * @param {*} value - block argument
 * @param {number} min - minimum
 * @param {number} max - maximum
 * @returns {number} - number in the range
 */
const clamp = (value, min, max) => Math.min(max, Math.max(min, Cast.toNumber(value)));

/**
 * Look up a table without the prototype, so that "constructor" is not found.
 * @param {object} table - table
 * @param {string} key - key
 * @returns {*} - value or null
 */
/**
 * @param {*} value - block argument
 * @returns {boolean} - true if the value is from the wave block
 */
const isSignal = value => !!value && typeof value === 'object' && typeof value.signal === 'string';

/**
 * Text which is safe in a line comment of JavaScript. Every character except
 * letters, digits, spaces, "_" and "-" is replaced, so no line terminator such as
 * U+2028 can end the comment.
 * @param {*} text - text such as a track name
 * @returns {string} - safe text
 */
const commentText = text => String(text).replace(/[^\p{L}\p{N} _-]/gu, '_')
    .slice(0, 40);

const NOTE_NAMES = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];

/**
 * @param {number} midi - MIDI note number
 * @returns {string} - note name such as c4
 */
const midiToName = midi => `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;

const own = (table, key) => (Object.prototype.hasOwnProperty.call(table, key) ? table[key] : null);

/**
 * URL to get this extension as a module.
 * When it was loaded as a module, 'extensionURL' will be replaced a URL which is retrieved from.
 * @type {string}
 */
let extensionURL = 'https://0x48lab.github.io/xcx-strudel/dist/strudel.mjs';

/**
 * Scratch 3.0 blocks for Strudel.
 */
class ExtensionBlocks {
    /**
     * A translation object which is used in this class.
     * @param {FormatObject} formatter - translation object
     */
    static set formatMessage (formatter) {
        formatMessage = formatter;
        if (formatMessage) setupTranslations();
    }

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return formatMessage({
            id: 'strudel.name',
            default: 'Strudel',
            description: 'name of the extension'
        });
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return EXTENSION_ID;
    }

    /**
     * URL to get this extension.
     * @type {string}
     */
    static get extensionURL () {
        return extensionURL;
    }

    /**
     * Set URL to get this extension.
     * The extensionURL will be changed to the URL of the loading server.
     * @param {string} url - URL
     */
    static set extensionURL (url) {
        extensionURL = url;
    }

    /**
     * Construct a set of blocks for Strudel.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        if (runtime.formatMessage) {
            // Replace 'formatMessage' to a formatter which is used in the runtime.
            formatMessage = runtime.formatMessage;
        }

        /** @type {Engine} */
        this._engine = null;
        /** @type {StageLayer} */
        this._layer = null;
        this.spriteSounds = new SpriteSounds();
        /** Strudel code of each track which is playing. */
        this.trackCodes = new Map();
        /** Tracks which use the trance gate, whose code needs fillGaps. */
        this.trackFills = new Set();
        /** The latest play request of each track, to drop older requests which finish loading later. */
        this.playTokens = new Map();
        /** Loader of sample maps, which tests can replace. */
        this.loadBank = loadBank;
        /** Blocks above this level are hidden in the palette. */
        this.level = LEVEL.BEGINNER;

        // expose this instance for other extensions and debugging
        runtime[`ext_${EXTENSION_ID}`] = this;
        // the stop sign keeps the code of the tracks, so that it can be opened in strudel.cc after stopping.
        // the green flag stops all first, then starts, so the code is forgotten at the start.
        runtime.on('PROJECT_STOP_ALL', () => this.stopSound());
        runtime.on('PROJECT_START', () => this.forgetTracks());
        runtime.on('PROJECT_LOADED', () => this.adjustLevelToProject());
    }

    /**
     * @returns {Engine} - engine which is created on first use
     */
    get engine () {
        if (!this._engine) {
            this._engine = new Engine(this.runtime.audioEngine.audioContext);
        }
        return this._engine;
    }

    /**
     * @returns {?StageLayer} - layer for pictures of sound, or null without a renderer
     */
    get layer () {
        if (!this._layer && this.runtime.renderer) {
            this._layer = new StageLayer(this.runtime.renderer);
        }
        return this._layer;
    }

    /**
     * Show the blocks of the level which the loaded project uses.
     */
    adjustLevelToProject () {
        let used = LEVEL.BEGINNER;
        this.runtime.targets.forEach(target => {
            Object.values(target.blocks._blocks).forEach(block => {
                if (block.opcode.startsWith(`${EXTENSION_ID}_`)) {
                    used = Math.max(used, levelOf(block.opcode.slice(EXTENSION_ID.length + 1)));
                }
            });
        });
        // a new project starts from its own level, not from the level of the previous project
        this.changeLevel(used);
    }

    /**
     * @param {number} level - new level
     */
    changeLevel (level) {
        if (level === this.level) return;
        this.level = level;
        this.runtime.requestToolboxExtensionsUpdate();
    }

    /**
     * @param {object} block - block definition
     * @returns {object} - block info for Scratch
     */
    blockInfo (block) {
        const info = Object.assign({}, block, {
            text: formatMessage({
                id: `${EXTENSION_ID}.${block.opcode}`,
                default: block.text,
                description: `text of the block "${block.opcode}"`
            }),
            hideFromPalette: !!block.hidden || block.level > this.level ||
                (typeof block.maxLevel === 'number' && this.level > block.maxLevel)
        });
        delete info.level;
        delete info.maxLevel;
        delete info.inTrack;
        delete info.hidden;
        return info;
    }

    /**
     * @returns {object} - menus for Scratch
     */
    menuInfo () {
        const menus = {};
        menus.spriteSound = {acceptReporters: true, items: 'getSpriteSoundMenu'};
        menus.list = {acceptReporters: false, items: 'getListMenu'};
        Object.entries(MENUS).forEach(([name, menu]) => {
            menus[name] = {
                acceptReporters: menu.acceptReporters,
                items: menu.items.map(([value, text, group = menu.group]) => ({
                    value,
                    text: formatMessage({
                        id: `${EXTENSION_ID}.menu.${group}.${value}`,
                        default: text,
                        description: `menu item of ${group}`
                    })
                }))
            };
        });
        return menus;
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        setupTranslations();
        return {
            id: ExtensionBlocks.EXTENSION_ID,
            name: ExtensionBlocks.EXTENSION_NAME,
            extensionURL: ExtensionBlocks.extensionURL,
            blockIconURI: blockIcon,
            showStatusButton: false,
            blocks: BLOCKS.map(block => (typeof block === 'string' ? block : this.blockInfo(block))),
            menus: this.menuInfo()
        };
    }

    setLevel (args) {
        const level = Math.round(Cast.toNumber(args.LEVEL));
        if (level >= LEVEL.BEGINNER && level <= LEVEL.MASTER) this.changeLevel(level);
    }

    /**
     * The C block of a track. The blocks in it build the pattern from the top, then the track plays it.
     * The branch runs as a loop of one time, so that this block runs again after the branch.
     * @param {object} args - TRACK
     * @param {object} util - utility of the block
     * @returns {?Promise} - a promise which is resolved when the track starts
     */
    track (args, util) {
        const frame = util.stackFrame;
        if (!frame.strudelTrack) {
            frame.strudelTrack = {node: null};
            util.startBranch(1, true);
            return;
        }
        const n = frame.strudelTrack.node || silenceNode();
        delete frame.strudelTrack;
        return this.playNode(Cast.toString(args.TRACK), n);
    }

    /**
     * @param {string} track - track name
     * @param {object} n - pattern node
     * @returns {?Promise} - a promise which is resolved when the track starts
     */
    playNode (track, n) {
        let pattern;
        try {
            pattern = compile(n);
        } catch (e) {
            console.warn('[strudel]', e);
            return;
        }
        const code = toCode(n);
        this.trackCodes.set(track, code);
        if (usesMethod(n, 'trancegate')) this.trackFills.add(track);
        else this.trackFills.delete(track);
        const token = {};
        this.playTokens.set(track, token);
        this.connectHats();
        // load the sample maps which the pattern needs, such as drum machines or the piano
        const {names, bank} = soundsOf(n);
        const loads = banksFor(names, bank).map(b => this.loadBank(b).catch(e => console.warn('[strudel]', e)));
        // stopping while loading cancels the play
        const generation = this.engine.generation;
        return Promise.all(loads)
            .then(() => {
                // a stop, or a newer play of the same track, came while loading
                if (generation !== this.engine.generation || this.playTokens.get(track) !== token) return;
                return this.engine.play(track, pattern);
            })
            .catch(e => {
                if (this.playTokens.get(track) === token) {
                    this.trackCodes.delete(track);
                    this.trackFills.delete(track);
                }
                console.warn('[strudel]', e);
            });
    }

    stopTrack (args) {
        this.trackCodes.delete(Cast.toString(args.TRACK));
        this.trackFills.delete(Cast.toString(args.TRACK));
        this.playTokens.delete(Cast.toString(args.TRACK));
        if (this._engine) this._engine.stopTrack(Cast.toString(args.TRACK));
    }

    stopAll () {
        this.forgetTracks();
        this.stopSound();
    }

    /** Stop the sound of all tracks, keeping their code. */
    stopSound () {
        this.playTokens.clear();
        if (this._engine) this._engine.stopAll();
    }

    /** Forget the code of all tracks. */
    forgetTracks () {
        this.trackCodes.clear();
        this.trackFills.clear();
    }

    setBpm (args) {
        this.engine.setBpm(clamp(args.BPM, BPM_RANGE[0], BPM_RANGE[1]));
    }

    setBeatsPerCycle (args) {
        this.engine.setBeatsPerCycle(Math.round(clamp(args.BEATS, 1, 16)));
    }


    /**
     * The track which a block is in. Frames of the thread are searched from the innermost,
     * so that the blocks in a custom block which is used in the C block also work.
     * @param {object} util - utility of the block
     * @returns {?object} - {node} of the track, or null outside the C block
     */
    trackOf (util) {
        const frames = util && util.thread && util.thread.stackFrames;
        if (!frames) return null;
        for (let i = frames.length - 1; i >= 0; i--) {
            const context = frames[i].executionContext;
            if (context && context.strudelTrack) return context.strudelTrack;
        }
        return null;
    }

    /**
     * Start the pattern of the track. A later start takes the place of the earlier one.
     * @param {object} util - utility of the block
     * @param {Function} make - function which returns the first node
     */
    startWith (util, make) {
        const track = this.trackOf(util);
        if (track) track.node = make();
    }

    /**
     * Add a method to the pattern of the track, as `.fast(2)` in Strudel.
     * @param {object} util - utility of the block
     * @param {Function} make - function which takes the node so far and returns the new node
     */
    chain (util, make) {
        const track = this.trackOf(util);
        if (track) track.node = make(track.node || silenceNode());
    }

    /**
     * s(), note() and n() at the top of a track start the pattern,
     * and below they are methods, such as s("supersaw!8").note("c3 e3").
     * @param {*} value - mini-notation
     * @param {string} control - 's', 'note' or 'n'
     * @param {object} util - utility of the block
     */
    startOrChain (value, control, util) {
        const track = this.trackOf(util);
        if (!track) return;
        const code = Cast.toString(value).trim();
        if (track.node) {
            // a rest or an empty text, such as an empty list, does not change the pattern
            if (code && code !== '~') track.node = methodNode(track.node, control, [code]);
            return;
        }
        // an empty text, such as an empty list, is a rest
        track.node = code && code !== '~' ? miniNode(code, control) : silenceNode();
    }

    /**
     * @param {*} value - sounds
     * @param {object} util - utility of the block
     */
    sound (value, util) {
        this.startOrChain(value, 's', util);
    }

    sMenu (args, util) {
        this.sound(args.SOUND, util);
    }

    s (args, util) {
        this.sound(args.CODE, util);
    }

    /**
     * @param {*} value - notes
     * @param {object} util - utility of the block
     */
    notes (value, util) {
        this.startOrChain(value, 'note', util);
    }

    noteMenu (args, util) {
        this.notes(args.NOTE, util);
    }

    note (args, util) {
        this.notes(args.CODE, util);
    }

    n (args, util) {
        // the random steps block is put in as steps
        if (isNode(args.CODE)) {
            this.startWith(util, () => asSteps(args.CODE));
            return;
        }
        this.startOrChain(args.CODE, 'n', util);
    }

    seq (args, util) {
        this.startWith(util, () => callNode('seq', [args.A, args.B, args.C, args.D]));
    }

    stack (args, util) {
        this.startWith(util, () => callNode('stack', [args.A, args.B]));
    }

    /**
     * The C block "stack" in a track. The blocks in it build another pattern,
     * which is stacked on the pattern above, as stack(above, inner) in Strudel.
     * The branch runs as a loop of one time, as the C block of a track.
     * @param {object} args - no arguments
     * @param {object} util - utility of the block
     */
    stackBranch (args, util) {
        const frame = util.stackFrame;
        if (!frame.strudelTrack) {
            if (!this.trackOf(util)) return;
            frame.strudelTrack = {node: null};
            util.startBranch(1, true);
            return;
        }
        const inner = frame.strudelTrack.node;
        delete frame.strudelTrack;
        const track = this.trackOf(util);
        if (!track || !inner) return;
        const above = track.node;
        if (!above) {
            track.node = inner;
            return;
        }
        // stack(a, b) and a stack below it are written as stack(a, b, c)
        const layers = above.type === 'call' && above.fn === 'stack' ? above.args : [above];
        track.node = callNode('stack', [...layers, inner]);
    }

    cat (args, util) {
        this.startWith(util, () => callNode('cat', [args.A, args.B]));
    }

    spriteSound (args, util) {
        if (!this.trackOf(util)) return;
        const name = Cast.toString(args.SOUND);
        const sprite = util.target && util.target.sprite;
        const sound = sprite && sprite.sounds.find(s => s.name === name);
        const sample = this.spriteSounds.register(sound);
        if (!sample) {
            // the block keeps the old name when the sound is renamed
            console.warn(`[strudel] the sprite has no sound "${name}"`);
        }
        this.startWith(util, () => (sample ? miniNode(sample, 's') : silenceNode()));
    }

    chord (args, util) {
        const intervals = own(CHORDS, Cast.toString(args.CHORD)) || CHORDS.major;
        let root;
        try {
            root = noteToMidi(Cast.toString(args.ROOT));
        } catch (e) {
            root = 60;
        }
        this.startWith(util, () => miniNode(`[${intervals.map(i => midiToName(root + i)).join(',')}]`, 'note'));
    }

    fast (args, util) {
        this.chain(util, n => methodNode(n, 'fast', [clamp(args.TIMES, 0, LIMIT.MODIFIER)]));
    }

    slow (args, util) {
        this.chain(util, n => methodNode(n, 'slow', [clamp(args.CYCLES, 0.01, LIMIT.SLOW)]));
    }

    scale (args, util) {
        this.chain(util, n => methodNode(n, 'scale', [`${Cast.toString(args.ROOT)}:${Cast.toString(args.SCALE)}`]));
    }

    struct (args, util) {
        this.chain(util, n => methodNode(n, 'struct', [Cast.toString(args.RHYTHM).trim()]));
    }

    beat (args, util) {
        const steps = Math.round(clamp(args.STEPS, 1, LIMIT.MODIFIER));
        this.chain(util, n => methodNode(n, 'beat', [Cast.toString(args.BEATS).trim(), steps]));
    }

    bank (args, util) {
        this.chain(util, n => methodNode(n, 'bank', [Cast.toString(args.MACHINE)]));
    }

    effect (args, util) {
        this.chain(util, n => this.effectOf(n, Cast.toString(args.EFFECT), args.VALUE));
    }

    /**
     * @param {object} n - node so far
     * @param {string} fn - effect name
     * @param {*} value - value, or a signal from the wave block
     * @returns {object} - node with the effect, or the same node for an unknown effect
     */
    effectOf (n, fn, value) {
        if (!Object.prototype.hasOwnProperty.call(EFFECTS, fn)) return n;
        const range = EFFECTS[fn];
        if (isSignal(value)) {
            if (!range) return n;
            const min = clamp(value.min, range[0], range[1]);
            const max = clamp(value.max, range[0], range[1]);
            return methodNode(n, fn, [signalArg(value.signal, min, max, value.cycles)]);
        }
        const raw = Cast.toString(value).trim();
        // a plain number is kept in the range, a pattern such as "<300 2000>" is checked when it plays
        let v = range && /^-?\d+(\.\d+)?$/.test(raw) ? clamp(raw, range[0], range[1]) : raw;
        if (fn === 'orbit' && typeof v === 'number') v = Math.round(v);
        // distortion makes a sound much louder, so it is turned down
        if (fn === 'distort') return methodNode(methodNode(n, fn, [v]), 'distortvol', [0.3]);
        return methodNode(n, fn, [v]);
    }

    add (args, util) {
        const raw = Cast.toString(args.VALUE).trim();
        const value = /^-?\d+(\.\d+)?$/.test(raw) ? clamp(raw, -48, 48) : raw;
        this.chain(util, n => methodNode(n, 'add', [value]));
    }

    rev (args, util) {
        this.chain(util, n => methodNode(n, 'rev', []));
    }

    ply (args, util) {
        this.chain(util, n => methodNode(n, 'ply', [Math.round(clamp(args.TIMES, 1, 8))]));
    }

    every (args, util) {
        const transform = this.transformOf(args.TRANSFORM);
        this.chain(util, n => methodNode(n, 'every', [Math.round(clamp(args.CYCLES, 1, 16)), transform]));
    }

    degradeBy (args, util) {
        this.chain(util, n => methodNode(n, 'degradeBy', [clamp(args.PERCENT, 0, 100) / 100]));
    }

    /**
     * @param {*} value - menu value of a transform
     * @returns {object} - transform
     */
    transformOf (value) {
        return own(TRANSFORMS, Cast.toString(value)) || TRANSFORMS.rev;
    }

    sometimes (args, util) {
        this.chain(util, n => methodNode(n, 'sometimes', [this.transformOf(args.TRANSFORM)]));
    }

    euclid (args, util) {
        const steps = Math.round(clamp(args.STEPS, 1, LIMIT.MODIFIER));
        const pulses = Math.round(clamp(args.PULSES, 1, steps));
        this.chain(util, n => methodNode(n, 'euclid', [pulses, steps]));
    }

    jux (args, util) {
        this.chain(util, n => methodNode(n, 'jux', [this.transformOf(args.TRANSFORM)]));
    }

    off (args, util) {
        this.chain(util, n => methodNode(n, 'off', [clamp(args.TIME, 0, 1), this.transformOf(args.TRANSFORM)]));
    }

    superimpose (args, util) {
        this.chain(util, n => methodNode(n, 'superimpose', [this.transformOf(args.TRANSFORM)]));
    }

    chop (args, util) {
        this.chain(util, n => methodNode(n, 'chop', [Math.round(clamp(args.PIECES, 1, 16))]));
    }

    transpose (args, util) {
        this.chain(util, n => methodNode(n, 'transpose', [Math.round(clamp(args.SEMITONES, -24, 24))]));
    }

    arp (args, util) {
        this.chain(util, n => methodNode(n, 'arp', [Cast.toString(args.ORDER).trim() || '0']));
    }

    acidenv (args, util) {
        // a TB-303 like sound: a sawtooth through a low pass filter which opens and closes on each note
        const amount = clamp(args.AMOUNT, 0, 1);
        this.chain(util, n => {
            n = methodNode(n, 's', ['sawtooth']);
            n = methodNode(n, 'lpf', [100]);
            n = methodNode(n, 'lpenv', [Math.round(amount * 9 * 1000) / 1000]);
            n = methodNode(n, 'lps', [0.2]);
            n = methodNode(n, 'lpd', [0.12]);
            return methodNode(n, 'lpq', [2]);
        });
    }

    trancegate (args, util) {
        const gate = [
            clamp(args.DENSITY, 0, 1),
            Math.round(clamp(args.SEED, 0, 1000)),
            Math.round(clamp(args.LENGTH, 1, 16))
        ];
        this.chain(util, n => methodNode(n, 'trancegate', gate));
    }

    /**
     * Start hat blocks from engine events.
     */
    connectHats () {
        const engine = this.engine;
        if (engine.onBeat) return;
        engine.onBeat = () => this.runtime.startHats(`${EXTENSION_ID}_whenBeat`);
        engine.onSound = value => {
            if (value && value.s) this.runtime.startHats(`${EXTENSION_ID}_whenSound`, {DRUM: String(value.s)});
        };
    }

    whenBeat () {
        return true;
    }

    whenSound () {
        return true;
    }

    beatInCycle () {
        if (!this._engine || !this._engine.scheduler.started) return 0;
        return (this._engine.beat() % this._engine.beatsPerCycle) + 1;
    }

    cycle () {
        return this._engine ? Math.floor(this._engine.now()) : 0;
    }

    /**
     * @returns {Array<string>} - names of the sounds of the editing sprite
     */
    getSpriteSoundMenu () {
        const target = this.runtime.getEditingTarget && this.runtime.getEditingTarget();
        const names = target && target.sprite ? target.sprite.sounds.map(sound => sound.name) : [];
        return names.length ? names : [''];
    }

    /**
     * @returns {Array<string>} - names of the lists of the editing sprite and the stage
     */
    getListMenu () {
        const names = [];
        const target = this.runtime.getEditingTarget && this.runtime.getEditingTarget();
        const stage = this.runtime.getTargetForStage && this.runtime.getTargetForStage();
        [target, stage].forEach(t => {
            if (!t || !t.variables) return;
            Object.values(t.variables).forEach(v => {
                if (v.type === 'list' && !names.includes(v.name)) names.push(v.name);
            });
        });
        return names.length ? names : [''];
    }

    /**
     * Mini-notation made of the items of a list. Each item is put in [ ].
     * @param {object} args - LISTNAME and HOW
     * @param {object} util - utility of the block
     * @returns {string} - mini-notation, or '' when the list is not found or empty
     */
    listMini (args, util) {
        const target = util && util.target;
        const list = target && target.lookupVariableByNameAndType(Cast.toString(args.LISTNAME), 'list');
        if (!list || !Array.isArray(list.value)) return '';
        const items = list.value.map(item => Cast.toString(item).trim())
            .filter(item => item.length > 0)
            .map(item => `[${item}]`);
        if (!items.length) return '';
        switch (Cast.toString(args.HOW)) {
        case 'seq': return items.join(' ');
        case 'stack': return items.join(', ');
        default: return `<${items.join(' ')}>`;
        }
    }

    setDrumKit (args) {
        const kit = Cast.toString(args.KIT);
        if (!DRUM_KITS.includes(kit)) return;
        return this.engine.setDrumKit(kit).catch(e => console.warn('[strudel]', e));
    }

    wave (args) {
        const shape = Cast.toString(args.SHAPE);
        return signalArg(shape, Cast.toNumber(args.MIN), Cast.toNumber(args.MAX),
            clamp(args.CYCLES, 0.25, LIMIT.MODIFIER));
    }

    randomSteps (args) {
        const min = Math.round(clamp(args.MIN, -48, 48));
        const max = Math.round(clamp(args.MAX, -48, 48));
        return randomNode(Math.min(min, max), Math.max(min, max),
            Math.round(clamp(args.STEPS, 1, LIMIT.MODIFIER)),
            Math.round(clamp(args.SEED, 0, 1000)),
            Math.round(clamp(args.LENGTH, 1, 16)));
    }

    /**
     * @returns {string} - Strudel code which plays all tracks
     */
    strudelCode () {
        const engine = this._engine;
        const cpm = engine ? engine.bpm / engine.beatsPerCycle : 30;
        const lines = [`setcpm(${Math.round(cpm * 1000) / 1000})`];
        // a track which ducks comes last, because strudel.cc warns when the ducked orbit has not played yet
        const ducks = ([, code]) => (/\.duck(?:orbit)?\(/.test(code) ? 1 : 0);
        Array.from(this.trackCodes).sort((a, b) => ducks(a) - ducks(b))
            .forEach(([track, code]) => {
                lines.push(`// track ${commentText(track)}`, `$: ${code}`);
            });
        if (!this.trackCodes.size) lines.push(NO_TRACK_COMMENT);
        if (Array.from(this.trackCodes.keys()).some(track => this.trackFills.has(track))) {
            // the trance gate block uses this function, which is not in Strudel
            lines.splice(1, 0, '// fillGaps: stretch each sound to the next one (for the trance gate)', FILL_GAPS_CODE);
        }
        if (lines.some(line => line.includes('scratch_'))) {
            lines.unshift('// sounds of sprites (scratch_...) can not be played on strudel.cc');
        }
        return lines.join('\n');
    }

    openStrudel () {
        const url = `https://strudel.cc/#${code2hash(this.strudelCode())}`;
        if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
    }

    /**
     * @param {string} kind - 'scope', 'pianoroll', 'spectrum' or 'punchcard'
     * @returns {Function} - drawer of the layer
     */
    makeDrawer (kind) {
        if (kind === 'pianoroll' || kind === 'punchcard') {
            return pianorollDrawer(
                () => (this._engine && this._engine.scheduler.started ? this._engine.pattern : null),
                () => this._engine.now(),
                kind === 'punchcard' ? VIEW.PUNCHCARD : VIEW.PIANOROLL
            );
        }
        const makeDraw = kind === 'spectrum' ? spectrumDrawer : scopeDrawer;
        let analyser = null;
        let draw = null;
        return (ctx, width, height) => {
            const current = this._engine && this._engine.analyser;
            if (!current) return;
            if (current !== analyser) {
                analyser = current;
                draw = makeDraw(analyser);
            }
            draw(ctx, width, height);
        };
    }

    showViz (args) {
        const kind = Cast.toString(args.VIZ);
        if (!['scope', 'pianoroll', 'spectrum', 'punchcard'].includes(kind)) return;
        if (this.layer) this.layer.show(this.makeDrawer(kind));
    }

    hideViz () {
        if (this._layer) this._layer.hide();
    }

    vizLayer (args) {
        if (this.layer) this.layer.setGroup(args.LAYER === 'front' ? LAYER.FRONT : LAYER.BACK);
    }
}

export {ExtensionBlocks as default, ExtensionBlocks as blockClass};
