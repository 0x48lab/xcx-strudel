import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';

/**
 * Levels of blocks. A block is shown in the palette when its level is
 * less than or equal to the current level.
 */
export const LEVEL = {
    BEGINNER: 1,
    STANDARD: 2,
    MASTER: 3
};

/**
 * Block definitions.
 * `text` is the default English message. The message id is `strudel.<opcode>`.
 *
 * Shapes have one role each:
 * - the C block "play on track" is a track, which is a line of Strudel code
 * - command blocks in it are the parts of the method chain, from the top to the bottom
 * - reporter blocks are values, which are put in the inputs
 * A block with `inTrack` works only in the C block.
 * A block with `maxLevel` is hidden above that level, where another block takes its place.
 * @type {Array<object|string>}
 */
export const BLOCKS = [
    {
        opcode: 'setLevel',
        blockType: BlockType.COMMAND,
        level: LEVEL.BEGINNER,
        text: 'show blocks for [LEVEL]',
        arguments: {
            LEVEL: {type: ArgumentType.STRING, menu: 'level', defaultValue: '1'}
        }
    },
    '---',
    {
        opcode: 'track',
        blockType: BlockType.CONDITIONAL,
        branchCount: 1,
        level: LEVEL.BEGINNER,
        text: 'play on track [TRACK]',
        arguments: {
            TRACK: {type: ArgumentType.STRING, defaultValue: '1'}
        }
    },
    {
        opcode: 'stopTrack',
        blockType: BlockType.COMMAND,
        level: LEVEL.BEGINNER,
        text: 'stop track [TRACK]',
        arguments: {
            TRACK: {type: ArgumentType.STRING, defaultValue: '1'}
        }
    },
    {
        opcode: 'stopAll',
        blockType: BlockType.COMMAND,
        level: LEVEL.BEGINNER,
        text: 'stop all tracks'
    },
    {
        opcode: 'setBpm',
        blockType: BlockType.COMMAND,
        level: LEVEL.BEGINNER,
        text: 'set tempo to [BPM] BPM',
        arguments: {
            BPM: {type: ArgumentType.NUMBER, defaultValue: 120}
        }
    },
    {
        opcode: 'loadSamples',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        text: 'load Strudel sounds [BANK]',
        arguments: {
            BANK: {type: ArgumentType.STRING, menu: 'bank', defaultValue: 'drums'}
        }
    },
    {
        opcode: 'setBeatsPerCycle',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        text: 'set beats in a cycle to [BEATS]',
        arguments: {
            BEATS: {type: ArgumentType.NUMBER, defaultValue: 4}
        }
    },
    '---',
    // the first sound of a track
    {
        opcode: 'sMenu',
        blockType: BlockType.COMMAND,
        level: LEVEL.BEGINNER,
        maxLevel: LEVEL.BEGINNER,
        inTrack: true,
        text: 's [SOUND]',
        arguments: {
            SOUND: {type: ArgumentType.STRING, menu: 'sName', defaultValue: 'bd'}
        }
    },
    {
        opcode: 'noteMenu',
        blockType: BlockType.COMMAND,
        level: LEVEL.BEGINNER,
        maxLevel: LEVEL.BEGINNER,
        inTrack: true,
        text: 'note [NOTE]',
        arguments: {
            NOTE: {type: ArgumentType.STRING, menu: 'note', defaultValue: 'c4'}
        }
    },
    {
        opcode: 's',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        inTrack: true,
        text: 's [CODE]',
        arguments: {
            CODE: {type: ArgumentType.STRING, defaultValue: 'bd*2 [~ sd] <hh oh>'}
        }
    },
    {
        opcode: 'note',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        inTrack: true,
        text: 'note [CODE]',
        arguments: {
            CODE: {type: ArgumentType.STRING, defaultValue: 'c3 [e3 g3] <a3 b3>'}
        }
    },
    {
        opcode: 'n',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        inTrack: true,
        text: 'n [CODE]',
        arguments: {
            CODE: {type: ArgumentType.STRING, defaultValue: '0 2 4 <5 7>'}
        }
    },
    {
        opcode: 'seq',
        blockType: BlockType.COMMAND,
        level: LEVEL.BEGINNER,
        inTrack: true,
        text: 'seq [A] [B] [C] [D]',
        arguments: {
            A: {type: ArgumentType.STRING, menu: 'sound', defaultValue: 'bd'},
            B: {type: ArgumentType.STRING, menu: 'sound', defaultValue: 'hh'},
            C: {type: ArgumentType.STRING, menu: 'sound', defaultValue: 'sd'},
            D: {type: ArgumentType.STRING, menu: 'sound', defaultValue: 'hh'}
        }
    },
    {
        opcode: 'stack',
        blockType: BlockType.COMMAND,
        level: LEVEL.BEGINNER,
        inTrack: true,
        text: 'stack [A] [B]',
        arguments: {
            A: {type: ArgumentType.STRING, menu: 'sound', defaultValue: 'bd'},
            B: {type: ArgumentType.STRING, menu: 'sound', defaultValue: 'cr'}
        }
    },
    {
        opcode: 'cat',
        blockType: BlockType.COMMAND,
        level: LEVEL.BEGINNER,
        inTrack: true,
        text: 'cat [A] [B]',
        arguments: {
            A: {type: ArgumentType.STRING, menu: 'sound', defaultValue: 'c4'},
            B: {type: ArgumentType.STRING, menu: 'sound', defaultValue: 'g4'}
        }
    },
    {
        opcode: 'spriteSound',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        inTrack: true,
        text: 'sprite sound [SOUND]',
        arguments: {
            SOUND: {type: ArgumentType.STRING, menu: 'spriteSound'}
        }
    },
    {
        opcode: 'chord',
        blockType: BlockType.COMMAND,
        level: LEVEL.MASTER,
        inTrack: true,
        text: 'chord [ROOT] [CHORD]',
        arguments: {
            ROOT: {type: ArgumentType.STRING, menu: 'root', defaultValue: 'C4'},
            CHORD: {type: ArgumentType.STRING, menu: 'chord', defaultValue: 'major'}
        }
    },
    '---',
    // methods which change the sound of a track
    {
        opcode: 'fast',
        blockType: BlockType.COMMAND,
        level: LEVEL.BEGINNER,
        inTrack: true,
        text: 'fast [TIMES]',
        arguments: {
            TIMES: {type: ArgumentType.NUMBER, defaultValue: 2}
        }
    },
    {
        opcode: 'slow',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        inTrack: true,
        text: 'slow [CYCLES]',
        arguments: {
            CYCLES: {type: ArgumentType.NUMBER, defaultValue: 2}
        }
    },
    {
        opcode: 'scale',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        inTrack: true,
        text: 'scale [ROOT] [SCALE]',
        arguments: {
            ROOT: {type: ArgumentType.STRING, menu: 'root', defaultValue: 'C4'},
            SCALE: {type: ArgumentType.STRING, menu: 'scale', defaultValue: 'major'}
        }
    },
    {
        opcode: 'struct',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        inTrack: true,
        text: 'struct [RHYTHM]',
        arguments: {
            RHYTHM: {type: ArgumentType.STRING, defaultValue: 'x ~ x x'}
        }
    },
    {
        opcode: 'bank',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        inTrack: true,
        text: 'bank [MACHINE]',
        arguments: {
            MACHINE: {type: ArgumentType.STRING, menu: 'machine', defaultValue: 'RolandTR909'}
        }
    },
    {
        opcode: 'effect',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        inTrack: true,
        text: '[EFFECT] [VALUE]',
        arguments: {
            EFFECT: {type: ArgumentType.STRING, menu: 'effect', defaultValue: 'lpf'},
            VALUE: {type: ArgumentType.STRING, defaultValue: '800'}
        }
    },
    {
        opcode: 'add',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        inTrack: true,
        text: 'add [VALUE]',
        arguments: {
            VALUE: {type: ArgumentType.STRING, defaultValue: '<0 3 5>'}
        }
    },
    {
        opcode: 'rev',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        inTrack: true,
        text: 'rev'
    },
    {
        opcode: 'ply',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        inTrack: true,
        text: 'ply [TIMES]',
        arguments: {
            TIMES: {type: ArgumentType.NUMBER, defaultValue: 2}
        }
    },
    {
        opcode: 'every',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        inTrack: true,
        text: 'every [CYCLES] [TRANSFORM]',
        arguments: {
            CYCLES: {type: ArgumentType.NUMBER, defaultValue: 4},
            TRANSFORM: {type: ArgumentType.STRING, menu: 'transform', defaultValue: 'rev'}
        }
    },
    {
        opcode: 'degradeBy',
        blockType: BlockType.COMMAND,
        level: LEVEL.MASTER,
        inTrack: true,
        text: 'degradeBy [PERCENT] %',
        arguments: {
            PERCENT: {type: ArgumentType.NUMBER, defaultValue: 50}
        }
    },
    {
        opcode: 'sometimes',
        blockType: BlockType.COMMAND,
        level: LEVEL.MASTER,
        inTrack: true,
        text: 'sometimes [TRANSFORM]',
        arguments: {
            TRANSFORM: {type: ArgumentType.STRING, menu: 'transform', defaultValue: 'up12'}
        }
    },
    {
        opcode: 'euclid',
        blockType: BlockType.COMMAND,
        level: LEVEL.MASTER,
        inTrack: true,
        text: 'euclid [PULSES] [STEPS]',
        arguments: {
            PULSES: {type: ArgumentType.NUMBER, defaultValue: 3},
            STEPS: {type: ArgumentType.NUMBER, defaultValue: 8}
        }
    },
    {
        opcode: 'jux',
        blockType: BlockType.COMMAND,
        level: LEVEL.MASTER,
        inTrack: true,
        text: 'jux [TRANSFORM]',
        arguments: {
            TRANSFORM: {type: ArgumentType.STRING, menu: 'transform', defaultValue: 'rev'}
        }
    },
    {
        opcode: 'off',
        blockType: BlockType.COMMAND,
        level: LEVEL.MASTER,
        inTrack: true,
        text: 'off [TIME] [TRANSFORM]',
        arguments: {
            TIME: {type: ArgumentType.STRING, menu: 'offTime', defaultValue: '0.125'},
            TRANSFORM: {type: ArgumentType.STRING, menu: 'transform', defaultValue: 'up12'}
        }
    },
    {
        opcode: 'superimpose',
        blockType: BlockType.COMMAND,
        level: LEVEL.MASTER,
        inTrack: true,
        text: 'superimpose [TRANSFORM]',
        arguments: {
            TRANSFORM: {type: ArgumentType.STRING, menu: 'transform', defaultValue: 'up12'}
        }
    },
    {
        opcode: 'chop',
        blockType: BlockType.COMMAND,
        level: LEVEL.MASTER,
        inTrack: true,
        text: 'chop [PIECES]',
        arguments: {
            PIECES: {type: ArgumentType.NUMBER, defaultValue: 4}
        }
    },
    {
        opcode: 'transpose',
        blockType: BlockType.COMMAND,
        level: LEVEL.MASTER,
        inTrack: true,
        text: 'transpose [SEMITONES]',
        arguments: {
            SEMITONES: {type: ArgumentType.NUMBER, defaultValue: 7}
        }
    },
    {
        opcode: 'arp',
        blockType: BlockType.COMMAND,
        level: LEVEL.MASTER,
        inTrack: true,
        text: 'arp [ORDER]',
        arguments: {
            ORDER: {type: ArgumentType.STRING, defaultValue: '0 1 2 1'}
        }
    },
    {
        opcode: 'acidenv',
        blockType: BlockType.COMMAND,
        level: LEVEL.MASTER,
        inTrack: true,
        text: 'acidenv [AMOUNT]',
        arguments: {
            AMOUNT: {type: ArgumentType.NUMBER, defaultValue: 0.5}
        }
    },
    {
        opcode: 'trancegate',
        blockType: BlockType.COMMAND,
        level: LEVEL.MASTER,
        inTrack: true,
        text: 'trancegate [DENSITY] [SEED] [LENGTH]',
        arguments: {
            DENSITY: {type: ArgumentType.NUMBER, defaultValue: 0.5},
            SEED: {type: ArgumentType.NUMBER, defaultValue: 0},
            LENGTH: {type: ArgumentType.NUMBER, defaultValue: 1}
        }
    },
    '---',
    // values to put in the inputs
    {
        opcode: 'listMini',
        blockType: BlockType.REPORTER,
        level: LEVEL.STANDARD,
        text: 'items of list [LISTNAME] [HOW]',
        arguments: {
            LISTNAME: {type: ArgumentType.STRING, menu: 'list'},
            HOW: {type: ArgumentType.STRING, menu: 'listHow', defaultValue: 'cycle'}
        }
    },
    {
        opcode: 'wave',
        blockType: BlockType.REPORTER,
        level: LEVEL.MASTER,
        text: '[SHAPE] range [MIN] [MAX] slow [CYCLES]',
        arguments: {
            SHAPE: {type: ArgumentType.STRING, menu: 'shape', defaultValue: 'sine'},
            MIN: {type: ArgumentType.NUMBER, defaultValue: 200},
            MAX: {type: ArgumentType.NUMBER, defaultValue: 2000},
            CYCLES: {type: ArgumentType.NUMBER, defaultValue: 4}
        }
    },
    {
        opcode: 'randomSteps',
        blockType: BlockType.REPORTER,
        level: LEVEL.MASTER,
        text: 'irand [MIN] .. [MAX] seg [STEPS] rib [SEED] [LENGTH]',
        arguments: {
            MIN: {type: ArgumentType.NUMBER, defaultValue: 0},
            MAX: {type: ArgumentType.NUMBER, defaultValue: 7},
            STEPS: {type: ArgumentType.NUMBER, defaultValue: 16},
            SEED: {type: ArgumentType.NUMBER, defaultValue: 0},
            LENGTH: {type: ArgumentType.NUMBER, defaultValue: 1}
        }
    },
    '---',
    {
        opcode: 'whenBeat',
        blockType: BlockType.HAT,
        level: LEVEL.BEGINNER,
        isEdgeActivated: false,
        text: 'when a beat comes'
    },
    {
        opcode: 'whenSound',
        blockType: BlockType.HAT,
        level: LEVEL.BEGINNER,
        isEdgeActivated: false,
        text: 'when [DRUM] sounds',
        arguments: {
            DRUM: {type: ArgumentType.STRING, menu: 'drumField', defaultValue: 'bd'}
        }
    },
    {
        opcode: 'beatInCycle',
        blockType: BlockType.REPORTER,
        level: LEVEL.BEGINNER,
        text: 'beat'
    },
    {
        opcode: 'cycle',
        blockType: BlockType.REPORTER,
        level: LEVEL.BEGINNER,
        text: 'cycle'
    },
    '---',
    {
        opcode: 'strudelCode',
        blockType: BlockType.REPORTER,
        level: LEVEL.STANDARD,
        text: 'Strudel code of all tracks'
    },
    {
        opcode: 'openStrudel',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        text: 'open all tracks in strudel.cc'
    },
    '---',
    {
        opcode: 'showViz',
        blockType: BlockType.COMMAND,
        level: LEVEL.BEGINNER,
        text: 'show [VIZ]',
        arguments: {
            VIZ: {type: ArgumentType.STRING, menu: 'viz', defaultValue: 'scope'}
        }
    },
    {
        opcode: 'hideViz',
        blockType: BlockType.COMMAND,
        level: LEVEL.BEGINNER,
        text: 'hide the picture of sound'
    },
    {
        opcode: 'vizLayer',
        blockType: BlockType.COMMAND,
        level: LEVEL.STANDARD,
        text: 'put the picture of sound [LAYER] the sprites',
        arguments: {
            LAYER: {type: ArgumentType.STRING, menu: 'layer', defaultValue: 'back'}
        }
    }
];

