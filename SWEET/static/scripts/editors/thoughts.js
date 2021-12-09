export class ThoughtsBox extends HTMLElement {
    static get contentType() { return "thoughts"; }
    static get tagName() { return "thoughts-box"; }
    static get description() { return "Thoughts Box"; }

    constructor() {
        super();
        this.$ = {};
        const root = this.$.root = this.attachShadow({mode: "open"});
        root.innerHTML = `
        <h3>Thoughts Setter: no additional content required</h3>
        `
    }

    get isContainer() { return true }

    load(content) {
        return;
    }

    get jsonvalue() {
        return {
            type: this.constructor.contentType
        }
    }
}
