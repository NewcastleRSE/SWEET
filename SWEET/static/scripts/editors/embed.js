export class EmbedEditor extends HTMLElement {
    static get contentType() { return "external"; }
    static get tagName() { return "embed-editor"; }
    static get description() { return "Embedded external content (e.g. videos, forums)"; }

    constructor() {
        super();
        this.$ = {}

        const root = this.$.root = this.attachShadow({mode: "open"});
        root.innerHTML = `
        <style>
            :host {
                display: block;
                margin-left: 1em;
                background-color: #ffe0e0;
            }

            label { display: inline-block; width: 7.5em; text-align: right; vertical-align: top; }
            label[title] { text-decoration: underline dotted; }

        </style>
        `;

        let header = root.appendChild(document.createElement("h4"));
        header.textContent = "Embedded External Content";

        let fields = root.appendChild(document.createElement("fieldset"));
        fields.insertAdjacentHTML("beforeend", "<label>Title</label>");
        this.$.title = fields.appendChild(document.createElement("input"));
        this.$.title.setAttribute("type", "text");
        this.$.title.setAttribute("name", "title");
        fields.insertAdjacentHTML("beforeend", "<br />");

        fields.insertAdjacentHTML("beforeend", "<label>Byline</label>");
        this.$.byline = fields.appendChild(document.createElement("input"));
        this.$.byline.setAttribute("type", "text");
        this.$.byline.setAttribute("name", "byline");
        fields.insertAdjacentHTML("beforeend", "<br />");

        fields.insertAdjacentHTML("beforeend", "<label>Source</label>");
        this.$.source = fields.appendChild(document.createElement("input"));
        this.$.source.setAttribute("type", "text");
        this.$.source.setAttribute("name", "source");
        fields.insertAdjacentHTML("beforeend", "<br />");

        fields.insertAdjacentHTML("beforeend", "<label>Link</label>");
        this.$.link = fields.appendChild(document.createElement("input"));
        this.$.link.setAttribute("type", "text");
        this.$.link.setAttribute("name", "link");
        fields.insertAdjacentHTML("beforeend", "<br />");
    }

    get jsonvalue() {
        return {
            type: "external",
            title: this.$.title.value,
            byline: this.$.byline.value,
            source: this.$.source.value,
            link: this.$.link.value
        }
    }

    load(content) {
        if (content.type != this.constructor.contentType) return;

        this.$.title.value = content.value;
        this.$.byline.value = content.byline;
        this.$.source.value = content.source;
        this.$.link.value = content.link;

    }

    get isContainer() { return false; }
}

export function embedRenderer(section) {
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

    let trigger = document.createElement("a");
    trigger.classList.add(section.source);
    trigger.textContent = section.byline;

    trigger.addEventListener("click", function(e) {
        e.preventDefault();
        document.querySelector("#app-main").appendChild(overlay);
    })

    return trigger;
}