const DRUM_ITEMS = [
    ['bd', 'bd'],
    ['sd', 'sd'],
    ['hh', 'hh'],
    ['oh', 'oh'],
    ['cp', 'cp'],
    ['rim', 'rim'],
    ['lt', 'lt'],
    ['mt', 'mt'],
    ['ht', 'ht'],
    ['cr', 'cr'],
    ['sbd', 'sbd']
];

const NOTE_ITEMS = [
    ['c4', 'c4'],
    ['d4', 'd4'],
    ['e4', 'e4'],
    ['f4', 'f4'],
    ['g4', 'g4'],
    ['a4', 'a4'],
    ['b4', 'b4'],
    ['c5', 'c5']
];

const REST_ITEMS = [
    ['~', '~'],
    ['white', 'white']
];

const SYNTH_ITEMS = [
    ['sine', 'sine'],
    ['square', 'square'],
    ['sawtooth', 'sawtooth'],
    ['triangle', 'triangle'],
    ['supersaw', 'supersaw']
];

const LEVEL_ITEMS = [
    ['1', 'beginner'],
    ['2', 'normal'],
    ['3', 'master']
];

const ROOT_ITEMS = [
    ['C4', 'C4'],
    ['D4', 'D4'],
    ['E4', 'E4'],
    ['F4', 'F4'],
    ['G4', 'G4'],
    ['A3', 'A3'],
    ['B3', 'B3']
];

