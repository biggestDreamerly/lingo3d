import {
    pullEnvironmentStack,
    pushEnvironmentStack,
    refreshEnvironmentStack
} from "../states/useEnvironmentStack"
import IEnvironment, {
    environmentDefaults,
    EnvironmentPreset,
    environmentSchema
} from "../interface/IEnvironment"
import PositionedManager from "./core/PositionedManager"
import { getCameraRendered } from "../states/useCameraRendered"
import mainCamera from "../engine/mainCamera"
import { Reactive } from "@lincode/reactivity"
import { addSelectionHelper } from "./core/StaticObjectManager/raycast/selectionCandidates"
import HelperSprite from "./core/utils/HelperSprite"

export default class Environment
    extends PositionedManager
    implements IEnvironment
{
    public static componentName = "environment"
    public static defaults = environmentDefaults
    public static schema = environmentSchema

    public constructor() {
        super()
        pushEnvironmentStack(this)

        this.createEffect(() => {
            if (getCameraRendered() !== mainCamera || !this.helperState.get())
                return

            const handle = addSelectionHelper(new HelperSprite("light"), this)
            return () => {
                handle.cancel()
            }
        }, [getCameraRendered, this.helperState.get])
    }

    protected override _dispose() {
        super._dispose()
        pullEnvironmentStack(this)
    }

    private _texture?: string | EnvironmentPreset = "studio"
    public get texture() {
        return this._texture
    }
    public set texture(value) {
        this._texture = value
        refreshEnvironmentStack()
    }

    private helperState = new Reactive(true)
    public get helper() {
        return this.helperState.get()
    }
    public set helper(val) {
        this.helperState.set(val)
    }
}
