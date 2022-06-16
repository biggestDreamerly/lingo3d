import IEventLoop, { eventLoopDefaults, eventLoopRequiredDefaults, eventLoopSchema } from "./IEventLoop"
import { ExtractProps } from "./utils/extractProps"
import Nullable from "./utils/Nullable"

export default interface ISkybox extends IEventLoop {
    texture: Nullable<string | Array<string>>
}

export const skyboxSchema: Required<ExtractProps<ISkybox>> = {
    ...eventLoopSchema,
    texture: [String, Array]
}

export const skyboxDefaults: ISkybox = {
    ...eventLoopDefaults,
    texture: undefined
}

export const skyboxRequiredDefaults: ISkybox = {
    ...eventLoopRequiredDefaults,
    texture: ""
}