/** Scale names of Strudel. Spaces in tonal names are written with colons. */
const LIST_HOW_ITEMS = [
    ['cycle', 'one in each cycle'],
    ['seq', 'in order in a cycle'],
    ['stack', 'all together']
];

const SCALE_ITEMS = [
    ['major', 'major'],
    ['minor', 'minor'],
    ['major:pentatonic', 'major:pentatonic'],
    ['minor:pentatonic', 'minor:pentatonic'],
    ['blues', 'blues'],
    ['dorian', 'dorian'],
    ['chromatic', 'chromatic']
];

/** Effects and the range of their values. Null is an effect which takes letters. */
export const EFFECTS = {
    lpf: [20, 20000],
    hpf: [20, 20000],
    room: [0, 10],
    delay: [0, 1],
    gain: [0, 4],
    pan: [0, 1],
    crush: [1, 16],
    speed: [-4, 4],
    attack: [0, 4],
    release: [0, 8],
    clip: [0, 4],
    decay: [0, 4],
    sustain: [0, 1],
    delaytime: [0, 2],
    delayfeedback: [0, 0.95],
    lpq: [0, 30],
    lpenv: [-16, 16],
    lpd: [0, 2],
    lps: [0, 1],
    unison: [1, 8],
    detune: [0, 2],
    spread: [0, 1],
    distort: [0, 10],
    fm: [0, 8],
    vowel: null,
    orbit: [1, 8],
    // orbits to duck, such as 2 or 2:3:4
    duck: null,
    duckattack: [0.002, 2],
    duckdepth: [0, 1]
};

