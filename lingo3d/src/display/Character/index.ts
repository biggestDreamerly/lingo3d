import { Object3D, Quaternion } from "three"
import { onBeforeRender } from "../../events/onBeforeRender"
import { YBOT_URL } from "../../globals"
import IModel, { modelDefaults, modelSchema } from "../../interface/IModel"
import Bone from "../Bone"
import Model from "../Model"
import { subQuaternions } from "../utils/quaternions"

export default class Character extends Model implements IModel {
    public static override componentName = "character"
    public static override defaults = modelDefaults
    public static override schema = modelSchema

    public constructor() {
        super()
        this.width = 20
        this.depth = 20
        this.scale = 1.7

        this.src = YBOT_URL

        this.loaded.then((loaded) => {
            let arm: Object3D | undefined
            let foreArm: Object3D | undefined
            let hand: Object3D | undefined
            loaded.traverse((child) => {
                if (child.name === "mixamorigLeftArm" && !arm) arm = child
                if (child.name === "mixamorigLeftForeArm" && !foreArm)
                    foreArm = child
                if (child.name === "mixamorigLeftHand" && !hand) hand = child
            })
            if (!arm || !foreArm || !hand) return

            const data: Array<[Bone, Object3D, Quaternion]> = []
            const attachBone = (arm: Object3D, foreArm: Object3D) => {
                const bone = new Bone(arm, foreArm)
                const qDiff = subQuaternions(
                    bone.outerObject3d.quaternion.clone(),
                    arm.quaternion
                )
                data.push([bone, arm, qDiff])
            }
            attachBone(arm, foreArm)
            attachBone(foreArm, hand)

            const handle = onBeforeRender(() => {
                for (const [bone, arm, qDiff] of data) {
                    arm.quaternion.copy(bone.outerObject3d.quaternion)
                    subQuaternions(arm.quaternion, qDiff)
                }
            })
            return () => {
                handle.cancel()
            }
        })
    }
}
