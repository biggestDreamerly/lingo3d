import Appendable from "../api/core/Appendable"
import MeshAppendable from "../api/core/MeshAppendable"

export const nonSerializedAppendables = new WeakSet<
    Appendable | MeshAppendable
>()