const EFFECT_ITEMS = [
    ['lpf', 'lpf'],
    ['hpf', 'hpf'],
    ['room', 'room'],
    ['delay', 'delay'],
    ['gain', 'gain'],
    ['pan', 'pan'],
    ['crush', 'crush'],
    ['speed', 'speed'],
    ['attack', 'attack'],
    ['release', 'release'],
    ['clip', 'clip'],
    ['decay', 'decay'],
    ['sustain', 'sustain'],
    ['delaytime', 'delaytime'],
    ['delayfeedback', 'delayfeedback'],
    ['lpq', 'lpq'],
    ['lpenv', 'lpenv'],
    ['lpd', 'lpd'],
    ['lps', 'lps'],
    ['unison', 'unison'],
    ['detune', 'detune'],
    ['spread', 'spread'],
    ['distort', 'distort'],
    ['fm', 'fm'],
    ['vowel', 'vowel'],
    ['orbit', 'orbit'],
    ['duck', 'duck'],
    ['duckattack', 'duckattack'],
    ['duckdepth', 'duckdepth']
];

const BANK_ITEMS = [
    ['drums', 'drum machines'],
    ['piano', 'piano'],
    ['dirt', 'Dirt-Samples (casio, jazz ...)'],
    ['vcsl', 'VCSL instruments']
];

