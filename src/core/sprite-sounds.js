import {samples} from 'superdough';

const MIME = {
    wav: 'audio/wav',
    mp3: 'audio/mpeg'
};

/**
 * Sounds of sprites registered as Strudel samples.
 * A sound is named by its asset ID, so the same sound is registered once.
 */
export class SpriteSounds {
    constructor () {
        /** @type {Map<string, string>} asset ID to sample name */
        this.names = new Map();
        /** @type {Array<string>} blob URLs to revoke */
        this.urls = [];
    }

    /**
     * @param {string} assetId - asset ID (md5) of a sound
     * @returns {string} - sample name which is safe in mini-notation
     */
    static nameOf (assetId) {
        return `scratch_${String(assetId).replace(/[^a-z0-9]/gi, '')
            .slice(0, 12)}`;
    }

    /**
     * Register a sound of a sprite to superdough.
     * @param {object} sound - sound of a sprite which has `asset`
     * @returns {?string} - sample name, or null if the sound has no data
     */
    register (sound) {
        if (!sound || !sound.asset || !sound.asset.data) return null;
        const assetId = sound.assetId || sound.asset.assetId;
        if (this.names.has(assetId)) return this.names.get(assetId);
        const name = SpriteSounds.nameOf(assetId);
        const type = MIME[sound.dataFormat] || 'audio/wav';
        const url = URL.createObjectURL(new Blob([sound.asset.data], {type}));
        this.urls.push(url);
        samples({[name]: [url]});
        this.names.set(assetId, name);
        return name;
    }

    dispose () {
        this.urls.forEach(url => URL.revokeObjectURL(url));
        this.urls = [];
        this.names.clear();
    }
}
