import {samples} from 'superdough';

/**
 * Sample maps of dough-samples, the samples which superdough documents for its users.
 * Pinned to a commit, so that a change of the repository does not change what is loaded.
 */
const COMMIT = '9eacfc86ec4393e68a463ff52b01c19cfaa77f38';
const BASE = `https://raw.githubusercontent.com/felixroos/dough-samples/${COMMIT}/`;

/**
 * Sample banks which can be loaded. Nothing else can be loaded,
 * so a shared project can not make the browser fetch any URL.
 */
export const BANKS = {
    drums: 'tidal-drum-machines.json',
    piano: 'piano.json',
    dirt: 'Dirt-Samples.json',
    vcsl: 'vcsl.json'
};

/**
 * Sound names in each sample map, to load the map when a pattern uses one of them.
 * The drum machines are found by .bank(), so their names are not listed.
 */
const SOUNDS = {
    piano: ['piano'],
    dirt: [
        'casio', 'crow', 'insect', 'wind', 'jazz', 'metal', 'east', 'space', 'numbers'
    ],
    vcsl: [
        'ballwhistle', 'bassdrum1', 'bassdrum2', 'bongo', 'conga', 'darbuka', 'framedrum', 'snare_modern',
        'snare_hi', 'snare_low', 'snare_rim', 'timpani', 'timpani_roll', 'timpani2', 'tom_mallet',
        'tom_stick', 'tom_rim', 'tom2_mallet', 'tom2_stick', 'tom2_rim', 'recorder_alto_stacc',
        'recorder_alto_vib', 'recorder_alto_sus', 'recorder_bass_stacc', 'recorder_bass_vib',
        'recorder_bass_sus', 'recorder_soprano_stacc', 'recorder_soprano_sus', 'recorder_tenor_stacc',
        'recorder_tenor_vib', 'recorder_tenor_sus', 'ocarina_small_stacc', 'ocarina_small', 'ocarina',
        'ocarina_vib', 'pipeorgan_loud_pedal', 'pipeorgan_loud', 'pipeorgan_quiet_pedal', 'pipeorgan_quiet',
        'organ_4inch', 'organ_8inch', 'organ_full', 'trainwhistle', 'harmonica', 'harmonica_soft',
        'harmonica_vib', 'super64', 'super64_acc', 'super64_vib', 'siren', 'didgeridoo', 'saxello',
        'saxello_stacc', 'saxello_vib', 'sax', 'sax_stacc', 'sax_vib', 'harp', 'folkharp', 'strumstick',
        'dantranh', 'dantranh_tremolo', 'dantranh_vibrato', 'kawai', 'steinway', 'psaltery_pluck',
        'psaltery_spiccato', 'psaltery_bow', 'clavisynth', 'fmpiano', 'piano1', 'wineglass',
        'wineglass_slow', 'agogo', 'anvil', 'brakedrum', 'balafon_hard', 'balafon_soft', 'balafon',
        'belltree', 'cabasa', 'cajon', 'clap', 'clash', 'clash2', 'clave', 'cowbell', 'fingercymbal',
        'flexatone', 'gong', 'gong2', 'guiro', 'glockenspiel', 'handbells', 'handchimes', 'hihat', 'kalimba',
        'kalimba2', 'kalimba3', 'kalimba4', 'kalimba5', 'marimba', 'marktrees', 'oceandrum', 'ratchet',
        'shaker_large', 'shaker_small', 'slapstick', 'sleighbells', 'slitdrum', 'sus_cymbal', 'sus_cymbal2',
        'tambourine', 'tambourine2', 'triangles', 'tubularbells', 'tubularbells2', 'vibraphone',
        'vibraphone_soft', 'vibraphone_bowed', 'vibraslap', 'woodblock', 'xylophone_hard_pp',
        'xylophone_hard_ff', 'xylophone_medium_ff', 'xylophone_medium_pp', 'xylophone_soft_pp',
        'xylophone_soft_ff'
    ]
};

/**
 * Sample maps which a pattern needs.
 * @param {Set<string>} names - sound names in the pattern
 * @param {boolean} usesBank - true if the pattern uses .bank()
 * @returns {Array<string>} - keys of BANKS
 */
export const banksFor = (names, usesBank) => {
    const banks = Object.keys(SOUNDS).filter(bank => SOUNDS[bank].some(name => names.has(name)));
    if (usesBank) banks.push('drums');
    return banks;
};

const loading = new Map();

/**
 * Load a sample bank once.
 * @param {string} bank - key of BANKS
 * @returns {Promise} - resolves when the sample map is registered
 */
export const loadBank = bank => {
    if (!Object.prototype.hasOwnProperty.call(BANKS, bank)) return Promise.reject(new Error(`unknown bank: ${bank}`));
    if (!loading.has(bank)) {
        const promise = samples(`${BASE}${BANKS[bank]}`).catch(e => {
            // allow to retry
            loading.delete(bank);
            throw e;
        });
        loading.set(bank, promise);
    }
    return loading.get(bank);
};
