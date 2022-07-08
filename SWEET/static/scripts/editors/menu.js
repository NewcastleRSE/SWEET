export class MenuEditor extends HTMLElement {
    static get contentType() { return "menu"; }
    static get tagName() { return "menu-editor"; }
    static get description() { return "Menu (large button-style links)"; }

    constructor() {
        super();
        this.$ = {};
        const root = this.$.root = this.attachShadow({mode: "open"});

        root.innerHTML = `
        <style>
            :host {
                display: block;
                margin-left: 1em;
                background-color: #f3d2d2;
                padding: 1em 0;
            }

            label { display: inline-block; width: 7.5em; text-align: right; vertical-align: top; }
            label[title] { text-decoration: underline dotted; }
            input { width: 50%; }
            button { margin-top: 0.5em; }
            .item { position: relative; background-color: inherit; }

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
                top: 0;
                right: 4em;
                border-right-width: 0;
                background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'><path stroke='currentColor' stroke-width='10%' fill='none' d='M0,1 L1,0 L2,1 M1,0 L1,3'></path></svg>");
            }

            .item button.move-down {
                top: 0;
                right: 2em;
                border-left-width: 0;
                background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'><path stroke='currentColor' stroke-width='10%' fill='none' d='M0,2 L1,3 L2,2 M1,0 L1,3'></path></svg>");
            }

            .item button.delete {
                top: 0;
                right: 0;
                background-size: 75%;
                background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NDggNTEyIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik00MzIgMzJIMzEybC05LjQtMTguN0EyNCAyNCAwIDAgMCAyODEuMSAwSDE2Ni44YTIzLjcyIDIzLjcyIDAgMCAwLTIxLjQgMTMuM0wxMzYgMzJIMTZBMTYgMTYgMCAwIDAgMCA0OHYzMmExNiAxNiAwIDAgMCAxNiAxNmg0MTZhMTYgMTYgMCAwIDAgMTYtMTZWNDhhMTYgMTYgMCAwIDAtMTYtMTZ6TTUzLjIgNDY3YTQ4IDQ4IDAgMCAwIDQ3LjkgNDVoMjQ1LjhhNDggNDggMCAwIDAgNDcuOS00NUw0MTYgMTI4SDMyeiI+PC9wYXRoPjwvc3ZnPg==")
            }

        </style>
        <button class="add">Add Item</button><button class="subs">Add sub-pages</button>
        `
        this.$.add = root.querySelector("button.add");
        this.$.add.addEventListener("click", e => {
            e.stopPropagation();
            this._addItem();
        })

        root.querySelector("button.subs").addEventListener("click", e => {
            e.stopPropagation();
            this.dispatchEvent(new CustomEvent("menu:getsubs", { bubbles: true, composed: true, detail: { targetMenu: this }}))
        })
    }

    get isContainer() { return true }

    _addItem() {
        let i = document.createElement("fieldset");
        i.classList.add("item");
        i.innerHTML = `
        <button class="move-up"></button><button class="move-down"></button><button class="delete"></button>
        <label title="The text shown on the button">Display Text:</label><input name="title" type="text" required></input><br />
        <label>Link target:</label><input name="link" type="text" required></input><br />
        <label>Icon:</label><input name="icon" type="text" value="none"></input>`
        i.addEventListener("click", e => { 
            e.preventDefault(); e.stopPropagation();

            if (e.target.classList.contains("delete")) {
                i.remove();
            } else if (e.target.classList.contains("move-up")) {
                if (!i.previousSibling.insertAdjacentElement) return;
                i.previousSibling.insertAdjacentElement("beforebegin", i);
            } else if (e.target.classList.contains("move-down")) {
                if (i.nextSibling.tagName == "BUTTON") return;
                i.nextSibling.insertAdjacentElement("afterend", i);
            }
        });
        return this.$.add.insertAdjacentElement("beforebegin", i);
    }

    addItems(items) {
        if (!Array.isArray(items)) {
            console.log("non-array argument passed to addSubpages"); return;
        }

        items.forEach(i => {
            let item = this._addItem();
            item.querySelector("input[name='title']").value = i.title;
            item.querySelector("input[name='link']").value = i.link;
            item.querySelector("input[name='icon']").value = i.icon? i.icon: "none";
        })
    }

    load(content) {
        if (content.type != this.constructor.contentType) return;

        let items = content.items? content.items: content.content;
        this.addItems(items);
    }

    get jsonvalue() {
        let item = {
            type: this.constructor.contentType,
            content: []
        }

        this.$.root.querySelectorAll(".item").forEach(i => {
            item.content.push({
                type: "menu-item",
                title: i.querySelector("input[name='title']").value,
                link: i.querySelector("input[name='link']").value,
                icon: i.querySelector("input[name='icon']").value
            })
        })

        return item;
    }
}

