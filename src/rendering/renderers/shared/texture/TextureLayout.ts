import { groupD8 } from '../../../../maths/groupD8';
import { Rectangle } from '../../../../maths/shapes/Rectangle';
import { Runner } from '../runner/Runner';

export interface TextureLayoutOptions
{
    frame?: Rectangle;
    orig?: Rectangle;
    trim?: Rectangle;
    defaultAnchor?: { x: number; y: number };
    rotate?: number;
}

export type UVs = {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x3: number;
    y3: number;
};

export class TextureLayout
{
    frame: Rectangle;
    orig: Rectangle;

    rotate: number;
    uvs: UVs = { x0: 0, y0: 0, x1: 0, y1: 0, x2: 0, y2: 0, x3: 0, y3: 0 };

    trim?: Rectangle;
    defaultAnchor?: { x: number; y: number };

    onLayoutUpdate = new Runner('onLayoutUpdate');

    constructor(options: TextureLayoutOptions = {})
    {
        this.frame = options.frame || new Rectangle(0, 0, 1, 1);
        this.orig = options.orig || this.frame;

        this.rotate = options.rotate ?? 0;

        // optional
        this.trim = options.trim;
        this.defaultAnchor = options.defaultAnchor;

        this.updateUvs();
    }

    updateUvs()
    {
        const uvs = this.uvs;
        const frame = this.frame;
        let rotate = this.rotate;

        if (rotate)
        {
            // width and height div 2 div baseFrame size
            const w2 = frame.width / 2;
            const h2 = frame.height / 2;

            // coordinates of center
            const cX = frame.x + w2;
            const cY = frame.y + h2;

            rotate = groupD8.add(rotate, groupD8.NW); // NW is top-left corner
            uvs.x0 = cX + (w2 * groupD8.uX(rotate));
            uvs.y0 = cY + (h2 * groupD8.uY(rotate));

            rotate = groupD8.add(rotate, 2); // rotate 90 degrees clockwise
            uvs.x1 = cX + (w2 * groupD8.uX(rotate));
            uvs.y1 = cY + (h2 * groupD8.uY(rotate));

            rotate = groupD8.add(rotate, 2);
            uvs.x2 = cX + (w2 * groupD8.uX(rotate));
            uvs.y2 = cY + (h2 * groupD8.uY(rotate));

            rotate = groupD8.add(rotate, 2);
            uvs.x3 = cX + (w2 * groupD8.uX(rotate));
            uvs.y3 = cY + (h2 * groupD8.uY(rotate));
        }

        else
        {
            uvs.x0 = frame.x;
            uvs.y0 = frame.y;
            uvs.x1 = frame.x + frame.width;
            uvs.y1 = frame.y;
            uvs.x2 = frame.x + frame.width;
            uvs.y2 = frame.y + frame.height;
            uvs.x3 = frame.x;
            uvs.y3 = frame.y + frame.height;
        }
    }

    update()
    {
        this.updateUvs();
        this.onLayoutUpdate.emit(this);
    }

    /** Destroys this TextureLayout */
    destroy()
    {
        if (this.onLayoutUpdate)
        {
            this.onLayoutUpdate.removeAll();
            this.onLayoutUpdate = null;
        }
        this.frame = null;
        this.orig = null;
        this.trim = null;
        this.defaultAnchor = null;
        this.uvs = null;
    }
}
