import path from 'path';
import fs from 'fs-extra';
import JSZip from 'jszip';

/** URL of the extension which projects load. */
export const EXTENSION_URL = 'https://0x48lab.github.io/xcx-strudel/dist/strudel.mjs';

/** Language of the projects: 'en' with the --en option, otherwise 'ja'. */
export const LANG = process.argv.includes('--en') ? 'en' : 'ja';

const JAPANESE = /[\u3040-\u30ff\u3400-\u9fff\uff01-\uff5e]/;

/**
 * Translate the Japanese texts of a project, such as track names, comments and list names.
 * IDs made from names, such as l_<list name> and v_<variable name>, are translated in the same way.
 * @param {*} value - part of the project
 * @param {object} words - Japanese text to English text
 * @param {Set<string>} missing - Japanese texts which are not in the words
 * @returns {*} - translated value
 */
const translate = (value, words, missing) => {
    if (typeof value === 'string') {
        if (!JAPANESE.test(value)) return value;
        const prefix = /^[lmv]_/.test(value) ? value.slice(0, 2) : '';
        const text = value.slice(prefix.length);
        if (Object.prototype.hasOwnProperty.call(words, text)) return prefix + words[text];
        missing.add(text);
        return value;
    }
    if (Array.isArray(value)) return value.map(v => translate(v, words, missing));
    if (value && typeof value === 'object') {
        const result = {};
        Object.entries(value).forEach(([k, v]) => {
            result[translate(k, words, missing)] = translate(v, words, missing);
        });
        return result;
    }
    return value;
};

const ASSETS = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'demo-assets');

/**
 * Builder of the blocks of a target in the sb3 format.
 */
export class Blocks {
    constructor () {
        this.blocks = {};
        this.comments = {};
        /** Broadcast messages: ID to name. */
        this.broadcasts = {};
        /** Lists of the sprite: ID to [name, items]. */
        this.lists = {};
        /** Variables for all sprites, which are on the stage: ID to [name, value]. */
        this.variables = {};
        /** Monitors on the stage. */
        this.monitors = [];
        this.count = 0;
    }

    id () {
        this.count += 1;
        return `b${this.count}`;
    }

    /**
     * @param {string} opcode - opcode of the block
     * @param {object} [options] - {top: [x, y], fields}
     * @returns {string} - block ID
     */
    block (opcode, options = {}) {
        const id = this.id();
        this.blocks[id] = {
            opcode,
            next: null,
            parent: null,
            inputs: {},
            fields: options.fields || {},
            shadow: false,
            topLevel: !!options.top
        };
        if (options.top) {
            this.blocks[id].x = options.top[0];
            this.blocks[id].y = options.top[1];
        }
        return id;
    }

    shadow (parent, opcode, field, value) {
        const id = this.id();
        this.blocks[id] = {
            opcode,
            next: null,
            parent,
            inputs: {},
            fields: {[field]: [String(value), null]},
            shadow: true,
            topLevel: false
        };
        return id;
    }

    text (parent, input, value) {
        this.blocks[parent].inputs[input] = [1, this.shadow(parent, 'text', 'TEXT', value)];
    }

    number (parent, input, value) {
        this.blocks[parent].inputs[input] = [1, this.shadow(parent, 'math_number', 'NUM', value)];
    }

    /**
     * A dropdown of the extension. A reporter can be put on it later with `put`.
     * @param {string} parent - block ID
     * @param {string} input - input name
     * @param {string} menu - menu name
     * @param {string} value - menu value
     */
    menu (parent, input, menu, value) {
        this.blocks[parent].inputs[input] = [1, this.shadow(parent, `strudel_menu_${menu}`, menu, value)];
    }

    /**
     * Put a reporter into an input, keeping its shadow.
     * @param {string} parent - block ID
     * @param {string} input - input name
     * @param {string} reporter - block ID of the reporter
     */
    put (parent, input, reporter) {
        const shadow = this.blocks[parent].inputs[input] ? this.blocks[parent].inputs[input][1] : null;
        this.blocks[parent].inputs[input] = [3, reporter, shadow];
        this.blocks[reporter].parent = parent;
    }

    /**
     * @param {Array<string>} ids - blocks to stack in order
     */
    stack (ids) {
        for (let i = 0; i < ids.length - 1; i++) {
            this.blocks[ids[i]].next = ids[i + 1];
            this.blocks[ids[i + 1]].parent = ids[i];
        }
    }

