export class AccordionEditor extends HTMLElement {
    static get contentType() { return "accordion"; }
    static get tagName() { return "accordion-editor"; }
    static get description() { return "Accordion (content grouped under collapsing headers)"; }
    
    static editors = []

    constructor() {
        super();
        this.$ = {}
        const root = this.$.root = this.attachShadow({mode: 'open'});
        root.innerHTML=`
        <style>
            :host {
                display: block;
                margin-left: 1em;
                background-color: #fffbbe;
            }

            .item { position: relative; background-color: inherit; margin-top: 1em;}

            button { margin: 0.5em; }
            p { margin: 1em;}

            .item button {
                margin: 0;
                position: absolute;
                display: block;
                height: 2em;
                width: 2em;
                border: 0.2em solid silver;
                background-color: inherit;
                background-size: 50%;
                background-position: center;
                background-repeat: no-repeat;
            }

            .item button.move-up {
                top: -2em;
                right: 5em;
                border-right-width: 0;
                background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'><path stroke='currentColor' stroke-width='10%' fill='none' d='M0,1 L1,0 L2,1 M1,0 L1,3'></path></svg>");
            }

            .item button.move-down {
                top: -2em;
                right: 3em;
                border-left-width: 0;
                background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'><path stroke='currentColor' stroke-width='10%' fill='none' d='M0,2 L1,3 L2,2 M1,0 L1,3'></path></svg>");
            }

            .item button.delete {
                top: -2em;
                right: 1em;
                background-size: 75%;
                background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NDggNTEyIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik00MzIgMzJIMzEybC05LjQtMTguN0EyNCAyNCAwIDAgMCAyODEuMSAwSDE2Ni44YTIzLjcyIDIzLjcyIDAgMCAwLTIxLjQgMTMuM0wxMzYgMzJIMTZBMTYgMTYgMCAwIDAgMCA0OHYzMmExNiAxNiAwIDAgMCAxNiAxNmg0MTZhMTYgMTYgMCAwIDAgMTYtMTZWNDhhMTYgMTYgMCAwIDAtMTYtMTZ6TTUzLjIgNDY3YTQ4IDQ4IDAgMCAwIDQ3LjkgNDVoMjQ1LjhhNDggNDggMCAwIDAgNDcuOS00NUw0MTYgMTI4SDMyeiI+PC9wYXRoPjwvc3ZnPg==")
            }
            
        </style>
        `;

        this.$.itemtemplate = `
        <legend>Accordion Item</legend>
        <button class="move-up"></button><button class="move-down"></button><button class="delete"></button>
        <p><label>Title</label><input type="text" name="title" /><br>
        <label>Icon</label><input type="text" name="icon" /></p>
        <content-editor></content-editor>
        `
        const add = this.$.add = root.appendChild(document.createElement("button"));
        add.textContent = "Add item";
        add.addEventListener("click", e => {
            add.insertAdjacentElement('beforebegin', this._item)
        })
    }

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

    get _item() {
        let i = document.createElement("fieldset");
        i.classList.add("item");
        i.innerHTML = this.$.itemtemplate;
        this.constructor.editors.forEach(e => i.querySelector("content-editor").registerEditor(e));
        i.addEventListener("click", e => { 
            e.preventDefault(); e.stopPropagation();

            if (e.target.classList.contains("delete")) {
                i.remove();
            } else if (e.target.classList.contains("move-up")) {
                if (!i.previousSibling.insertAdjacentElement) return;
                i.previousSibling.insertAdjacentElement("beforebegin", i);
                i.scrollIntoView({block: "start", inline: "nearest", behavior: "smooth"});
            } else if (e.target.classList.contains("move-down")) {
                if (i.nextSibling.tagName == "BUTTON") return;
                i.nextSibling.insertAdjacentElement("afterend", i);
                i.scrollIntoView({block: "start", inline: "nearest", behavior: "smooth"});
            }
        });
        return i;
    }

    get jsonvalue() {
        let output = {
            type: this.constructor.contentType,
            content: []
        }

        this.$.root.querySelectorAll(".item").forEach(i => {
            output.content.push({
                type: "accordion-item",
                header: i.querySelector("input[name='title']").value,
                icon: i.querySelector("input[name='icon']").value,
                content: i.querySelector("content-editor").jsonvalue
            })
        })

        return output;

    }

    load(content) {
        if (content.type != this.constructor.contentType) return;
        content.content.forEach(i => {
            let item = this._item;
            item.querySelector("input[name='title']").value = i.header;
            item.querySelector("input[name='icon']").value = i.icon;
            item.querySelector("content-editor").load(i.content);
            this.$.add.insertAdjacentElement('beforebegin', item)
        })
    }

    get isContainer() { return true; }
}

export function accordionRenderer(section) {
    
    const randomID =  Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);

    const accordion = document.createElement("div");
    accordion.setAttribute("class","accordion mt-4 mb-5");
    accordion.setAttribute("id", "accordion-" + randomID)

    let index = 0;

    section.content.forEach(item => {
        switch (item.type) {
            default:
                throw `DataError: expected type "accordion-item", received type "${item.type}"`;
                break;
            case "accordion-item":
                const holder = document.createElement("div");
                holder.classList.add("accordion-item", "mb-2");

                const header = document.createElement("h2");
                header.setAttribute("id", "header-" + index);
                header.setAttribute("class", "accordion-header");

                const headerButton = document.createElement("button");
                headerButton.setAttribute("class", "accordion-button collapsed");
                headerButton.setAttribute("type", "button");
                headerButton.setAttribute("data-bs-toggle", "collapse");
                headerButton.setAttribute("data-bs-target", "#collapse-" + randomID + "-" + index);
                headerButton.setAttribute("aria-controls", "collapse-" + index);
                headerButton.innerText = item.header;

                header.appendChild(headerButton);

                const collapse = document.createElement("div");
                collapse.setAttribute("id", "collapse-" + randomID + "-" + index);
                collapse.setAttribute("class", "accordion-collapse collapse");
                collapse.setAttribute("aria-labelledby", "header-" + index);
                collapse.setAttribute("data-bs-parent", "#accordion-" + randomID);

                const body = document.createElement("div");
                body.setAttribute("class", "accordion-body");

                this.render({ type: "container", content: item.content}).then(node => body.appendChild(node));

                collapse.appendChild(body);
                holder.appendChild(header);
                holder.appendChild(collapse);
                accordion.appendChild(holder);

                break;
        }

        index++;
    })

    return accordion;

}