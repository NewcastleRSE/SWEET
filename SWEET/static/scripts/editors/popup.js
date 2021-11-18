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

        fields.insertAdjacentHTML("beforeend", "<label>Popup Name</label>");
        this.$.name = fields.appendChild(document.createElement("input"));
        this.$.name.setAttribute("type", "text");
        this.$.name.setAttribute("name", "name");
        this.$.name.setAttribute("pattern", "[a-z-]+");
        fields.insertAdjacentHTML("beforeend", "<br />");

        fields.insertAdjacentHTML("beforeend", "<label>Popup Size</label>");
        this.$.size = fields.appendChild(document.createElement("select"));
        this.$.size.setAttribute("name", "size");
        this.$.size.innerHTML = `
            <option value="sm">Small</option">
            <option value="">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">Extra Large</option>
            <option value="fs">Full Screen</value>
        `
        fields.insertAdjacentHTML("beforeend", "<br />");

        fields.insertAdjacentHTML("beforeend", "<label>Content:</label>");
        this.$.content = fields.appendChild(document.createElement("content-editor"));
        this.constructor.editors.forEach(e => this.$.content.registerEditor(e));
        fields.insertAdjacentHTML("beforeend", "<br />");
    }

    get jsonvalue() {
        return {
            type: this.constructor.contentType,
            name: this.$.name.value,
            title: this.$.title.value,
            size: this.$.size.value,
            content: this.$.content.jsonvalue
        }
    }

    load(content) {
        if (content.type != this.constructor.contentType) return;

        this.$.name.value = content.name;
        this.$.title.value = content.value;
        this.$.size.value = content.size;
        this.$.content.load(content.content);
    }

    get isContainer() { return true; }

}

export function popupRenderer(section) {

    let modal = this.createModal();
    modal.size = section.size;
    modal.id = `popup-${section.name}`

    modal.title.textContent = section.title;
    section.content.forEach(s => this.render(s).then(node => modal.body.appendChild(node)));
    modal.footer.innerHTML = "<button type='button' class='btn btn-primary'>Close</button>";
    modal.footer.querySelector("button").addEventListener("click", () => modal.hide());

    return modal.__node;
}

export class PopupTriggerEditor extends HTMLElement {
    static get contentType() { return "popup-trigger"; }
    static get tagName() { return "popup-trigger-editor"; }
    static get description() { return "Pop-up Trigger - A stand-alone link to open a pop-up"; }

    constructor() {
        super();
        this.$ = {}

        const root = this.$.root = this.attachShadow({mode: "open"});
        root.innerHTML = `
        <style>
            :host {
                display: block;
                margin-left: 1em;
                background-color: #ebe0ff;
            }
            label { display: inline-block; width: 7.5em; text-align: right; vertical-align: top; }
            label[title] { text-decoration: underline dotted; }

            textarea, input { width: 50%; }
            textarea { height: 5em; }
        </style>
        <fieldset>
            <label>Trigger Text:</label><input type="text" name="linktext" required><br />
            <label>Popup Name:</label><input type="text" name="name" pattern="[a-z-]+" required><br />
        </fieldset>
        `;

        this.$.linktext = root.querySelector("[name='linktext']");
        this.$.name = root.querySelector("[name='name']")
    }

    get jsonvalue() {
        return {
            type: this.constructor.contentType,
            linktext: this.$.linktext,
            name: this.$.name.value
        }
    }

    load(content) {
        if (content.type != this.constructor.contentType) return;

        this.$.linktext.value = content.linktext;
        this.$.name.value = content.name;
    }

    get isContainer() { return false; }
}


export function popupTriggerRenderer(section) {
    let trigger = document.createElement("a");
    trigger.classList.add("popup-trigger");
    trigger.textContent = section.linktext;

    trigger.addEventListener("click", function(e) {
        e.preventDefault(); e.stopPropagation();
        bootstrap.Modal.getInstance(document.querySelector(`#popup-${section.name}`)).show()
    })

    return trigger;
}