    /**
     * A reporter or command of the extension with its inputs.
     * @param {string} opcode - opcode without the extension ID
     * @param {object} [inputs] - {name: [kind, value]}; kind is 'text', 'number' or a menu name.
     *     A block ID as value (with kind 'block') puts that reporter over a sound dropdown,
     *     and with kind 'blockOnText' over a text field.
     * @param {object} [fields] - fields of the block, such as {EFFECT: 'lpf'}
     * @returns {string} - block ID
     */
    strudel (opcode, inputs = {}, fields = {}) {
        const fieldValues = {};
        Object.entries(fields).forEach(([name, value]) => {
            fieldValues[name] = [value, null];
        });
        const id = this.block(`strudel_${opcode}`, {fields: fieldValues});
        Object.entries(inputs).forEach(([name, [kind, value]]) => {
            if (kind === 'text') this.text(id, name, value);
            else if (kind === 'number') this.number(id, name, value);
            else if (kind === 'block') {
                this.menu(id, name, 'sound', 'c4');
                this.put(id, name, value);
            } else if (kind === 'blockOnText') {
                this.text(id, name, '');
                this.put(id, name, value);
            } else this.menu(id, name, kind, value);
        });
        return id;
    }

    /**
     * @param {string} key - key name of Scratch, such as 'space' or '1'
     * @param {Array<number>} top - position
     * @returns {string} - hat block ID
     */
    whenKey (key, top) {
        return this.block('event_whenkeypressed', {top, fields: {KEY_OPTION: [key, null]}});
    }

    /**
     * @param {string} text - what the sprite says
     * @param {number} secs - seconds
     * @returns {string} - block ID
     */
    say (text, secs) {
        const id = this.block('looks_sayforsecs');
        this.text(id, 'MESSAGE', text);
        this.number(id, 'SECS', secs);
        return id;
    }

    /**
     * A list of the sprite.
     * @param {string} name - list name
     * @param {Array<string>} items - items
     * @returns {string} - list name
     */
    list (name, items) {
        this.lists[`l_${name}`] = [name, items];
        return name;
    }

    /**
     * Show a list of the sprite on the stage.
     * @param {string} name - list name, made by list()
     * @param {Array<number>} rect - [x, y, width, height] on the stage
     */
    listMonitor (name, [x, y, width, height]) {
        const id = `l_${name}`;
        this.monitors.push({
            id,
            mode: 'list',
            opcode: 'data_listcontents',
            params: {LIST: name},
            spriteName: 'Sprite1',
            value: this.lists[id][1],
            width,
            height,
            x,
            y,
            visible: true
        });
    }

    /**
     * A variable for all sprites.
     * @param {string} name - variable name
     * @param {number} value - first value
     * @returns {string} - variable name
     */
    variable (name, value) {
        this.variables[`v_${name}`] = [name, value];
        return name;
    }

    /**
     * Show a variable as a slider on the stage.
     * @param {string} name - variable name, made by variable()
     * @param {Array<number>} position - [x, y] on the stage
     * @param {Array<number>} range - [min, max] of the slider
     */
    sliderMonitor (name, [x, y], [min, max]) {
        const id = `v_${name}`;
        this.monitors.push({
            id,
            mode: 'slider',
            opcode: 'data_variable',
            params: {VARIABLE: name},
            spriteName: null,
            value: this.variables[id][1],
            width: 0,
            height: 0,
            x,
            y,
            visible: true,
            sliderMin: min,
            sliderMax: max,
            isDiscrete: false
        });
    }

    /**
     * @param {string} name - variable name
     * @returns {string} - block ID of the variable reporter
     */
    getVariable (name) {
        return this.block('data_variable', {fields: {VARIABLE: [name, `v_${name}`]}});
    }

    /**
     * @param {string} name - variable name
     * @param {string} reporter - block ID of the new value
     * @returns {string} - block ID of "set variable to"
     */
    setVariable (name, reporter) {
        const id = this.block('data_setvariableto', {fields: {VARIABLE: [name, `v_${name}`]}});
        this.text(id, 'VALUE', '0');
        this.put(id, 'VALUE', reporter);
        return id;
    }

    /**
     * @param {string} name - message name
     * @returns {string} - broadcast ID
     */
    message (name) {
        const id = `m_${name}`;
        this.broadcasts[id] = name;
        return id;
    }

    /**
     * @param {string} name - message name
     * @returns {string} - block ID of "broadcast"
     */
    broadcast (name) {
        const id = this.block('event_broadcast');
        this.blocks[id].inputs.BROADCAST_INPUT = [1, [11, name, this.message(name)]];
        return id;
    }

    /**
     * @param {string} name - message name
     * @param {Array<number>} top - position
     * @returns {string} - hat block ID
     */
    whenReceive (name, top) {
        return this.block('event_whenbroadcastreceived', {top, fields: {BROADCAST_OPTION: [name, this.message(name)]}});
    }

