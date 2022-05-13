export class BlockquoteEditor extends HTMLElement {
    static get contentType() { return "block-quote"; }
    static get tagName() { return "blockquote-editor"; }
    static get description() { return "Stand out quote with citation"; }

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
            <label>Quote:</label><textarea name="text" required></textarea><br />
            <label>Citation:</label><input type="text" name="citation" required><br />
        </fieldset>
        `;

        this.$.text = root.querySelector("[name='text']");
        this.$.citation = root.querySelector("[name='citation']")
    }

    get jsonvalue() {
        return {
            type: "block-quote",
            text: this.$.text.value,
            citation: this.$.citation.value
        }
    }

    load(content) {
        if (content.type != this.constructor.contentType) return;

        this.$.text.value = content.text;
        this.$.citation.value = content.citation;
    }

    get isContainer() { return false; }
}
