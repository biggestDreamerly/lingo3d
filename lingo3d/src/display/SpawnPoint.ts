import { Reactive } from "@lincode/reactivity"
import { Object3D } from "three"
import Cylinder from "./primitives/Cylinder"
import mainCamera from "../engine/mainCamera"
import scene from "../engine/scene"
import {
    emitSelectionTarget,
    onSelectionTarget
} from "../events/onSelectionTarget"
import { appendableRoot } from "../api/core/Appendable"
import PositionedItem from "../api/core/PositionedItem"
import { getCameraRendered } from "../states/useCameraRendered"
import ISpawnPoint, {
    spawnPointDefaults,
    spawnPointSchema
} from "../interface/ISpawnPoint"
import { halfPi, vector3_0 } from "./utils/reusables"
import { getCentripetal } from "../states/useCentripetal"
import { onBeforeRender } from "../events/onBeforeRender"
import getWorldPosition from "./utils/getWorldPosition"

const dirObj = new Object3D()

export default class SpawnPoint extends PositionedItem implements ISpawnPoint {
    public static componentName = "spawnPoint"
    public static defaults = spawnPointDefaults
    public static schema = spawnPointSchema

    private helperState = new Reactive(true)
    public get helper() {
        return this.helperState.get()
    }
    public set helper(val) {
        this.helperState.set(val)
    }

    public constructor() {
        const outerObject3d = new Object3D()
        super(outerObject3d)
        scene.add(outerObject3d)

        this.createEffect(() => {
            if (!this.helperState.get() || getCameraRendered() !== mainCamera)
                return

            const h = new Cylinder()
            appendableRoot.delete(h)
            outerObject3d.add(h.outerObject3d)
            h.opacity = 0.5
            h.height = 10

            const handle = onSelectionTarget(
                ({ target }) => target === h && emitSelectionTarget(this)
            )

            return () => {
                h.dispose()
                handle.cancel()
            }
        }, [this.helperState.get, getCameraRendered])

        this.createEffect(() => {
            if (!getCentripetal()) return

            const handle = onBeforeRender(() => {
                const dir = getWorldPosition(this.outerObject3d).normalize()
                dirObj.lookAt(dir)
                dirObj.rotateX(halfPi)
                const quat = dirObj.quaternion
                this.outerObject3d.quaternion.copy(quat)
            })
            return () => {
                handle.cancel()
            }
        }, [getCentripetal])
    }
}