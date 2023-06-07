import { Matrix } from '../../../maths/Matrix';
import { updateLocalTransform } from '../utils/updateLocalTransform';

import type { Container } from '../Container';
import type { Bounds } from './Bounds';

export function getGlobalBounds(target: Container, skipUpdateTransform: boolean, bounds: Bounds): Bounds
{
    bounds.clear();

    let parentTransform;

    if (target.parent)
    {
        if (!skipUpdateTransform)
        {
            parentTransform = updateTransformBackwards(target, new Matrix());
        }
        else
        {
            parentTransform = target.parent.worldTransform;
        }
    }
    else
    {
        parentTransform = Matrix.IDENTITY;
    }

    // then collect them...

    _getGlobalBounds(target, bounds, parentTransform, skipUpdateTransform);

    if (!bounds.isValid)
    {
        bounds.set(0, 0, 0, 0);
    }

    return bounds;
}

export function _getGlobalBounds(
    target: Container,
    bounds: Bounds,
    parentTransform: Matrix,
    skipUpdateTransform: boolean,
): void
{
    if (!target.visible || !target.measurable) return;

    let worldTransform: Matrix;

    if (!skipUpdateTransform)
    {
        if (target.didChange)
        {
            updateLocalTransform(target.localTransform, target);
        }

        worldTransform = Matrix.shared.appendFrom(target.localTransform, parentTransform).clone();
    }
    else
    {
        worldTransform = target.worldTransform;
    }

    if (target.view)
    {
        bounds.setMatrix(worldTransform);

        target.view.addBounds(bounds);
    }

    for (let i = 0; i < target.children.length; i++)
    {
        _getGlobalBounds(target.children[i], bounds, worldTransform, skipUpdateTransform);
    }

    for (let i = 0; i < target.effects.length; i++)
    {
        target.effects[i].addBounds?.(bounds);
    }
}

export function updateTransformBackwards(target: Container, parentTransform: Matrix)
{
    const parent = target.parent;

    if (parent)
    {
        updateTransformBackwards(parent, parentTransform);

        if (parent.didChange)
        {
            updateLocalTransform(parent.localTransform, parent);
        }

        parentTransform.append(parent.localTransform);
    }

    return parentTransform;
}

