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
