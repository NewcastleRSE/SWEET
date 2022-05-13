export class MarkdownEditor extends HTMLElement {
    static get contentType() { return "markdown"; }
    static get tagName() { return "markdown-editor"; }
    static get description() { return "Formatted text block (using markdown)"; }

    constructor() {
        super();
        this.$ = {};
        const root = this.$.root = this.attachShadow({mode: "open"});

        // add layout css
        root.innerHTML = `
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.css">
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/latest/css/font-awesome.min.css">
            <style>
            .CodeMirror {
                height: 5em;
                width: inherit;
            }

            .cm-url, .cm-link {
                overflow-wrap: anywhere;
            }

            :host {
                    display: block;
                    margin-left: 1em;
                    background-color: #d2f3e0;
                }
            </style>`
            
        let text = this.$.text = root.appendChild(document.createElement("textarea"));
        
        this.$.mde = new SimpleMDE({
            element: text,
            toolbar: ["heading-1", "heading-2", "heading-3", "|", "bold", "italic", "|", "unordered-list", "ordered-list", "|", "image", "link", "|", "preview", "guide"],
            spellChecker: false,
            lineWrapping: true,
            insertTexts: { image: ["![](", ")"]}
        });
    }

    get markdown() {
        return this.$.mde.value();
    }

    set markdown(value) {
        this.$.mde.value(value);
    }

    get jsonvalue() {
        return {
            type: "markdown",
            encoding: "lz-string:B64",
            text: LZString.compressToBase64(this.markdown)
        }
    }

    load(content) {
        if (content.type != this.constructor.contentType) return;

        if (content.encoding == "lz-string:UTF16") { 
            this.markdown = LZString.decompressFromUTF16(content.text);
        } else if (content.encoding == "lz-string:B64") {
            this.markdown = LZString.decompressFromBase64(content.text);
        } else if (content.encoding == "raw") {
            this.markdown = content.text;
        } else {
            this.markdown = `Load failed for unknown content encoding 'content.encoding'`;
            console.log(content.encoding);
        }

    }

    appendMarkdown(newMD, para=true) {
        this.markdown += `${para && this.markdown?"\n\n":""}${newMD}`;
        this.$.mde.codemirror.focus();
    }

    get isContainer() { return true; }
}
