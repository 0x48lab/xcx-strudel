import {LAYER, StageLayer} from '../../src/viz/layer.js';

const makeRenderer = () => {
    let next = 1;
    const renderer = {
        _allDrawables: {},
        createBitmapSkin: vi.fn(() => 100),
        createDrawable: vi.fn(group => {
            const id = next++;
            renderer._allDrawables[id] = {group, isTouching: () => true};
            return id;
        }),
        updateDrawableSkinId: vi.fn(),
        updateDrawableVisible: vi.fn(),
        destroyDrawable: vi.fn(),
        destroySkin: vi.fn(),
        updateBitmapSkin: vi.fn(),
        setDrawableOrder: vi.fn()
    };
    return renderer;
};

beforeEach(() => {
    globalThis.document = {createElement: () => ({getContext: () => ({clearRect: vi.fn()})})};
    globalThis.requestAnimationFrame = vi.fn(() => 1);
    globalThis.cancelAnimationFrame = vi.fn();
});

describe('StageLayer', () => {
    test('the picture does not catch clicks', () => {
        const renderer = makeRenderer();
        const layer = new StageLayer(renderer);
        expect(renderer._allDrawables[layer.drawableId].isTouching()).toBe(false);
        layer.setGroup(LAYER.FRONT);
        expect(renderer._allDrawables[layer.drawableId].isTouching()).toBe(false);
    });

    test('changing the group makes the drawable in the new group', () => {
        const renderer = makeRenderer();
        const layer = new StageLayer(renderer);
        const old = layer.drawableId;
        layer.setGroup(LAYER.FRONT);
        expect(renderer.destroyDrawable).toHaveBeenCalledWith(old, LAYER.BACK);
        expect(renderer._allDrawables[layer.drawableId].group).toBe(LAYER.FRONT);
    });

    test('frames are drawn at about 30 fps', () => {
        const renderer = makeRenderer();
        const layer = new StageLayer(renderer);
        const drawer = vi.fn();
        layer.show(drawer);
        [16.7, 33.4, 50.1, 66.8, 83.5, 100.2].forEach(t => layer.frame(t));
        expect(drawer).toHaveBeenCalledTimes(3);
    });

    test('the front layer stays above the sprites', () => {
        const renderer = makeRenderer();
        const layer = new StageLayer(renderer);
        layer.setGroup(LAYER.FRONT);
        layer.show(() => {});
        layer.frame(100);
        expect(renderer.setDrawableOrder).toHaveBeenCalledWith(layer.drawableId, Infinity, LAYER.FRONT);
    });

    test('a hidden layer stops drawing', () => {
        const renderer = makeRenderer();
        const layer = new StageLayer(renderer);
        const drawer = vi.fn();
        layer.show(drawer);
        layer.hide();
        layer.frame(100);
        expect(drawer).not.toHaveBeenCalled();
    });
});
