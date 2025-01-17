import { PerspectiveCamera, Vector3, Quaternion } from "three"
import fpsAlpha from "../display/utils/fpsAlpha"
import getWorldPosition from "../utilsCached/getWorldPosition"
import getWorldQuaternion from "../utilsCached/getWorldQuaternion"
import interpolationCamera from "../engine/interpolationCamera"
import renderSystemWithData from "./utils/renderSystemWithData"

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const [addCameraInterpolationSystem, deleteCameraInterpolationSystem] =
    renderSystemWithData(
        (
            cameraTo: PerspectiveCamera,
            data: {
                positionFrom: Vector3
                quaternionFrom: Quaternion
                cameraFrom: PerspectiveCamera
                ratio: number
                diffMax: number
                onFinish: () => void
            }
        ) => {
            const { positionFrom, quaternionFrom, cameraFrom, ratio, diffMax } =
                data

            const positionTo = getWorldPosition(cameraTo)
            const quaternionTo = getWorldQuaternion(cameraTo)

            interpolationCamera.position.lerpVectors(
                positionFrom,
                positionTo,
                ratio
            )
            interpolationCamera.quaternion.slerpQuaternions(
                quaternionFrom,
                quaternionTo,
                ratio
            )

            interpolationCamera.zoom = lerp(
                cameraFrom.zoom,
                cameraTo.zoom,
                ratio
            )
            interpolationCamera.fov = lerp(cameraFrom.fov, cameraTo.fov, ratio)
            interpolationCamera.updateProjectionMatrix()

            data.ratio = Math.min((1 - ratio) * fpsAlpha(0.1), diffMax) + ratio
            data.ratio > 0.9999 && data.onFinish()
        }
    )
