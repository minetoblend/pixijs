import { Container } from '../../src/rendering/scene/Container';
import { updateLayerGroupTransforms } from '../../src/rendering/scene/utils/updateLayerGroupTransforms';

function check32BitColorMatches(color1: number, color2: number[] | number): void
{
    const r = (color1 >> 24) & 0xFF;
    const g = (color1 >> 16) & 0xFF;
    const b = (color1 >> 8) & 0xFF;
    const a = color1 & 0xFF;

    if (Array.isArray(color2))
    {
        //     console.log('compare:', [r, g, b, a], color2);

        expect([r, g, b, a]).toEqual(color2);

        return;
    }

    const r2 = (color2 >> 24) & 0xFF;
    const g2 = (color2 >> 16) & 0xFF;
    const b2 = (color2 >> 8) & 0xFF;
    const a2 = color2 & 0xFF;

    //  console.log('compare:', [r, g, b, a], [r2, g2, b2, a2]);

    expect([r, g, b, a]).toEqual([r2, g2, b2, a2]);
}

describe('Transform Tints', () =>
{
    it('should set and return alpha correctly', async () =>
    {
        const root = new Container();

        root.onUpdate = jest.fn();

        root.alpha = 0.5;

        const roundedAlpha = ((0.5 * 255) | 0) / 255;

        expect((root.alpha)).toEqual(roundedAlpha);

        root.alpha = 0.5;

        expect(root.onUpdate).toHaveBeenCalledTimes(1);
    });

    it('should set and return tints correctly', async () =>
    {
        const root = new Container();

        root.onUpdate = jest.fn();

        root.tint = 0xFF0000;

        expect((root.tint)).toEqual(0xFF0000);
        root.tint = 0xFF0000;

        expect(root.onUpdate).toHaveBeenCalledTimes(1);
    });

    it('should set and return both alpha and tint correctly', async () =>
    {
        const root = new Container();

        root.onUpdate = jest.fn();

        root.tint = 0xFF00FF;
        root.alpha = 0.5;

        expect((root.tint)).toEqual(0xFF00FF);

        const roundedAlpha = ((0.5 * 255) | 0) / 255;

        expect((root.alpha)).toEqual(roundedAlpha);

        check32BitColorMatches(root.localColor, [127, 255, 0, 255]);

        expect(root.onUpdate).toHaveBeenCalledTimes(2);
    });

    it('should update global alpha correctly', async () =>
    {
        const root = new Container({
            layer: true,
            label: 'root',
        });
        const container2 = new Container({ label: 'container2' });
        const child = new Container({ label: 'child' });

        root.addChild(container2);
        container2.addChild(child);

        container2.alpha = 0.5;
        child.alpha = 0.5;

        updateLayerGroupTransforms(root.layerGroup, true);

        check32BitColorMatches(child.layerColor, [63, 255, 255, 255]);
    });

    it('should update global color (parent set only) correctly', async () =>
    {
        const root = new Container({
            layer: true,
        });
        const container2 = new Container();
        const child = new Container();

        root.addChild(container2);
        container2.addChild(child);

        container2.tint = 0xFF0000;

        updateLayerGroupTransforms(root.layerGroup, true);

        check32BitColorMatches(child.layerColor, [255, 0, 0, 255]);
    });

    it('should update global color (child set only) correctly', async () =>
    {
        const root = new Container({
            layer: true,
        });
        const container2 = new Container();
        const child = new Container();

        root.addChild(container2);
        container2.addChild(child);

        child.tint = 0xFF0000;

        updateLayerGroupTransforms(root.layerGroup, true);

        check32BitColorMatches(child.layerColor, [255, 0, 0, 255]);
    });

    it('should update global color (parent and child set) correctly', async () =>
    {
        const root = new Container({
            layer: true,
        });
        const container2 = new Container();
        const child = new Container();

        // |- root (layer group)
        //     |- container2
        //         |- child

        root.addChild(container2);
        container2.addChild(child);

        container2.tint = 0xFF0000;
        child.tint = 0x00FF00;

        updateLayerGroupTransforms(root.layerGroup, true);
        // ABGR
        check32BitColorMatches(child.layerColor, [255, 0, 127, 128]);
    });

    it('should update  alpha and color with nested layer group correctly', async () =>
    {
        // should ignore the alpha of the parent layer group

        const root = new Container({
            layer: true,
            label: 'root',
        });

        const container2 = new Container({
            layer: true,
            label: 'container2',
        });

        const child = new Container({
            label: 'child',
        });

        // |- root (layer group)
        //     |- container2 (render group)
        //         |- child

        root.addChild(container2);
        container2.addChild(child);

        container2.tint = 0xFF0000;
        child.tint = 0x00FF00;

        updateLayerGroupTransforms(root.layerGroup, true);

        check32BitColorMatches(child.layerColor, [255, 0, 255, 0]);
    });

    it('should update cap alpha to 1', async () =>
    {
        const container = new Container();

        container.alpha = 3;
        expect(container.alpha).toBeGreaterThan(0.99);

        container.alpha = -3;
        expect(container.alpha).toBeLessThan(0.02);
    });

    it('should update set world layer correctly', async () =>
    {
        const root = new Container({
            layer: true,
            label: 'root',
        });

        const container2 = new Container({
            layer: true,
            label: 'container2',
        });

        const child = new Container({
            label: 'child',
        });

        root.addChild(container2);
        container2.addChild(child);

        root.alpha = 0.5;

        updateLayerGroupTransforms(root.layerGroup, true);

        check32BitColorMatches(container2.layerGroup.worldColor, [127, 255, 255, 255]);

        check32BitColorMatches(child.layerColor, [255, 255, 255, 255]);
    });
});
