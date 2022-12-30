import Cube from "../display/primitives/Cube"
import "../display/core/PhysicsObjectManager/physx"

const ground = new Cube()
ground.width = 1000
ground.height = 10
ground.depth = 1000
ground.y = -300
ground.color = "black"
ground.physics = "map"

const headCube = new Cube()
headCube.scaleX = headCube.scaleY = headCube.scaleZ = 0.25
headCube.y = 40

const torsoCube = new Cube()
torsoCube.scaleX = 0.35
torsoCube.scaleY = 0.45
torsoCube.scaleZ = 0.2

const hipCube = new Cube()
hipCube.scaleX = 0.35
hipCube.scaleY = 0.1
hipCube.scaleZ = 0.2
hipCube.y = -30

// createEffect(() => {
//     const {
//         physics,
//         PxRigidBodyExt,
//         scene,
//         PxArticulationJointTypeEnum,
//         PxArticulationAxisEnum,
//         PxArticulationMotionEnum
//     } = getPhysX()
//     if (!physics) return

//     const articulation = physics.createArticulationReducedCoordinate()

//     const torsoLink = articulation.createLink(
//         null,
//         assignPxPose(torsoCube.outerObject3d)
//     )
//     const torsoShape = torsoCube.getPxShape(true, torsoLink)
//     PxRigidBodyExt.prototype.updateMassAndInertia(torsoLink, 3)
//     managerShapeLinkMap.set(torsoCube, [torsoShape, torsoLink])

//     const headLink = articulation.createLink(
//         torsoLink,
//         assignPxPose(headCube.outerObject3d)
//     )
//     const headShape = headCube.getPxShape(true, headLink)
//     PxRigidBodyExt.prototype.updateMassAndInertia(headLink, 1)
//     managerShapeLinkMap.set(headCube, [headShape, headLink])

//     const joint = headLink.getInboundJoint()
//     joint.setJointType(PxArticulationJointTypeEnum.eREVOLUTE())
//     joint.setMotion(
//         PxArticulationAxisEnum.eTWIST(),
//         PxArticulationMotionEnum.eFREE()
//     )
//     joint.setMotion(
//         PxArticulationAxisEnum.eSWING1(),
//         PxArticulationMotionEnum.eFREE()
//     )
//     joint.setMotion(
//         PxArticulationAxisEnum.eSWING2(),
//         PxArticulationMotionEnum.eFREE()
//     )
//     scene.addArticulation(articulation)
// }, [getPhysX])