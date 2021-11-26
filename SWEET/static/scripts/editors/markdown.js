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

export function markdownRenderer(section) {
    let holder = document.createElement("section");
    holder.classList.add("markdown")
    if (section.encoding == "lz-string:UTF16") {
        holder.innerHTML = marked.parse(LZString.decompressFromUTF16(section.text));
    } else if (section.encoding == "lz-string:B64") {
        holder.innerHTML = marked.parse(LZString.decompressFromBase64(section.text));
    } else if (section.encoding == "raw") {
        holder.innerHTML = marked.parse(section.text);
    } else {
        holder.innerHTML = `<p class="error">Unknown markdown section encoding: ${section.encoding}</p>`;
    }
    
    holder.querySelectorAll("a[href^='http']").forEach(a => a.setAttribute("target", "_blank"));
    
    holder.querySelectorAll("a[href^='%']").forEach(a => {
        a.addEventListener("click", e => {
            e.preventDefault();
            let popup = a.getAttribute("href").substr(1);
            bootstrap.Modal.getInstance(document.querySelector(`#popup-${popup}`)).show();
        })
    });

    holder.querySelectorAll("img").forEach(img => {
        if (img.getAttribute("src").startsWith("http")) return; //ignore absolute image paths

        let [name, position] = img.getAttribute("src").split(":");

        fetch(`/app/resources/${name}`).then(response => response.json())
        .then(resource => {
            if (resource['content-type'] === undefined || resource['content-type'].startsWith("image")) {
                if (resource.source == "useblob") {
                    img.setAttribute("src", `/app/resources/files/${name}`);
                } else {
                    img.setAttribute("src", resource.source);
                }
                img.setAttribute("alt", resource.description);
                if (position) img.classList.add(...position.split(";"));
            } else if (resource['content-type'].startsWith("video")) {
                let src = resource.source == "useblob"? `/app/resources/files/${name}`: resource.source;
                img.insertAdjacentHTML("beforebegin", `<video controls src="${src}"${position? ` class="${position.replace(';',' ')}"`:""}><p>${resource.description}</p></video>`);
                img.remove();
                // maybe do some work with position.
                // maybe do some work with popups.
            }
        })
    })

    holder.querySelectorAll("code").forEach(code => {
        let [item, prop] = code.textContent.split(".");
        console.log(`"${item}"`)
        code.insertAdjacentHTML("beforebegin", this.store.get(item)[prop]);
        code.remove();
    })

    return holder;
}