const MACHINE_ITEMS = [
    'RolandTR909', 'RolandTR808', 'RolandTR707', 'LinnDrum',
    'OberheimDMX', 'KorgMinipops', 'CasioRZ1', 'BossDR55'
].map(m => [m, m]);

/** Transforms of the every, sometimes, jux and off blocks: menu value to {fn, args}. */
export const TRANSFORMS = {
    rev: {fn: 'rev', args: []},
    fast: {fn: 'fast', args: [2]},
    slow: {fn: 'slow', args: [2]},
    ply: {fn: 'ply', args: [2]},
    up12: {fn: 'transpose', args: [12]},
    up7: {fn: 'transpose', args: [7]}
};

const TRANSFORM_ITEMS = [
    ['rev', 'rev'],
    ['fast', 'fast 2'],
    ['slow', 'slow 2'],
    ['ply', 'ply 2'],
    ['up12', 'transpose 12'],
    ['up7', 'transpose 7']
];

const SHAPE_ITEMS = [
    ['sine', 'sine'],
    ['saw', 'saw'],
    ['square', 'square'],
    ['tri', 'tri'],
    ['rand', 'rand'],
    ['perlin', 'perlin']
];

const OFF_TIME_ITEMS = [
    ['0.0625', '1/16'],
    ['0.125', '1/8'],
    ['0.25', '1/4'],
    ['0.5', '1/2']
];

