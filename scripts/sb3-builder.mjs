import path from 'path';
import fs from 'fs-extra';
import JSZip from 'jszip';

/** URL of the extension which projects load. */
export const EXTENSION_URL = 'https://0x48lab.github.io/xcx-strudel/dist/strudel.mjs';

const ASSETS = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'demo-assets');

/**
 * Builder of the blocks of a target in the sb3 format.
 */
export class Blocks {
    constructor () {
        this.blocks = {};
        this.comments = {};
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
                variables: {},
                lists: {},
                broadcasts: {},
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
                lists: {},
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
        monitors: [],
        extensions: ['strudel'],
        // Xcratch reads the URLs as pairs of an extension ID and a URL
        extensionURLs: [['strudel', EXTENSION_URL]],
        meta: {semver: '3.0.0', vm: '0.2.0', agent}
    };
    // a fixed date makes the same file from the same project
    const date = new Date('2026-01-01T00:00:00Z');
    const zip = new JSZip();
    zip.file('project.json', JSON.stringify(project), {date});
    fs.readdirSync(ASSETS).forEach(file => zip.file(file, fs.readFileSync(path.join(ASSETS, file)), {date}));
    fs.ensureDirSync(path.dirname(output));
    fs.writeFileSync(output, await zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'}));
};
