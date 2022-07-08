export class FillInBoxEditor extends HTMLElement {
    static get contentType() { return "fillin"; }
    static get tagName() { return "fillin-editor"; }
    static get description() { return "Fill In Box"; }

    constructor() {
        super();
        this.$ = {};
        const root = this.$.root = this.attachShadow({mode: "open"});
        root.innerHTML = `
        <label>Box Size:</label><select name="size"><option>small</option><option>large</option></select><br>
        <label part="label" title="Must be unique within the page. Must contain only lower-case letters and hyphens">Fill-in Name</label><input type="text" name="name">
        `

        root.querySelector("input[name='name']").addEventListener("change", e => {
            if (e.currentTarget.value.replace(/[a-z-]*/, "").length > 0) {
                window.alert("Fill in box name must only contain lower-case letters and hyphens ('-')!")
                e.preventDefault();
                e.currentTarget.focus();
            }
        })
    }

    get isContainer() { return true }

    load(content) {
        this.$.root.querySelector("select").value = content.boxsize;
        this.$.root.querySelector("input[name='name']").value = content.name;
    }

    get jsonvalue() {
        return {
            type: this.constructor.contentType,
            boxsize: this.$.root.querySelector("select").value,
            name: this.$.root.querySelector("input[name='name']").value
        }
    }
}
