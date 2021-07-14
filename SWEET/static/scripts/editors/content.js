export class ContentEditor extends HTMLElement {
    static get contentType() { return "content"; }
    static get tagName() { return "content-editor"; }
    static get description() { return "Generic holder for other editors"; }

    constructor() {
        super();
        this.$ = {}
        this.$.editors = []
        this.$.inserter = this.getAttribute("inserter") || "edit-inserter";

        const root = this.$.root = this.attachShadow({mode: 'open'});
        root.innerHTML = `
        <style>
            :host {
                display: block;
                margin-left: 1em;
                background-color: inherit;
                border: 2px dashed rgba(0,0,0,0.25);
            }

            .editor {
                position: relative;
                background-color: inherit;
            }

            .editor button {
                position: absolute;
                display: block;
                height: 2em;
                width: 2em;
                border: 0.2em solid silver;
                border-radius: 1em;
                background-color: inherit;
                background-size: 50%;
                background-position: center;
                background-repeat: no-repeat;
            }

            .editor button.move-up {
                top: -2em;
                right: 5em;
                border-radius: 1em 0 0 1em;
                border-right-width: 0;
                background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'><path stroke='currentColor' stroke-width='10%' fill='none' d='M0,1 L1,0 L2,1 M1,0 L1,3'></path></svg>");
            }

            .editor button.move-down {
                top: -2em;
                right: 3em;
                border-radius: 0 1em 1em 0;
                border-left-width: 0;
                background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'><path stroke='currentColor' stroke-width='10%' fill='none' d='M0,2 L1,3 L2,2 M1,0 L1,3'></path></svg>");
            }

            .editor button.delete {
                top: -2em;
                right: 0.5em;
                background-size: 75%;
                background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NDggNTEyIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik00MzIgMzJIMzEybC05LjQtMTguN0EyNCAyNCAwIDAgMCAyODEuMSAwSDE2Ni44YTIzLjcyIDIzLjcyIDAgMCAwLTIxLjQgMTMuM0wxMzYgMzJIMTZBMTYgMTYgMCAwIDAgMCA0OHYzMmExNiAxNiAwIDAgMCAxNiAxNmg0MTZhMTYgMTYgMCAwIDAgMTYtMTZWNDhhMTYgMTYgMCAwIDAtMTYtMTZ6TTUzLjIgNDY3YTQ4IDQ4IDAgMCAwIDQ3LjkgNDVoMjQ1LjhhNDggNDggMCAwIDAgNDcuOS00NUw0MTYgMTI4SDMyeiI+PC9wYXRoPjwvc3ZnPg==")
            }

            div.dropzone {
                height: 3em;
                width: 100%;
                border: 0.2em solid silver;
                border-radius: 0.25em;
                background-color: #ffecde;
            }

            .dropactive {
                border: 2px inset silver;
            }

            .uneditable {
                box-sizing: border-box;
                padding: 1em;
                width: 100%;
                background-color: rgba(0,0,0,0.5);
            }

            .uneditable :is(h1, h2, h3, h4, h5) {
                color: white;
            }
        </style>
        `

        root.appendChild(document.createElement(this.$.inserter));

        this.addEventListener("insert", e => {
            e.stopPropagation();
            
            const src = e.path.filter(e => e.tagName && e.tagName.toLowerCase() == this.$.inserter.toLowerCase())[0]
            if (src.value == "") return;

            const [holder, inserter] = this.createEditor(src.value);

            src.insertAdjacentElement('afterend', holder);
            holder.insertAdjacentElement('afterend', inserter);

            src.value = "";
        })
    }

    registerEditor(type) {
        if (!(type.contentType && type.tagName && type.description)) return; // static duck-typing for editors
        if (this.$.editors.filter(t => t.contentType == type.contentType).length > 0) return; // check for existing editor for this contentType

        this.$.editors.push(type);
        try {
            window.customElements.define(type.tagName, type);
        } catch (e) {
            // NotSupportedError means the element is already defined.
            if (!(e instanceof DOMException)) {
                console.error(e); return;
            }
        }

        this.shadowRoot.querySelectorAll(this.$.inserter).forEach(i =>
            { i.addContentType(type.description, type.tagName)});
    }

    registerEditors(...classes) {
        classes.forEach(c => this.registerEditor(c));
    }

    get jsonvalue() {
        let output = [];
        let contents = Array.from(this.$.root.querySelectorAll(".content"))
        
        while (contents.length) {
            let c = contents.shift();

            if (!c.jsonvalue) continue;

            if (c.isContainer) {
                output.push(c.jsonvalue);
            } else {
                let cnt = {
                    type: "container",
                    content: []
                }

                contents.unshift(c);

                while (contents.length && !contents[0].isContainer) {
                    cnt.content.push(contents.shift().jsonvalue);
                }

                output.push(cnt);
            }
        }
        
        return output;
    }

    clear() {
        console.log("clearing...");
        console.log(this.$.root.querySelectorAll("button.delete"))
        this.$.root.querySelectorAll("button.delete").forEach(bin => { bin.dispatchEvent(new MouseEvent("click", { bubbles: true })); })
    }

    load(content) {
        if (!Array.isArray(content)) {
            console.log(`Attempt to load non-array object ${content} to content-editor`);
            return;
        }

        const mdtypes = ["paragraph", "link", "list","header", "table"];
        const root = this.$.root;

        while (content.length > 0) {
            let c = content.shift();

            if (!c.type) {
                c = {
                    type: "paragraph", text: c
                }
            }

            if (c.type == "container") {
                // unpack plain containers (they will be automatically repacked later);
                // we can just add them to the start of the content array to be processed.
                content.unshift(...c.content);
            } else if (mdtypes.includes(c.type)) {
                // consecutive mdtypes should be merged into an appropriately set up markdown editor
                let md = document.createElement("markdown-editor");
                content.unshift(c);

                // to avoid complex global checks for whether we're currently constructing an md,
                // we're going to shift items out of the array until we find one that doesn't want merging
                while (content.length && (!content[0].type || mdtypes.includes(content[0].type))) {
                    c = content.shift();
                    switch (c.type) {
                        case "paragraph":
                            if (c.content) { content.unshift(...c.content); md.appendMarkdown(""); continue; }
                            if (c.formats) {
                                const formats = c.formats.split(c.separator);
                                const texts = c.text.split(c.separator);
                                if (formats.length != texts.length) { console.log(`formats "${c.formats}" has different split length to texts "${c.text}"`); continue; }
                                formats.forEach((f,i) => {
                                    let tag = f == "b"? "**": f == "i"? "*": "";
                                    texts[i] = `${tag}${texts[i]}${tag}`;
                                })
                                c.text = texts.join(" ");
                            }
                            md.appendMarkdown(c.text);
                            break;
                        case "link":
                            md.appendMarkdown(` [${c.text?c.text:c.link}](${c.link}) `, false);
                            break;
                        case "header":
                            md.appendMarkdown(`${"#".repeat(parseInt(c.level))} ${c.text}`);
                            break;
                        case "list":
                            let chunk = "";
                            c.items.forEach((t,i) => chunk = `${chunk}${c.subtype=="bullets"? "* ": (i+1) + ". "}${t}\n`);
                            md.appendMarkdown(chunk);
                            break;
                        case "table":
                            let heads = "";
                            let seps = "|";
                            let rows = "";

                            c.headers.forEach(h => { heads = `${heads}|`; h.forEach(l => heads = `${heads} ${l} |`); heads = `${heads}\n` })
                            seps = `${seps}${"----|".repeat(c.headers[0].length)}\n`
                            c.rows.forEach(r => { rows = `${rows}|`; r.forEach(i => rows = `${rows} ${i} |`); rows = `${rows}\n`});
                            md.appendMarkdown([heads,seps,rows].join(""))
                            break;
                        default:
                            md.appendMarkdown(c, false);
                            break;
                    }
                }

                root.append(...this.createEditor(md));
            } else  {
                let type = this.$.editors.filter(e => e.contentType == c.type)[0];
                
                if (!type) {
                    let u = document.createElement("div");
                    u.classList.add("content");
                    u.classList.add("uneditable");

                    u.innerHTML = `<h1>Predefined Content Block</h1>
                    <h3>Content-Type: ${ c.type }</h3>
                    <h5>This content cannot be edited or moved, but you can place other content around it</h5>`

                    Object.defineProperty(u, "jsonvalue", { get: function() { return c; }});

                    let i = document.createElement(this.$.inserter);
                    this.$.editors.forEach(t => i.addContentType(t.description, t.tagName));

                    root.append(u,i);
             
                } else {
                    let editor = document.createElement(type.tagName);
                    editor.load(c);

                    root.append(...this.createEditor(editor));
                }
            }

        }
    }

    get isContainer() { return true; }

    createEditor(editor) {

        if (!(editor instanceof HTMLElement)) {
            editor = document.createElement(editor);
        }

        let holder = document.createElement("fieldset");
        holder.classList.add("editor");


        holder.appendChild(document.createElement("legend")); 
        holder.querySelector("legend").textContent = editor.constructor.description;

        let moveup = holder.appendChild(document.createElement("button"));
        moveup.classList.add("move-up");

        let movedown = holder.appendChild(document.createElement("button"));
        movedown.classList.add("move-down");
        
        let bin = holder.appendChild(document.createElement("button"));
        bin.classList.add("delete");

        
        editor.classList.add("content")

        holder.appendChild(editor);

       let inserter = document.createElement(this.$.inserter);
       this.$.editors.forEach(t => inserter.addContentType(t.description, t.tagName));

        holder.addEventListener("click", e => { 
            e.preventDefault(); e.stopPropagation();

            if (e.target.classList.contains("delete")) {
                holder.remove(); inserter.remove(); 
            } else if (e.target.classList.contains("move-up")) {
                if (!holder.previousSibling.previousSibling.insertAdjacentElement) return;
                holder.previousSibling.previousSibling.insertAdjacentElement("beforebegin", inserter);
                inserter.insertAdjacentElement("beforebegin", holder);
                holder.scrollIntoView({block: "start", inline: "nearest", behavior: "smooth"});
            } else if (e.target.classList.contains("move-down")) {
                if (!holder.nextSibling.nextSibling) return;
                holder.nextSibling.nextSibling.insertAdjacentElement("afterend", inserter);
                inserter.insertAdjacentElement("afterend", holder);
                holder.scrollIntoView({block: "start", inline: "nearest", behavior: "smooth"});
            }
        });

        return [holder, inserter]
    }
}

export class EditorInserter extends HTMLElement {
    constructor() {
        super();
        const root = this.attachShadow({mode: 'open'});
        root.innerHTML = `
        <style> :host { display: block; padding: 0.5em; }</style>
        <select><option value="">... choose a content type ...</option></select><button>+</button>`
        root.querySelector("button").addEventListener("click", e => e.target.dispatchEvent(new Event("insert", { bubbles: true, composed: true})));
    }

    addContentType(displayname, tagname) {
        this.shadowRoot.querySelector("select").insertAdjacentHTML("beforeend", `
        <option value="${tagname}">${displayname}</option>
        `)
    }

    get value() { return this.shadowRoot.querySelector("select").value; }
    set value(value) { this.shadowRoot.querySelector("select").value = value; }
}