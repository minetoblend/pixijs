import { Matrix } from '../../../maths/Matrix';
import { Point } from '../../../maths/Point';
import { GpuProgram } from '../../renderers/gpu/shader/GpuProgram';
import { UniformGroup } from '../../renderers/shared/shader/UniformGroup';
import { Filter } from '../Filter';
import source from './displacement.wgsl';

import type { Texture } from '../../renderers/shared/texture/Texture';
import type { Sprite } from '../../sprite/shared/Sprite';
import type { FilterSystem } from '../shared/FilterSystem';

export interface DisplacementFilterOptions
{
    sprite: Sprite,
    scale?: number | { x: number, y: number },
}

/**
 * A Noise effect filter.
 *
 * original filter: https://github.com/evanw/glfx.js/blob/master/src/filters/adjust/noise.js
 * @memberof PIXI.filters
 * @author Vico @vicocotea
 */
export class DisplacementFilter extends Filter
{
    uniformGroup: UniformGroup;
    sprite: Sprite;

    constructor(options: DisplacementFilterOptions)
    {
        let scale = options.scale || 20;

        const filterUniforms = new UniformGroup({
            filterMatrix: { value: new Matrix(), type: 'mat3x3<f32>' },
            scale: { value: scale, type: 'vec2<f32>' },
            rotation: { value: new Float32Array([0, 0, 0, 0]), type: 'vec4<f32>' },
        });

        const gpuProgram = new GpuProgram({
            vertex: {
                source,
                entryPoint: 'mainVertex',
            },
            fragment: {
                source,
                entryPoint: 'mainFragment',
            },
        });

        const texture = options.sprite.texture;

        super({
            gpuProgram,
            resources: {
                filterUniforms,
                mapTexture: texture.source,
                mapStyle: texture.style,
            }
        });

        this.sprite = options.sprite;
        this.sprite.renderable = false;

        // check if is a number or a point
        if (typeof scale === 'number')
        {
            scale = new Point(scale, scale);
        }
    }

    public apply(
        filterManager: FilterSystem,
        input: Texture,
        output: Texture,
        clearMode: boolean
    ): void
    {
        filterManager.calculateSpriteMatrix(
            this.uniformGroup.uniforms.filterMatrix as Matrix,
            this.sprite
        );

        // Extract rotation from world transform
        const wt = this.sprite.worldTransform;
        const lenX = Math.sqrt((wt.a * wt.a) + (wt.b * wt.b));
        const lenY = Math.sqrt((wt.c * wt.c) + (wt.d * wt.d));

        const uniforms = this.resources.filterUniforms.uniforms;

        if (lenX !== 0 && lenY !== 0)
        {
            uniforms.rotation[0] = wt.a / lenX;
            uniforms.rotation[1] = wt.b / lenX;
            uniforms.rotation[2] = wt.c / lenY;
            uniforms.rotation[3] = wt.d / lenY;
        }

        this.uniformGroup.update();

        this.resources.mapTexture = this.sprite.texture.source;

        filterManager.applyFilter(this, input, output, clearMode);
    }

    get scale(): Point
    {
        return this.uniformGroup.uniforms.scale as Point;
    }
}
