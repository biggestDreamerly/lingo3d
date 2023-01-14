import {
    revoluteJointDefaults,
    revoluteJointSchema
} from "../../interface/IRevoluteJoint"
import { getPhysX } from "../../states/usePhysX"
import JointBase from "../core/JointBase"
import PhysicsObjectManager from "../core/PhysicsObjectManager"

const createRevolute = (actor0: any, pose0: any, actor1: any, pose1: any) => {
    const { physics, Px } = getPhysX()
    const j = Px.RevoluteJointCreate(physics, actor0, pose0, actor1, pose1)
    return j
}

export default class RevoluteJoint extends JointBase {
    public static componentName = "revoluteJoint"
    public static defaults = revoluteJointDefaults
    public static schema = revoluteJointSchema

    protected createJoint(
        fromPxTransform: any,
        toPxTransform: any,
        fromManager: PhysicsObjectManager,
        toManager: PhysicsObjectManager
    ) {
        return createRevolute(
            fromManager.actor,
            fromPxTransform,
            toManager.actor,
            toPxTransform
        )
    }
}
