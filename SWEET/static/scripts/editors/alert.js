export class AlertEditor extends HTMLElement {
    static get contentType() { return "alert"; }
    static get tagName() { return "alert-editor"; }
    static get description() { return "Alert: a standout block of important content"; }
    
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
        <content-editor></content-editor>
        `;
        this.constructor.editors.forEach(e => root.querySelector("content-editor").registerEditor(e));
    }

    get jsonvalue() {
        return {
            type: this.constructor.contentType,
            content: this.$.root.querySelector("content-editor").jsonvalue
        }
    }

    load(content) {
        if (content.type != this.constructor.contentType) return;

        this.$.root.querySelector("content-editor").load(content.content);
        
    }

    get isContainer() { return true; }
}