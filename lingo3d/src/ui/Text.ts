import Appendable from "../api/core/Appendable"
import { container } from "../engine/renderLoop/renderSetup"
import IText, { textDefaults, textSchema } from "../interface/IText"
import createElement from "../utils/createElement"

export default class Text extends Appendable implements IText {
    public static componentName = "text"
    public static defaults = textDefaults
    public static schema = textSchema

    private el = createElement<HTMLDivElement>(
        '<div style="opacity: 0.75"></div>'
    )

    public constructor() {
        super()

        container.appendChild(this.el)
        this.then(() => this.el.remove())
    }

    public get opacity() {
        return Number(this.el.style.opacity)
    }
    public set opacity(value) {
        this.el.style.opacity = value + ""
    }

    public get value() {
        return this.el.textContent ?? ""
    }
    public set value(value) {
        this.el.textContent = value
    }
}
