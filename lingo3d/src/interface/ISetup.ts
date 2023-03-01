import setupStruct from "../engine/setupStruct"
import { shadowDistanceChoices } from "./IDirectionalLight"
import { environmentChoices } from "./IEnvironment"
import { shadowResolutionChoices } from "./ILightBase"
import Choices from "./utils/Choices"
import { extendDefaults } from "./utils/Defaults"
import { ExtractProps } from "./utils/extractProps"
import { hideSchema } from "./utils/nonEditorSchemaSet"
import Range from "./utils/Range"

type Type = typeof setupStruct

export default interface ISetup extends Type {}

export const setupSchema: Required<ExtractProps<ISetup>> = {
    defaultLight: Boolean,
    environment: String,
    skybox: [String, Array],
    gridHelper: Boolean,
    gridHelperSize: Number,
    stats: Boolean,
    antiAlias: [Boolean, String],
    logarithmicDepth: Boolean,
    pixelRatio: Number,
    fps: Number,
    exposure: Number,
    shadowResolution: String,
    shadowDistance: String,
    bloom: Boolean,
    bloomIntensity: Number,
    bloomThreshold: Number,
    bloomRadius: Number,
    ssr: Boolean,
    ssrIntensity: Number,
    ssao: Boolean,
    ssaoIntensity: Number,
    outlineColor: String,
    outlineHiddenColor: String,
    outlinePattern: String,
    outlinePulse: Number,
    outlineStrength: Number,
    bokeh: Boolean,
    bokehScale: Number,
    vignette: Boolean,
    texture: String,
    color: String
}
hideSchema(["antiAlias", "pixelRatio", "ssaoIntensity"])

export const setupDefaults = extendDefaults<ISetup>(
    [],
    { ...setupStruct },
    {
        environment: environmentChoices,
        pixelRatio: new Range(1, 2, 1),
        fps: new Range(30, 60, 30),
        exposure: new Range(0, 2),
        shadowResolution: shadowResolutionChoices,
        shadowDistance: shadowDistanceChoices,
        bokehScale: new Range(0, 20),
        bloomIntensity: new Range(0, 10),
        bloomThreshold: new Range(0, 1),
        bloomRadius: new Range(0, 1),
        ssrIntensity: new Range(0, 2),
        ssaoIntensity: new Range(0, 4),
        outlinePulse: new Range(0, 2),
        outlineStrength: new Range(0, 4),
        antiAlias: new Choices({ MSAA: "MSAA", SMAA: "SMAA", false: false }),
        gridHelperSize: new Range(10, 1000, 10)
    }
)