/** Chords: semitones from the root. */
export const CHORDS = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    seventh: [0, 4, 7, 10],
    major7: [0, 4, 7, 11],
    minor7: [0, 3, 7, 10],
    sus4: [0, 5, 7]
};

const CHORD_ITEMS = [
    ['major', 'major'],
    ['minor', 'minor'],
    ['seventh', '7'],
    ['major7', 'maj7'],
    ['minor7', 'm7'],
    ['sus4', 'sus4']
];

const VIZ_ITEMS = [
    ['scope', 'scope'],
    ['pianoroll', 'pianoroll'],
    ['spectrum', 'spectrum'],
    ['punchcard', 'punchcard']
];

const LAYER_ITEMS = [
    ['back', 'behind'],
    ['front', 'in front of']
];

/**
 * Menu definitions.
 * The message id of an item is `strudel.menu.<group>.<value>`.
 * An item can have its own group as the third element.
 * Dynamic menus are defined in the extension class.
 * @type {object}
 */
export const MENUS = {
    // a sound of seq, stack and cat: a drum, a note or a rest, or a value block such as the items of a list
    sound: {
        acceptReporters: true,
        items: [
            ...DRUM_ITEMS.map(item => item.concat('drum')),
            ...NOTE_ITEMS.map(item => item.concat('note')),
            ...REST_ITEMS.map(item => item.concat('sound'))
        ]
    },
    // the first sound of a track, or the sound of notes
    sName: {
        acceptReporters: true,
        items: [
            ...DRUM_ITEMS.map(item => item.concat('drum')),
            ...SYNTH_ITEMS.map(item => item.concat('synth')),
            ...REST_ITEMS.map(item => item.concat('sound'))
        ]
    },
    note: {acceptReporters: true, group: 'note', items: NOTE_ITEMS},
    drumField: {acceptReporters: false, group: 'drum', items: DRUM_ITEMS},
    level: {acceptReporters: false, group: 'level', items: LEVEL_ITEMS},
    root: {acceptReporters: true, group: 'root', items: ROOT_ITEMS},
    scale: {acceptReporters: true, group: 'scale', items: SCALE_ITEMS},
    effect: {acceptReporters: false, group: 'effect', items: EFFECT_ITEMS},
    bank: {acceptReporters: false, group: 'bank', items: BANK_ITEMS},
    machine: {acceptReporters: true, group: 'machine', items: MACHINE_ITEMS},
    transform: {acceptReporters: false, group: 'transform', items: TRANSFORM_ITEMS},
    shape: {acceptReporters: false, group: 'shape', items: SHAPE_ITEMS},
    offTime: {acceptReporters: false, group: 'offTime', items: OFF_TIME_ITEMS},
    chord: {acceptReporters: true, group: 'chord', items: CHORD_ITEMS},
    viz: {acceptReporters: false, group: 'viz', items: VIZ_ITEMS},
    layer: {acceptReporters: false, group: 'layer', items: LAYER_ITEMS},
    listHow: {acceptReporters: false, group: 'listHow', items: LIST_HOW_ITEMS}
};

/**
 * @param {string} opcode - opcode of a block
 * @returns {number} - level of the block, or 0 if it is not a block of this extension
 */
export const levelOf = opcode => {
    const block = BLOCKS.find(b => typeof b === 'object' && b.opcode === opcode);
    return block ? block.level : 0;
};
