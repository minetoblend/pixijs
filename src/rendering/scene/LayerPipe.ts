import { ExtensionType } from '../../extensions/Extensions';
import { executeInstructions } from './utils/executeInstructions';

import type { ExtensionMetadata } from '../../extensions/Extensions';
import type { InstructionSet } from '../renderers/shared/instructions/InstructionSet';
import type { InstructionPipe } from '../renderers/shared/instructions/RenderPipe';
import type { Renderer } from '../renderers/types';
import type { LayerGroup } from './LayerGroup';

export class LayerPipe implements InstructionPipe<LayerGroup>
{
    static extension: ExtensionMetadata = {
        type: [
            ExtensionType.WebGLRendererPipes,
            ExtensionType.WebGPURendererPipes,
            ExtensionType.CanvasRendererPipes,
        ],
        name: 'layer',
    };

    private renderer: Renderer;

    constructor(renderer: Renderer)
    {
        this.renderer = renderer;
    }

    addLayerGroup(layerGroup: LayerGroup, instructionSet: InstructionSet): void
    {
        this.renderer.renderPipes.batch.break(instructionSet);

        instructionSet.add(layerGroup);
    }

    execute(layerGroup: LayerGroup)
    {
        this.renderer.globalUniforms.push({
            projectionMatrix: this.renderer.renderTarget.renderTarget.projectionMatrix,
            worldTransformMatrix: layerGroup.worldTransform,
            worldColor: layerGroup.worldColor,

        });

        executeInstructions(layerGroup, this.renderer.renderPipes);

        this.renderer.globalUniforms.pop();

        // now render a quad..
    }
}
