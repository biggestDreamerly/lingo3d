import { centroid3d } from "@lincode/math"
import { Reactive } from "@lincode/reactivity"
import { Vector3, Quaternion, Object3D } from "three"
import { TransformControlsPayload } from "../../events/onTransformControls"
import IJointBase from "../../interface/IJointBase"
import { getEditorBehavior } from "../../states/useEditorBehavior"
import { getEditorHelper } from "../../states/useEditorHelper"
import { flushMultipleSelectionTargets } from "../../states/useMultipleSelectionTargets"
import { getPhysXLoaded } from "../../states/usePhysXLoaded"
import { getWorldPlayComputed } from "../../states/useWorldPlayComputed"
import PhysicsObjectManager from "./PhysicsObjectManager"
import { physxPtr } from "../../pointers/physxPtr"
import { setPxTransform_, setPxTransform__ } from "../../engine/physx/pxMath"
import HelperSphere from "./utils/HelperSphere"
import { getAppendables } from "../../api/core/Appendable"
import { addUpdatePhysicsSystem } from "../../systems/configSystems/updatePhysicsSystem"
import { jointSet } from "../../collections/jointSet"
import MeshAppendable from "../../api/core/MeshAppendable"

const getRelativeTransform = (
    thisObject: Object3D,
    fromObject: Object3D,
    setPxTransform: typeof setPxTransform_
) => {
    const fromScale = fromObject.scale
    const clone = new Object3D()
    clone.position.copy(thisObject.position)
    clone.quaternion.copy(thisObject.quaternion)
    fromObject.attach(clone)
    const fromPxTransform = setPxTransform(
        clone.position.x * fromScale.x,
        clone.position.y * fromScale.y,
        clone.position.z * fromScale.z,
        clone.quaternion.x,
        clone.quaternion.y,
        clone.quaternion.z,
        clone.quaternion.w
    )
    fromObject.remove(clone)
    return fromPxTransform
}

export default abstract class JointBase
    extends MeshAppendable
    implements IJointBase
{
    public fromManager?: PhysicsObjectManager
    public toManager?: PhysicsObjectManager

    protected abstract createJoint(
        fromPxTransfrom: any,
        toPxTransform: any,
        fromManager: PhysicsObjectManager,
        toManager: PhysicsObjectManager
    ): any

    public pxJoint: any

    protected override disposeNode() {
        super.disposeNode()
        jointSet.delete(this)
    }

    public constructor() {
        super()
        jointSet.add(this)

        this.createEffect(() => {
            if (!getWorldPlayComputed() || !getEditorBehavior()) return
            flushMultipleSelectionTargets(() => this.savePos())
            return () => {
                flushMultipleSelectionTargets(() => this.restorePos())
            }
        }, [getWorldPlayComputed, getEditorBehavior])

        this.createEffect(() => {
            if (!getEditorHelper()) return

            const helper = new HelperSphere(this)
            helper.scale = 0.1
            helper.depthTest = false

            helper.events.on(
                "transformControls",
                ({ phase, mode }: TransformControlsPayload) =>
                    mode === "translate" &&
                    phase === "end" &&
                    this.setManualPosition()
            )
            return () => {
                helper.dispose()
            }
        }, [getEditorHelper])

        this.createEffect(() => {
            const { _to, _from } = this
            const { destroy } = physxPtr[0]
            if (!destroy || !_to || !_from) return

            const [toManager] = getAppendables(_to)
            const [fromManager] = getAppendables(_from)
            if (
                !(toManager instanceof PhysicsObjectManager) ||
                !(fromManager instanceof PhysicsObjectManager)
            )
                return

            !this.manualPosition &&
                Object.assign(this, centroid3d([fromManager, toManager]))

            fromManager.jointCount++
            toManager.jointCount++

            const handle0 = fromManager.events.on("physics", () =>
                this.refreshState.set({})
            )
            const handle1 = toManager.events.on("physics", () =>
                this.refreshState.set({})
            )
            const handle2 = fromManager.events.on(
                "transformControls",
                ({ phase }: TransformControlsPayload) =>
                    phase === "end" && this.refreshState.set({})
            )
            const handle3 = toManager.events.on(
                "transformControls",
                ({ phase }: TransformControlsPayload) =>
                    phase === "end" && this.refreshState.set({})
            )
            const joint = (this.pxJoint = this.createJoint(
                getRelativeTransform(
                    this.outerObject3d,
                    fromManager.outerObject3d,
                    setPxTransform_
                ),
                getRelativeTransform(
                    this.outerObject3d,
                    toManager.outerObject3d,
                    setPxTransform__
                ),
                fromManager,
                toManager
            ))

            this.fromManager = fromManager
            this.toManager = toManager

            return () => {
                handle0.cancel()
                handle1.cancel()
                handle2.cancel()
                handle3.cancel()
                this.pxJoint = undefined
                destroy(joint)
                fromManager.jointCount--
                toManager.jointCount--
                this.fromManager = undefined
                this.toManager = undefined
            }
        }, [this.refreshState.get, getPhysXLoaded])
    }

    private fromPos: Vector3 | undefined
    private toPos: Vector3 | undefined
    private fromQuat: Quaternion | undefined
    private toQuat: Quaternion | undefined

    private savePos() {
        const { fromManager, toManager } = this
        if (!fromManager || !toManager) return

        this.fromPos = fromManager.position.clone()
        this.toPos = toManager.position.clone()
        this.fromQuat = fromManager.quaternion.clone()
        this.toQuat = toManager.quaternion.clone()
    }
    private restorePos() {
        const { fromManager, toManager } = this
        if (!fromManager || !toManager) return

        this.fromPos && fromManager.position.copy(this.fromPos)
        this.toPos && toManager.position.copy(this.toPos)
        this.fromQuat && fromManager.quaternion.copy(this.fromQuat)
        this.toQuat && toManager.quaternion.copy(this.toQuat)

        this.refreshState.set({})
        addUpdatePhysicsSystem(fromManager)
        addUpdatePhysicsSystem(toManager)
    }

    protected refreshState = new Reactive({})

    private _to?: string | PhysicsObjectManager
    public get to() {
        return this._to
    }
    public set to(val) {
        this._to = val
        this.refreshState.set({})
    }

    private _from?: string | PhysicsObjectManager
    public get from() {
        return this._from
    }
    public set from(val) {
        this._from = val
        this.refreshState.set({})
    }

    private manualPosition?: boolean
    private setManualPosition() {
        this.manualPosition = true
        this.refreshState.set({})
    }

    public override get x() {
        return super.x
    }
    public override set x(val) {
        super.x = val
        this.setManualPosition()
    }

    public override get y() {
        return super.y
    }
    public override set y(val) {
        super.y = val
        this.setManualPosition()
    }

    public override get z() {
        return super.z
    }
    public override set z(val) {
        super.z = val
        this.setManualPosition()
    }
}
