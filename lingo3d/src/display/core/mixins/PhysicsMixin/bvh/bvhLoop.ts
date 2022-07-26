import { createEffect } from "@lincode/reactivity"
import { forceGet } from "@lincode/utils"
import { Box3, Object3D, Vector3 } from "three"
import PhysicsMixin from ".."
import { onBeforeRender } from "../../../../../events/onBeforeRender"
import { getBVHMap } from "../../../../../states/useBVHMap"
import { getCentripetal } from "../../../../../states/useCentripetal"
import { getEditorActive } from "../../../../../states/useEditorActive"
import { getGravity } from "../../../../../states/useGravity"
import { getRepulsion } from "../../../../../states/useRepulsion"
import {
    box3,
    halfPi,
    line3,
    vector3,
    vector3_,
    vector3_0,
    vector3__
} from "../../../../utils/reusables"
import bvhContactMap from "./bvhContactMap"
import { bvhManagerMap } from "./computeBVH"
import getWorldPosition from "../../../../utils/getWorldPosition"
import { getLoadedObject } from "../../../Loaded"

export const bvhCharacterSet = new Set<PhysicsMixin>()

const makeWeakSet = () => new WeakSet()

const dirObj = new Object3D()

createEffect(
    function (this: PhysicsMixin) {
        if (getEditorActive()) return

        const bvhArray = getBVHMap()
        if (!bvhArray.length) return

        const gravity = getGravity()
        const repulsion = getRepulsion()
        const delta = 0.02

        const center = getCentripetal() ? vector3_0 : undefined

        const handle = onBeforeRender(() => {
            bvhContactMap.clear()

            for (const characterManager of bvhCharacterSet) {
                const playerVelocity = characterManager.bvhVelocity!
                const player = characterManager.outerObject3d
                const capsuleHalfHeight = characterManager.bvhHalfHeight!
                const capsuleRadius = characterManager.bvhRadius!

                const dir =
                    center && getWorldPosition(player).sub(center).normalize()

                dir && (characterManager.bvhDir = dir)

                if (dir)
                    playerVelocity.add(
                        characterManager.bvhOnGround ||
                            characterManager._gravity === false
                            ? vector3_0
                            : dir.clone().multiplyScalar(delta * -gravity)
                    )
                else
                    playerVelocity.y +=
                        characterManager.bvhOnGround ||
                        characterManager._gravity === false
                            ? 0
                            : delta * -gravity

                const { position } = characterManager.physicsUpdate!
                characterManager.physicsUpdate = {}

                if (position) {
                    position.x && (playerVelocity.x = 0)
                    position.y && (playerVelocity.y = 0)
                    position.z && (playerVelocity.z = 0)
                }

                player.position.addScaledVector(playerVelocity, delta)
                player.updateMatrixWorld()

                const { start, end } = line3
                end.copy(start.copy(player.position))

                const yOffset = Math.max(capsuleHalfHeight - capsuleRadius, 0)
                end.y += yOffset
                start.y -= yOffset

                const startOld = start.clone()

                box3.setFromCenterAndSize(
                    player.position,
                    vector3__.set(
                        capsuleRadius * 2,
                        capsuleHalfHeight * 2,
                        capsuleRadius * 2
                    )
                )
                const triPoint = vector3
                const capsulePoint = vector3_
                let distance = 0
                let direction: Vector3 | undefined

                let contact = false
                let mapManager: PhysicsMixin | undefined

                for (const boundsTree of bvhArray) {
                    mapManager = bvhManagerMap.get(boundsTree)

                    boundsTree.shapecast({
                        intersectsBounds: (box: Box3) =>
                            box.intersectsBox(box3),
                        intersectsTriangle: (tri: any) => {
                            distance = tri.closestPointToSegment(
                                line3,
                                triPoint,
                                capsulePoint
                            )
                            if (distance < capsuleRadius) {
                                contact = true
                                direction = capsulePoint
                                    .sub(triPoint)
                                    .normalize()
                                    .multiplyScalar(capsuleRadius - distance)
                                start.add(direction)
                                end.add(direction)
                            }
                        }
                    })
                }
                if (contact && mapManager)
                    forceGet(bvhContactMap, characterManager, makeWeakSet).add(
                        mapManager
                    )

                const deltaVector = start.sub(startOld)

                // if the player was primarily adjusted vertically we assume it's on something we should consider ground
                if (dir) {
                    dirObj.lookAt(dir)
                    dirObj.rotateX(halfPi)

                    getLoadedObject(characterManager).quaternion.copy(
                        dirObj.quaternion
                    )

                    const playerVelocityUpright = playerVelocity
                        .clone()
                        .applyEuler(dirObj.rotation)

                    const deltaVectorUpright = deltaVector
                        .clone()
                        .applyEuler(dirObj.rotation)

                    characterManager.bvhOnGround =
                        deltaVectorUpright.y >
                        Math.abs(delta * playerVelocityUpright.y * 0.25)

                    // if (repulsion && characterManager.bvhOnGround)
                    //     if (
                    //         Math.abs(
                    //             deltaVectorUpright.y /
                    //                 (deltaVectorUpright.x +
                    //                     deltaVectorUpright.z +
                    //                     Number.EPSILON)
                    //         ) < repulsion
                    //     )
                    //         characterManager.bvhOnGround = false
                } else {
                    characterManager.bvhOnGround =
                        deltaVector.y >
                        Math.abs(delta * playerVelocity.y * 0.25)

                    if (repulsion && characterManager.bvhOnGround)
                        if (
                            Math.abs(
                                deltaVector.y /
                                    (deltaVector.x +
                                        deltaVector.z +
                                        Number.EPSILON)
                            ) < repulsion
                        )
                            characterManager.bvhOnGround = false
                }

                const offset = Math.max(0.0, deltaVector.length() - 1e-5)
                deltaVector.normalize().multiplyScalar(offset)

                // adjust the player model
                player.position.add(deltaVector)

                if (!characterManager.bvhOnGround) {
                    deltaVector.normalize()
                    playerVelocity.addScaledVector(
                        deltaVector,
                        -deltaVector.dot(playerVelocity)
                    )
                } else playerVelocity.set(0, 0, 0)
            }
        })
        return () => {
            handle.cancel()
        }
    },
    [getBVHMap, getGravity, getRepulsion, getCentripetal, getEditorActive]
)
