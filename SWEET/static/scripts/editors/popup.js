export class PopupEditor extends HTMLElement {
    static get contentType() { return "popup"; }
    static get tagName() { return "popup-editor"; }
    static get description() { return "Popup - general content shown in a large popup window"; }

    static editors = []
    static registerEditor(type) {
        if (!(type.contentType && type.tagName && type.description)) return; // static duck-typing for editors
        if (this.editors.filter(t => t.contentType == type.contentType).length > 0) return; // check for existing editor for this contentType

        this.editors.push(type);
        try {
            window.customElements.define(type.tagName, type);
        } catch (e) {
            if (!(e instanceof DOMException && e.code == DOMException.NOT_SUPPORTED_ERR)) {
                console.error(e); return;
            }
        }
    }

    static registerEditors(...classes) {
        classes.forEach(c => this.registerEditor(c));
    }

    constructor() {
        super();
        this.$ = {}

        const root = this.$.root = this.attachShadow({mode: "open"});
        root.innerHTML = `
        <style>
            :host {
                display: block;
                margin-left: 1em;
                background-color: #f6f6f3;
            }

            label { display: inline-block; width: 7.5em; text-align: right; vertical-align: top; }
            label[title] { text-decoration: underline dotted; }

        </style>
        `;

        let header = root.appendChild(document.createElement("h4"));
        header.textContent = "Popup Content";

        let fields = root.appendChild(document.createElement("fieldset"));
        fields.insertAdjacentHTML("beforeend", "<label>Popup Title</label>");
        this.$.title = fields.appendChild(document.createElement("input"));
        this.$.title.setAttribute("type", "text");
        this.$.title.setAttribute("name", "title");
        fields.insertAdjacentHTML("beforeend", "<br />");

        fields.insertAdjacentHTML("beforeend", "<label>Link text</label>");
        this.$.byline = fields.appendChild(document.createElement("input"));
        this.$.byline.setAttribute("type", "text");
        this.$.byline.setAttribute("name", "byline");
        fields.insertAdjacentHTML("beforeend", "<br />");

        fields.insertAdjacentHTML("beforeend", "<label>Content:</label>");
        this.$.content = fields.appendChild(document.createElement("content-editor"));
        this.constructor.editors.forEach(e => this.$.content.registerEditor(e));
        fields.insertAdjacentHTML("beforeend", "<br />");
    }

    get jsonvalue() {
        return {
            type: this.constructor.contentType,
            title: this.$.title.value,
            byline: this.$.byline.value,
            content: this.$.content.jsonvalue
        }
    }

    load(content) {
        if (content.type != this.constructor.contentType) return;

        this.$.title.value = content.value;
        this.$.byline.value = content.byline;
        this.$.content.load(content.content);
    }

    get isContainer() { return false; }

}

export function popupRenderer(section) {

    let modal = this.createModal(true);
    modal.size = "fs";

    modal.title.textContent = section.title;
    section.content.forEach(s => this.render(s).then(node => modal.body.appendChild(node)));
    modal.footer.innerHTML = "<button type='button' class='btn btn-primary'>Close</button>";
    modal.footer.querySelector("button").addEventListener("click", () => modal.hide(true));
    
    let trigger = document.createElement("a");
    trigger.classList.add("popup-trigger");
    trigger.textContent = section.byline;

    trigger.addEventListener("click", function(e) {
        e.preventDefault(); e.stopPropagation();
        modal.show();
    })

    return trigger;
}