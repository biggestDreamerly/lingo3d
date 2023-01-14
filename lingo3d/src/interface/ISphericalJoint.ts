import MeshAppendable from "../api/core/MeshAppendable"
import IPositionedDirectionedManager, {
    positionedDirectionedManagerDefaults,
    positionedDirectionedManagerSchema
} from "./IPositionedDirectionedManager"
import { extendDefaults } from "./utils/Defaults"
import { ExtractProps } from "./utils/extractProps"
import Nullable from "./utils/Nullable"
import Range from "./utils/Range"

export default interface ISphericalJoint extends IPositionedDirectionedManager {
    from: Nullable<string | MeshAppendable>
    to: Nullable<string | MeshAppendable>
    yLimitAngle: number
    zLimitAngle: number
}

export const sphericalJointSchema: Required<ExtractProps<ISphericalJoint>> = {
    ...positionedDirectionedManagerSchema,
    from: [String, Object],
    to: [String, Object],
    yLimitAngle: Number,
    zLimitAngle: Number
}

export const sphericalJointDefaults = extendDefaults<ISphericalJoint>(
    [positionedDirectionedManagerDefaults],
    {
        from: undefined,
        to: undefined,
        yLimitAngle: 360,
        zLimitAngle: 360
    },
    {
        yLimitAngle: new Range(0, 360),
        zLimitAngle: new Range(0, 360)
    }
)