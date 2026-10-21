import {Fraction, Pattern, TimeSpan, silence, stack} from '@strudel/core';

/**
 * Pattern that plays `before` until cycle `at`, then `after`.
 * @param {Pattern} before - pattern before the switch
 * @param {Pattern} after - pattern after the switch
 * @param {number} at - cycle position of the switch
 * @returns {Pattern} - switched pattern
 */
export const switchAt = (before, after, at) => {
    const t = Fraction(at);
    return new Pattern(state => {
        const {begin, end} = state.span;
        if (end.lte(t)) return before.query(state);
        if (begin.gte(t)) return after.query(state);
        return before.query(state.setSpan(new TimeSpan(begin, t)))
            .concat(after.query(state.setSpan(new TimeSpan(t, end))));
    });
};

/**
 * Named tracks which are stacked into one pattern.
 * Replacing a track takes effect at the next cycle boundary.
 */
export class Tracks {
    constructor () {
        /** @type {Map<string, {before: Pattern, after: Pattern, at: number, removed: boolean}>} */
        this.tracks = new Map();
    }

    /**
     * @param {string} name - track name
     * @param {number} now - current cycle position
     * @returns {Pattern} - the pattern which is sounding at `now`
     */
    current (name, now) {
        const track = this.tracks.get(name);
        if (!track) return silence;
        return now >= track.at ? track.after : track.before;
    }

    /**
     * @param {string} name - track name
     * @param {Pattern} pattern - new pattern
     * @param {number} now - first cycle position which can still be changed
     * @param {boolean} [removed] - true if the track is being removed
     */
    set (name, pattern, now, removed = false) {
        this.prune(now);
        this.tracks.set(name, {
            before: this.current(name, now),
            after: pattern,
            at: Math.ceil(now),
            removed
        });
    }

    /**
     * @param {string} name - track name
     * @param {number} now - first cycle position which can still be changed
     */
    remove (name, now) {
        if (!this.tracks.has(name)) return;
        this.set(name, silence, now, true);
    }

    /**
     * Delete tracks which have been removed completely.
     * @param {number} now - first cycle position which can still be changed
     */
    prune (now) {
        this.tracks.forEach((track, name) => {
            if (track.removed && now >= track.at) this.tracks.delete(name);
        });
    }

    clear () {
        this.tracks.clear();
    }

    get size () {
        return this.tracks.size;
    }

    /**
     * @returns {Pattern} - all tracks stacked
     */
    pattern () {
        if (!this.tracks.size) return silence;
        return stack(...Array.from(this.tracks.values(), t => switchAt(t.before, t.after, t.at)));
    }
}
