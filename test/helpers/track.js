/**
 * Run the C block "play on track" and the blocks in it without Scratch.
 * A step is [opcode, args], a block in the C block from the top.
 * A step of a C block in the track is [opcode, args, steps], with the blocks in it.
 */

/**
 * Utility of a block, with the frames of a thread as Scratch has.
 * @param {object} [target] - target which runs the blocks
 * @returns {object} - utility
 */
export const makeUtil = target => {
    const frames = [{executionContext: null}];
    return {
        target,
        thread: {stackFrames: frames},
        get stackFrame () {
            const frame = frames[frames.length - 1];
            if (!frame.executionContext) frame.executionContext = {};
            return frame.executionContext;
        },
        branches: 0,
        startBranch () {
            this.branches++;
        }
    };
};

/**
 * Run the blocks in the branch of a C block.
 * @param {object} ext - extension
 * @param {object} util - utility which has run the C block
 * @param {Array} steps - blocks in the C block
 */
const runBranch = (ext, util, steps) => {
    util.thread.stackFrames.push({executionContext: null});
    steps.forEach(([opcode, args, inner]) => {
        ext[opcode](args || {}, util);
        if (!inner) return;
        // the C block, its branch, then the C block again
        runBranch(ext, util, inner);
        ext[opcode](args || {}, util);
    });
    util.thread.stackFrames.pop();
};

/**
 * Play a track as Scratch runs the C block: the block, its branch, then the block again.
 * @param {object} ext - extension
 * @param {string} track - track name
 * @param {Array} steps - blocks in the C block
 * @param {object} [target] - target which runs the blocks
 * @returns {?Promise} - what the C block returns at the end
 */
export const playTrack = (ext, track, steps, target) => {
    const util = makeUtil(target);
    ext.track({TRACK: track}, util);
    runBranch(ext, util, steps);
    return ext.track({TRACK: track}, util);
};

/**
 * @param {object} ext - extension
 * @param {Array} steps - blocks in the C block
 * @param {object} [target] - target which runs the blocks
 * @returns {?object} - pattern node which the blocks build, or null when they build nothing
 */
export const build = (ext, steps, target) => {
    const util = makeUtil(target);
    util.stackFrame.strudelTrack = {node: null};
    runBranch(ext, util, steps);
    return util.thread.stackFrames[0].executionContext.strudelTrack.node;
};

/**
 * @param {object} ext - extension
 * @param {Array} steps - blocks in the C block
 * @param {object} [target] - target which runs the blocks
 * @returns {string} - Strudel code of the pattern
 */
export const codeOf = (ext, steps, target) => String(build(ext, steps, target));