    comment (blockId, text, x, y) {
        this.comments[`c${Object.keys(this.comments).length + 1}`] = {
            blockId,
            x,
            y,
            width: 260,
            height: 120,
            minimized: false,
            text
        };
    }
}

/**
 * "in order" block with four sounds.
 * @param {Blocks} b - builder
 * @param {Array<string>} sounds - four values of the sound menu
 * @returns {string} - block ID
 */
export const inOrder = (b, sounds) => {
    const id = b.block('strudel_sequence');
    ['A', 'B', 'C', 'D'].forEach((input, i) => b.menu(id, input, 'sound', sounds[i]));
    return id;
};

/**
 * Write a project with the default backdrop and the cat sprite.
 * @param {Blocks} cat - blocks of the cat sprite
 * @param {string} output - path of the sb3 file
 * @param {string} [agent] - name of the maker
 */
export const writeProject = async (cat, output, agent = 'xcx-strudel') => {
    const project = {
        targets: [
            {
                isStage: true,
                name: 'Stage',
                variables: cat.variables,
                lists: {},
                broadcasts: cat.broadcasts,
                blocks: {},
                comments: {},
                currentCostume: 0,
                costumes: [{
                    name: 'backdrop1',
                    dataFormat: 'svg',
                    assetId: 'cd21514d0531fdffb22204e0ec5ed84a',
                    md5ext: 'cd21514d0531fdffb22204e0ec5ed84a.svg',
                    rotationCenterX: 240,
                    rotationCenterY: 180
                }],
                sounds: [],
                volume: 100,
                layerOrder: 0,
                tempo: 60,
                videoTransparency: 50,
                videoState: 'on',
                textToSpeechLanguage: null
            },
            {
                isStage: false,
                name: 'Sprite1',
                variables: {},
                lists: cat.lists,
                broadcasts: {},
                blocks: cat.blocks,
                comments: cat.comments,
                currentCostume: 0,
                costumes: [
                    {
                        name: 'costume1',
                        bitmapResolution: 1,
                        dataFormat: 'svg',
                        assetId: '881c5994e99006fc05359d738af66337',
                        md5ext: '881c5994e99006fc05359d738af66337.svg',
                        rotationCenterX: 53.30362207219807,
                        rotationCenterY: 19.978010296581317
                    },
                    {
                        name: 'costume2',
                        bitmapResolution: 1,
                        dataFormat: 'svg',
                        assetId: 'b6e71f1bf154c8a5470665fe87dd507c',
                        md5ext: 'b6e71f1bf154c8a5470665fe87dd507c.svg',
                        rotationCenterX: 53.30374213774783,
                        rotationCenterY: 19.97796946977502
                    }
                ],
                sounds: [{
                    name: 'Meow',
                    assetId: '83c36d806dc92327b9e7049a565c6bff',
                    dataFormat: 'wav',
                    format: '',
                    rate: 22050,
                    sampleCount: 18688,
                    md5ext: '83c36d806dc92327b9e7049a565c6bff.wav'
                }],
                volume: 100,
                layerOrder: 1,
                visible: true,
                x: 0,
                y: -60,
                size: 100,
                direction: 90,
                draggable: false,
                rotationStyle: 'all around'
            }
        ],
        monitors: cat.monitors,
        extensions: ['strudel'],
        // Xcratch reads the URLs as pairs of an extension ID and a URL
        extensionURLs: [['strudel', EXTENSION_URL]],
        meta: {semver: '3.0.0', vm: '0.2.0', agent}
    };
    let json = project;
    if (LANG === 'en') {
        // English projects are put in en/ next to the Japanese ones
        const {WORDS} = await import('./words-en.mjs');
        const missing = new Set();
        json = translate(project, WORDS, missing);
        if (missing.size && process.env.XCX_LIST_MISSING) {
            missing.forEach(m => console.log(JSON.stringify(m)));
        } else if (missing.size) {
            throw new Error(`no English for ${output}:\n${Array.from(missing).map(m => JSON.stringify(m)).join('\n')}`);
        }
        output = path.join(path.dirname(output), 'en', path.basename(output));
    }
    // a fixed date makes the same file from the same project
    const date = new Date('2026-01-01T00:00:00Z');
    const zip = new JSZip();
    zip.file('project.json', JSON.stringify(json), {date});
    fs.readdirSync(ASSETS).forEach(file => zip.file(file, fs.readFileSync(path.join(ASSETS, file)), {date}));
    fs.ensureDirSync(path.dirname(output));
    fs.writeFileSync(output, await zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'}));
};
