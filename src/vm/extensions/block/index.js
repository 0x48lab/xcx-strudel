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
    usesMethod,
    toNode
} from '../../../core/ast.js';
import {Engine} from '../../../core/engine.js';
import {SpriteSounds} from '../../../core/sprite-sounds.js';
import {FILL_GAPS_CODE} from '../../../core/fill.js';
import {banksFor, loadBank} from '../../../core/sample-banks.js';
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
            hideFromPalette: !!block.hidden || block.level > this.level
        });
        delete info.level;
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

    playTrack (args) {
        const n = toNode(args.PATTERN) || silenceNode();
        let pattern;
        try {
            pattern = compile(n);
        } catch (e) {
            console.warn('[strudel]', e);
            return;
        }
        const track = Cast.toString(args.TRACK);
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


    sequence (args) {
        return callNode('seq', [args.A, args.B, args.C, args.D]);
    }

    together (args) {
        return callNode('stack', [args.A, args.B]);
    }

    alternate (args) {
        return callNode('cat', [args.A, args.B]);
    }

    repeat (args) {
        return methodNode(args.PATTERN, 'fast', [clamp(args.TIMES, 0, LIMIT.MODIFIER)]);
    }

    slow (args) {
        return methodNode(args.PATTERN, 'slow', [clamp(args.CYCLES, 0.01, LIMIT.SLOW)]);
    }

    tone (args) {
        return methodNode(args.PATTERN, 's', [Cast.toString(args.SYNTH)]);
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

    rhythm (args) {
        return methodNode(args.PATTERN, 'struct', [Cast.toString(args.RHYTHM).trim()]);
    }

    miniSound (args) {
        const code = Cast.toString(args.CODE);
        // an empty text, such as an empty list, is a rest
        return code.trim() ? miniNode(code, 's') : silenceNode();
    }

    miniNote (args) {
        const code = Cast.toString(args.CODE);
        return code.trim() ? miniNode(code, 'note') : silenceNode();
    }

    scaleNotes (args) {
        // a pattern block in the steps, such as the add block, is read as steps
        const steps = isNode(args.STEPS) ? asSteps(args.STEPS) : miniNode(Cast.toString(args.STEPS), 'n');
        return methodNode(steps, 'scale', [`${Cast.toString(args.ROOT)}:${Cast.toString(args.SCALE)}`]);
    }

    addNotes (args) {
        const raw = Cast.toString(args.VALUE).trim();
        const value = /^-?\d+(\.\d+)?$/.test(raw) ? clamp(raw, -48, 48) : raw;
        return methodNode(args.PATTERN, 'add', [value]);
    }

    superimpose (args) {
        return methodNode(args.PATTERN, 'superimpose', [this.transformOf(args.TRANSFORM)]);
    }

    acid (args) {
        // a TB-303 like sound: a sawtooth through a low pass filter which opens and closes on each note
        const amount = clamp(args.AMOUNT, 0, 1);
        let n = methodNode(args.PATTERN, 's', ['sawtooth']);
        n = methodNode(n, 'lpf', [100]);
        n = methodNode(n, 'lpenv', [Math.round(amount * 9 * 1000) / 1000]);
        n = methodNode(n, 'lps', [0.2]);
        n = methodNode(n, 'lpd', [0.12]);
        return methodNode(n, 'lpq', [2]);
    }

    duck (args) {
        // the pattern plays on orbit 2 and ducks orbit 1, where the other tracks play by default
        let n = methodNode(args.PATTERN, 'orbit', [2]);
        n = methodNode(n, 'duckorbit', [1]);
        n = methodNode(n, 'duckattack', [0.2]);
        return methodNode(n, 'duckdepth', [clamp(args.DEPTH, 0, 1)]);
    }

    trancegate (args) {
        return methodNode(args.PATTERN, 'trancegate', [
            clamp(args.DENSITY, 0, 1),
            Math.round(clamp(args.SEED, 0, 1000)),
            Math.round(clamp(args.LENGTH, 1, 16))
        ]);
    }

    spriteSound (args, util) {
        const name = Cast.toString(args.SOUND);
        const sprite = util && util.target && util.target.sprite;
        const sound = sprite && sprite.sounds.find(s => s.name === name);
        const sample = this.spriteSounds.register(sound);
        if (!sample) {
            // the block keeps the old name when the sound is renamed
            console.warn(`[strudel] the sprite has no sound "${name}"`);
            return silenceNode();
        }
        return miniNode(sample, 's');
    }

    effect (args) {
        const fn = Cast.toString(args.EFFECT);
        if (!Object.prototype.hasOwnProperty.call(EFFECTS, fn)) {
            return toNode(args.PATTERN) || silenceNode();
        }
        const range = EFFECTS[fn];
        if (isSignal(args.VALUE)) {
            if (!range) return toNode(args.PATTERN) || silenceNode();
            const v = args.VALUE;
            const min = clamp(v.min, range[0], range[1]);
            const max = clamp(v.max, range[0], range[1]);
            return methodNode(args.PATTERN, fn, [signalArg(v.signal, min, max, v.cycles)]);
        }
        const raw = Cast.toString(args.VALUE).trim();
        // a plain number is kept in the range, a pattern such as "<300 2000>" is checked when it plays
        let value = range && /^-?\d+(\.\d+)?$/.test(raw) ? clamp(raw, range[0], range[1]) : raw;
        if (fn === 'orbit' && typeof value === 'number') value = Math.round(value);
        // distortion makes a sound much louder, so it is turned down
        if (fn === 'distort') return methodNode(methodNode(args.PATTERN, fn, [value]), 'distortvol', [0.3]);
        return methodNode(args.PATTERN, fn, [value]);
    }

    drumMachine (args) {
        return methodNode(args.PATTERN, 'bank', [Cast.toString(args.MACHINE)]);
    }

    loadSamples (args) {
        return this.loadBank(Cast.toString(args.BANK)).catch(e => console.warn('[strudel]', e));
    }

    reverse (args) {
        return methodNode(args.PATTERN, 'rev', []);
    }

    ply (args) {
        return methodNode(args.PATTERN, 'ply', [Math.round(clamp(args.TIMES, 1, 8))]);
    }

    every (args) {
        const transform = this.transformOf(args.TRANSFORM);
        return methodNode(args.PATTERN, 'every', [Math.round(clamp(args.CYCLES, 1, 16)), transform]);
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

    degrade (args) {
        return methodNode(args.PATTERN, 'degradeBy', [clamp(args.PERCENT, 0, 100) / 100]);
    }

    /**
     * @param {*} value - menu value of a transform
     * @returns {object} - transform
     */
    transformOf (value) {
        return own(TRANSFORMS, Cast.toString(value)) || TRANSFORMS.rev;
    }

    sometimes (args) {
        return methodNode(args.PATTERN, 'sometimes', [this.transformOf(args.TRANSFORM)]);
    }

    euclid (args) {
        const steps = Math.round(clamp(args.STEPS, 1, LIMIT.MODIFIER));
        const pulses = Math.round(clamp(args.PULSES, 1, steps));
        return methodNode(args.PATTERN, 'euclid', [pulses, steps]);
    }

    jux (args) {
        return methodNode(args.PATTERN, 'jux', [this.transformOf(args.TRANSFORM)]);
    }

    off (args) {
        return methodNode(args.PATTERN, 'off', [clamp(args.TIME, 0, 1), this.transformOf(args.TRANSFORM)]);
    }

    chop (args) {
        return methodNode(args.PATTERN, 'chop', [Math.round(clamp(args.PIECES, 1, 16))]);
    }

    transpose (args) {
        return methodNode(args.PATTERN, 'transpose', [Math.round(clamp(args.SEMITONES, -24, 24))]);
    }

    chord (args) {
        const intervals = own(CHORDS, Cast.toString(args.CHORD)) || CHORDS.major;
        let root;
        try {
            root = noteToMidi(Cast.toString(args.ROOT));
        } catch (e) {
            root = 60;
        }
        return miniNode(`[${intervals.map(i => midiToName(root + i)).join(',')}]`, 'note');
    }

    arp (args) {
        return methodNode(args.PATTERN, 'arp', [Cast.toString(args.ORDER).trim() || '0']);
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
