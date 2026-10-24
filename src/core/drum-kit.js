import {samples} from 'superdough';

/**
 * Recorded drums of uzu-drumkit, which strudel.cc plays for bd, sd, hh and others without a bank.
 * https://github.com/tidalcycles/uzu-drumkit (Unlicense, public domain)
 * Pinned to a commit, so that a change of the repository does not change what is loaded.
 */
const COMMIT = '2f3e05c70ab4d73ad053a1467adec89bd27377a0';
const BASE = `https://raw.githubusercontent.com/tidalcycles/uzu-drumkit/${COMMIT}/`;
const CHECK_TIMEOUT = 5000; // ms

/** Sound names and their files, in the order of the sample numbers such as bd:1. */
export const UZU_DRUMS = {
    bd: [
        'bd/10_bd_switchangel.wav',
        'bd/11_bd_mot4i.wav',
        'bd/12_bd_mot4i.wav',
        'bd/13_bd_mot4i.wav',
        'bd/14_bd_switchangel.wav',
        'bd/15_bd_switchangel.wav',
        'bd/16_bd_switchangel.wav',
        'bd/17_bd_switchangel.wav'
    ],
    brk: ['brk/10_break_amen_pprocessed.wav'],
    cb: ['cb/10_perc_switchangel.wav'],
    cp: ['cp/10_cp_switchangel.wav', 'cp/11_cp_mot4i.wav'],
    cr: ['cr/10_cr_switchangel.wav', 'cr/11_cr_mot4i.wav'],
    hh: [
        'hh/10_hh_switchangel.wav',
        'hh/11_hh_mot4i.wav',
        'hh/12_hh_switchangel.wav',
        'hh/13_hh_switchangel.wav',
        'hh/14_hh_mot4i.wav'
    ],
    ht: ['ht/10_ht_mot4i.wav'],
    lt: ['lt/10_lt_mot4i.wav'],
    misc: [
        'misc/10_misc_switchangel_ludens.wav',
        'misc/11_misc_switchangel_ludens.wav',
        'misc/12_misc_switchangel_ludens.wav',
        'misc/13_misc_switchangel_ludens.wav',
        'misc/14_misc_switchangel_ludens.wav'
    ],
    mt: ['mt/10_mt_mot4i.wav'],
    oh: [
        'oh/10_oh_switchangel.wav',
        'oh/11_oh_switchangel.wav',
        'oh/12_oh_switchangel.wav',
        'oh/13_oh_switchangel.wav'
    ],
    rd: ['rd/10_rd_switchangel.wav'],
    rim: ['rim/10_rim_switchangel.wav', 'rim/11_rim_switch_angel.wav'],
    sd: [
        'sd/10_sd_switchangel-bounce-2.wav',
        'sd/11_sd_switchangel_3.wav',
        'sd/12_sd_switchangel_2.wav',
        'sd/13_sd_switchangel_2.wav',
        'sd/14_sd.wav'
    ],
    sh: ['sh/10_sh_switchangel.wav'],
    tb: ['tb/10_tb.wav']
};

/** Drum kits: recorded drums of uzu-drumkit, or drums made with oscillators which need no network. */
export const DRUM_KITS = ['uzu', 'synth'];

let checking = null;

/**
 * Check once that the files of uzu-drumkit can be fetched, by fetching the first bass drum.
 * @returns {Promise} - resolves when they can be fetched
 */
export const checkUzuDrums = () => {
    if (!checking) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT);
        checking = fetch(`${BASE}${UZU_DRUMS.bd[0]}`, {signal: controller.signal})
            .then(response => {
                if (!response.ok) throw new Error(`uzu-drumkit is not found: ${response.status}`);
            })
            .catch(e => {
                // allow to retry
                checking = null;
                throw e;
            })
            .finally(() => clearTimeout(timer));
    }
    return checking;
};

/**
 * Register the drums of uzu-drumkit in place of the drums with the same names.
 * @returns {Promise} - resolves when they are registered
 */
export const registerUzuDrums = () => samples(UZU_DRUMS, BASE, {prebake: true});
