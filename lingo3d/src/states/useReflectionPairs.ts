import store, { createEffect, pull, push } from "@lincode/reactivity"
import { CubeCamera } from "three"
import Loaded from "../display/core/Loaded"
import StaticObjectManager from "../display/core/StaticObjectManager"
import getWorldPosition from "../display/utils/getWorldPosition"
import scene from "../engine/scene"
import { emitAfterRenderSSR } from "../events/onAfterRenderSSR"
import { emitBeforeRenderSSR } from "../events/onBeforeRenderSSR"
import { onRenderSlow } from "../events/onRenderSlow"
import { getRenderer } from "./useRenderer"

const [setReflectionPairs, getReflectionPairs] = store<
    Array<[StaticObjectManager | Loaded, CubeCamera]>
>([])

export const pushReflectionPairs = push(setReflectionPairs, getReflectionPairs)
export const pullReflectionPairs = pull(setReflectionPairs, getReflectionPairs)

createEffect(() => {
    const renderer = getRenderer()
    const pairs = getReflectionPairs()
    if (!renderer || !pairs.length) return

    const handle = onRenderSlow(() => {
        emitBeforeRenderSSR()
        for (const [manager] of pairs) {
            manager.outerObject3d.visible = false
            if ("loadedGroup" in manager) manager.loadedGroup.visible = false
        }
        for (const [manager, cubeCamera] of pairs) {
            cubeCamera.position.copy(getWorldPosition(manager.outerObject3d))
            cubeCamera.update(renderer, scene)
        }
        for (const [manager] of pairs) {
            manager.outerObject3d.visible = true
            if ("loadedGroup" in manager) manager.loadedGroup.visible = true
        }
        emitAfterRenderSSR()
    })
    return () => {
        handle.cancel()
    }
}, [getRenderer, getReflectionPairs])