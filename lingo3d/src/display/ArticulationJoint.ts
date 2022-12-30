import { Cancellable } from "@lincode/promiselikes"
import { Reactive } from "@lincode/reactivity"
import { debounceTrailing, forceGet } from "@lincode/utils"
import threeScene from "../engine/scene"
import { getPhysX } from "../states/usePhysX"
import MeshManager from "./core/MeshManager"
import PhysicsObjectManager from "./core/PhysicsObjectManager"
import destroy from "./core/PhysicsObjectManager/physx/destroy"
import {
    managerShapeLinkMap,
    actorPtrManagerMap
} from "./core/PhysicsObjectManager/physx/pxMaps"
import {
    assignPxPose,
    setPxPose
} from "./core/PhysicsObjectManager/physx/updatePxVec"
import PositionedManager from "./core/PositionedManager"
import { getMeshManagerSets } from "./core/StaticObjectManager"
import { vector3 } from "./utils/reusables"

const childParentMap = new WeakMap<MeshManager, MeshManager>()
const parentChildrenMap = new WeakMap<MeshManager, Set<MeshManager>>()
const allManagers = new Set<MeshManager>()

const create = (rootManager: PhysicsObjectManager) => {
    const {
        physics,
        scene,
        PxRigidBodyExt,
        PxArticulationJointTypeEnum,
        PxArticulationAxisEnum,
        PxArticulationMotionEnum
    } = getPhysX()

    const ogParent = rootManager.outerObject3d.parent
    ogParent !== threeScene && threeScene.attach(rootManager.outerObject3d)

    const articulation = physics.createArticulationReducedCoordinate()

    const rootLink = articulation.createLink(
        null,
        assignPxPose(rootManager.outerObject3d)
    )
    const rootShape = rootManager.getPxShape(true, rootLink)
    PxRigidBodyExt.prototype.updateMassAndInertia(rootLink, rootManager.mass)
    managerShapeLinkMap.set(rootManager, [rootShape, rootLink])
    actorPtrManagerMap.set(rootLink.ptr, rootManager)

    const handle = new Cancellable()
    const traverse = (parentManager: PhysicsObjectManager, parentLink: any) => {
        for (const childManager of parentChildrenMap.get(parentManager) ?? []) {
            if (!(childManager instanceof PhysicsObjectManager)) continue

            const ogChildParent = childManager.outerObject3d.parent
            ogChildParent !== threeScene &&
                threeScene.attach(childManager.outerObject3d)

            const childLink = articulation.createLink(
                parentLink,
                assignPxPose(childManager.outerObject3d)
            )
            const childShape = childManager.getPxShape(true, childLink)
            PxRigidBodyExt.prototype.updateMassAndInertia(
                childLink,
                childManager.mass
            )
            managerShapeLinkMap.set(childManager, [childShape, childLink])
            actorPtrManagerMap.set(childLink.ptr, childManager)

            const joint = childLink.getInboundJoint()

            const { x, y, z } = vector3
                .copy(childManager.outerObject3d.position)
                .sub(parentManager.outerObject3d.position)
            joint.setParentPose(setPxPose(x, y, z))
            joint.setChildPose(setPxPose(0, 0, 0))

            joint.setJointType(PxArticulationJointTypeEnum.eSPHERICAL())
            joint.setMotion(
                PxArticulationAxisEnum.eTWIST(),
                PxArticulationMotionEnum.eFREE()
            )
            joint.setMotion(
                PxArticulationAxisEnum.eSWING1(),
                PxArticulationMotionEnum.eFREE()
            )
            joint.setMotion(
                PxArticulationAxisEnum.eSWING2(),
                PxArticulationMotionEnum.eFREE()
            )
            handle.then(() => {
                destroy(joint)
                destroy(childLink)
                destroy(childShape)
                managerShapeLinkMap.delete(childManager)
                actorPtrManagerMap.delete(childLink.ptr)

                ogChildParent !== threeScene &&
                    ogChildParent?.attach(childManager.outerObject3d)
            })
            traverse(childManager, childLink)
        }
    }
    traverse(rootManager, rootLink)

    scene.addArticulation(articulation)

    handle.then(() => {
        destroy(rootLink)
        destroy(rootShape)
        managerShapeLinkMap.delete(rootManager)
        actorPtrManagerMap.delete(rootLink.ptr)

        scene.removeActor(articulation)
        destroy(articulation)

        ogParent !== threeScene && ogParent?.attach(rootManager.outerObject3d)
    })
    return handle
}

const createArticulations = debounceTrailing(() => {
    for (const manager of allManagers) {
        if (childParentMap.has(manager)) continue
        manager instanceof PhysicsObjectManager && create(manager)
    }
    allManagers.clear()
})

const makeSet = () => new Set<MeshManager>()

export default class ArticulationJoint extends PositionedManager {
    public constructor() {
        super()

        this.createEffect(() => {
            if (!getPhysX().physics) return

            const child = this.childState.get()
            const parent = this.parentState.get()
            if (!child || !parent) return

            const [[childManager]] = getMeshManagerSets(child)
            const [[parentManager]] = getMeshManagerSets(parent)
            if (!childManager || !parentManager) return

            childParentMap.set(childManager, parentManager)
            forceGet(parentChildrenMap, parentManager, makeSet).add(
                childManager
            )
            allManagers.add(childManager)
            allManagers.add(parentManager)
            createArticulations()
        }, [this.childState.get, this.parentState.get, getPhysX])
    }

    private childState = new Reactive<string | MeshManager | undefined>(
        undefined
    )
    public get jointChild() {
        return this.childState.get()
    }
    public set jointChild(val) {
        this.childState.set(val)
    }

    private parentState = new Reactive<string | MeshManager | undefined>(
        undefined
    )
    public get jointParent() {
        return this.parentState.get()
    }
    public set jointParent(val) {
        this.parentState.set(val)
    }
}
