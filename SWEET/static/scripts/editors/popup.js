export class PopupEditor extends HTMLElement {
    static get contentType() { return "popup"; }
    static get tagName() { return "popup-editor"; }
    static get description() { return "Popup - general content shown in a large popup window"; }

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

        const root = this.$.root = this.attachShadow({mode: "open"});
        root.innerHTML = `
        <style>
            :host {
                display: block;
                margin-left: 1em;
                background-color: #f6f6f3;
            }

            label { display: inline-block; width: 7.5em; text-align: right; vertical-align: top; }
            label[title] { text-decoration: underline dotted; }

        </style>
        `;

        let header = root.appendChild(document.createElement("h4"));
        header.textContent = "Popup Content";

        let fields = root.appendChild(document.createElement("fieldset"));
        fields.insertAdjacentHTML("beforeend", "<label>Popup Title</label>");
        this.$.title = fields.appendChild(document.createElement("input"));
        this.$.title.setAttribute("type", "text");
        this.$.title.setAttribute("name", "title");
        fields.insertAdjacentHTML("beforeend", "<br />");

        fields.insertAdjacentHTML("beforeend", "<label>Link text</label>");
        this.$.byline = fields.appendChild(document.createElement("input"));
        this.$.byline.setAttribute("type", "text");
        this.$.byline.setAttribute("name", "byline");
        fields.insertAdjacentHTML("beforeend", "<br />");

        fields.insertAdjacentHTML("beforeend", "<label>Content:</label>");
        this.$.content = fields.appendChild(document.createElement("content-editor"));
        fields.insertAdjacentHTML("beforeend", "<br />");
    }

    get jsonvalue() {
        return {
            type: this.constructor.contentType,
            title: this.$.title.value,
            byline: this.$.byline.value,
            content: this.$.content.jsonvalue
        }
    }

    load(content) {
        if (content.type != this.constructor.contentType) return;

        this.$.title.value = content.value;
        this.$.byline.value = content.byline;
        this.$.content.load(content.content);
    }

    get isContainer() { return false; }

}

export function popupRenderer(section) {
    // let overlay = app.createPopup();


    /* amend this section to place content into popup */
    let overlay = document.createElement("section");
    overlay.classList.add("overlay");

    let warning = overlay.appendChild(document.createElement("header"));
    let close = warning.appendChild(document.createElement("button"));
    close.textContent = "return to app";
    close.classList.add("close-button");
    close.addEventListener("click", function(e) {
        overlay.remove();
    });

    let warnheading = warning.appendChild(document.createElement("h1"));
    warnheading.textContent = "You are currently viewing external content";
    warnheading.classList.add("warning");

    let holder = overlay.appendChild(document.createElement("article"));

    let heading = holder.appendChild(document.createElement("h2"));
    heading.textContent = section.title;

    let byline = holder.appendChild(document.createElement("p"));
    byline.textContent = section.byline;

    let embed = document.createElement("iframe");

    switch (section.source) {
        case "youtube":
            embed.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
            embed.setAttribute("allowfullscreen", "");
            break;

    }

    embed.src = section.link;
    holder.appendChild(embed);
    /* end content loading section */

    let trigger = document.createElement("a");
    trigger.classList.add(section.source);
    trigger.textContent = section.byline;

    trigger.addEventListener("click", function(e) {
        // this click handler should show the popup (maybe just add it to the document? or 'show' it if that's the preferred bs way to do it...)
        e.preventDefault();
        document.querySelector("#app-main").appendChild(overlay);
    })

    return trigger;
}