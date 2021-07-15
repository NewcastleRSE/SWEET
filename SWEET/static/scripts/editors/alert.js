export class AlertEditor extends HTMLElement {
    static get contentType() { return "standout"; }
    static get tagName() { return "standout-editor"; }
    static get description() { return "Standout: a block of content with special formatting"; }
    
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
        const root = this.$.root = this.attachShadow({mode: 'open'});
        root.innerHTML=`
        <style>
            :host {
                display: block;
                margin-left: 1em;
                background-color: silver;
            }
        </style>
        <div><select name="class">
            <option value="important" selected>important</option>
            <option value="alert">very important</option>
        </select></div>
        <content-editor></content-editor>
        `;
        this.constructor.editors.forEach(e => root.querySelector("content-editor").registerEditor(e));
    }

    get jsonvalue() {
        return {
            type: this.constructor.contentType,
            class: this.$.root.querySelector("select").value,
            content: this.$.root.querySelector("content-editor").jsonvalue
        }
    }

    load(content) {
        if (content.type != this.constructor.contentType) return;

        this.$.root.querySelector("content-editor").load(content.content);
        
    }

    get isContainer() { return true; }
}

export function alertRenderer(section) {
    let holder = document.createElement("section");
    holder.classList.add(section.class);
    section.content.forEach(s => holder.appendChild(this.render(s)));
    return holder;
}