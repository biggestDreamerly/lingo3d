import { Cancellable } from "@lincode/promiselikes"
import { createNestedEffect } from "@lincode/reactivity"
import { Object3D } from "three"
import { mouseEvents } from "../../../../api/mouse"
import { onSceneGraphChange } from "../../../../events/onSceneGraphChange"
import { onSelectionRecompute } from "../../../../events/onSelectionRecompute"
import {
    emitSelectionTarget,
    onSelectionTarget
} from "../../../../events/onSelectionTarget"
import { getEditing } from "../../../../states/useEditing"
import { getEditorMode } from "../../../../states/useEditorMode"
import { resetMultipleSelectionTargets } from "../../../../states/useMultipleSelectionTargets"
import {
    getSelectionTarget,
    setSelectionTarget
} from "../../../../states/useSelectionTarget"
import { getTransformControlsDragging } from "../../../../states/useTransformControlsDragging"
import Curve from "../../../Curve"
import pickable from "./pickable"
import selectionCandidates, {
    getSelectionCandidates
} from "./selectionCandidates"

let pathObjects: Array<Object3D> = []

export default () => {
    createNestedEffect(() => {
        if (
            !getEditing() ||
            getTransformControlsDragging() ||
            getEditorMode() !== "path"
        )
            return

        getSelectionCandidates(pathObjects)
        const handle0 = onSceneGraphChange(() =>
            getSelectionCandidates(pathObjects)
        )
        const handle1 = onSelectionRecompute(() => {
            getSelectionCandidates(pathObjects)
            emitSelectionTarget()
        })

        const curve = new Curve()

        const handle2 = new Cancellable()
        import("../../../primitives/Sphere").then((module) => {
            const Sphere = module.default
            handle2.watch(
                mouseEvents.on("click", (e) => {
                    setTimeout(() => {
                        if (handle2.done || getSelectionTarget()) return

                        const target = new Sphere()
                        target.scale = 0.1
                        target.placeAt(e.point)
                        target.name = "point" + pathObjects.length
                        pathObjects.push(target.outerObject3d)
                        emitSelectionTarget(target)
                        curve.points = pathObjects.map(
                            (object) => object.position
                        )
                    })
                })
            )
        })
        const handle3 = mouseEvents.on("click", () => emitSelectionTarget())
        const handle4 = pickable("click", selectionCandidates, (target) =>
            emitSelectionTarget(target)
        )
        const handle5 = onSelectionTarget(({ target }) => {
            resetMultipleSelectionTargets()
            setSelectionTarget(target)
        })

        return () => {
            handle2.cancel()
            handle0.cancel()
            handle1.cancel()
            handle2.cancel()
            handle3.cancel()
            handle4.cancel()
            handle5.cancel()
            curve.dispose()

            if (getEditorMode() !== "path") {
                pathObjects = []
            }
        }
    }, [getEditing, getTransformControlsDragging, getEditorMode])
}