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
        fields.insertAdjacentHTML("beforeend", "<label>Popup Title</label>");
        this.$.title = fields.appendChild(document.createElement("input"));
        this.$.title.setAttribute("type", "text");
        this.$.title.setAttribute("name", "title");
        fields.insertAdjacentHTML("beforeend", "<br />");

        fields.insertAdjacentHTML("beforeend", "<label>Link Text</label>");
        this.$.byline = fields.appendChild(document.createElement("input"));
        this.$.byline.setAttribute("type", "text");
        this.$.byline.setAttribute("name", "byline");
        fields.insertAdjacentHTML("beforeend", "<br />");

        fields.insertAdjacentHTML("beforeend", "<label>Content Type</label>");
        this.$.source = fields.appendChild(document.createElement("select"));
        this.$.source.setAttribute("name", "contenttype");
        this.$.source.innerHTML = "<option value='video'>Video</option><option value='html'>Website/Forum</option>"
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
            contenttype: this.$.source.value,
            link: this.$.link.value
        }
    }

    load(content) {
        if (content.type != this.constructor.contentType) return;

        this.$.title.value = content.title;
        this.$.byline.value = content.byline;
        this.$.contenttype.value = content.contenttype;
        this.$.link.value = content.link;
    }

    get isContainer() { return false; }
}

export function embedRenderer(section) {
    let overlay = this.createModal(true);
    overlay.size = "lg";

    overlay.title.textContent = section.title;

    overlay.footer.innerHTML = "<button type='button' class='btn btn-primary'>Close</button>";
    overlay.footer.querySelector("button").addEventListener("click", () => overlay.hide());

    let embed = document.createElement("iframe");
    embed.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    embed.setAttribute("allowfullscreen", "");

    embed.classList.add(section.contenttype);

    if (section.link.indexOf("autoplay=1") == -1) embed.src = section.link;

    overlay.body.appendChild(embed);

    let trigger = document.createElement("a");
    trigger.classList.add(`embed-${section.contenttype}`);
    trigger.textContent = section.byline;

    trigger.addEventListener("click", function(e) {
        e.preventDefault();
        if (!embed.src) overlay.addEventListener("shown.bs.modal", () => embed.src = section.link)
        overlay.show();
    })

    return trigger;
}