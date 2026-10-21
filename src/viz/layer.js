const STAGE_WIDTH = 480;
const STAGE_HEIGHT = 360;
const FRAME_INTERVAL = 1000 / 30; // the VM draws the Stage at 30 fps

/** Layer groups of scratch-render. */
export const LAYER = {
    BACK: 'video', // between the backdrop and the sprites
    FRONT: 'sprite' // kept on top of the sprites
};

/**
 * A canvas drawn on a layer of the Stage.
 * `drawer` draws one frame: drawer(ctx, width, height).
 */
export class StageLayer {
    /**
     * @param {RenderWebGL} renderer - Scratch renderer
     */
    constructor (renderer) {
        this.renderer = renderer;
        this.canvas = document.createElement('canvas');
        this.canvas.width = STAGE_WIDTH;
        this.canvas.height = STAGE_HEIGHT;
        this.ctx = this.canvas.getContext('2d');
        this.skinId = renderer.createBitmapSkin(this.canvas, 1);
        this.group = LAYER.BACK;
        this.drawableId = this.createDrawable();
        /** @type {?Function} */
        this.drawer = null;
        this.visible = false;
        this.frameId = null;
        this.lastFrame = 0;
        this.frame = this.frame.bind(this);
    }

    /**
     * @returns {number} - drawable ID in the current group
     */
    createDrawable () {
        const id = this.renderer.createDrawable(this.group);
        this.renderer.updateDrawableSkinId(id, this.skinId);
        this.renderer.updateDrawableVisible(id, this.visible);
        // Clicks must reach the sprites under the picture. renderer.pick() asks each
        // drawable isTouching(), so this drawable answers no. It relies on scratch-render internals.
        const drawable = this.renderer._allDrawables && this.renderer._allDrawables[id];
        if (drawable) drawable.isTouching = () => false;
        return id;
    }

    /**
     * @param {string} group - LAYER.BACK or LAYER.FRONT
     */
    setGroup (group) {
        if (group === this.group) return;
        this.renderer.destroyDrawable(this.drawableId, this.group);
        this.group = group;
        this.drawableId = this.createDrawable();
    }

    /**
     * @param {?Function} drawer - function which draws a frame
     */
    show (drawer) {
        this.drawer = drawer;
        if (this.visible) return;
        this.visible = true;
        this.renderer.updateDrawableVisible(this.drawableId, true);
        if (this.frameId === null) this.frameId = requestAnimationFrame(this.frame);
    }

    hide () {
        this.visible = false;
        this.renderer.updateDrawableVisible(this.drawableId, false);
    }

    /**
     * @param {number} time - time of the animation frame
     */
    frame (time) {
        this.frameId = null;
        if (!this.visible) return;
        // a little shorter than the interval, because frames of a 60 Hz display come at about 16.7 ms
        if (time - this.lastFrame < FRAME_INTERVAL - 4) {
            this.frameId = requestAnimationFrame(this.frame);
            return;
        }
        this.lastFrame = time;
        this.ctx.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
        if (this.drawer) this.drawer(this.ctx, STAGE_WIDTH, STAGE_HEIGHT);
        this.renderer.updateBitmapSkin(this.skinId, this.canvas, 1);
        // sprites can come to the front with "go to front layer", so stay above them
        if (this.group === LAYER.FRONT) this.renderer.setDrawableOrder(this.drawableId, Infinity, this.group);
        this.frameId = requestAnimationFrame(this.frame);
    }

    dispose () {
        this.visible = false;
        if (this.frameId !== null) cancelAnimationFrame(this.frameId);
        this.frameId = null;
        this.renderer.destroyDrawable(this.drawableId, this.group);
        this.renderer.destroySkin(this.skinId);
    }
}
