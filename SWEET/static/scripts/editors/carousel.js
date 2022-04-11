class CarouselSplashImageEditor extends HTMLElement {
    static get contentType() { return "splashimage"; }
    static get tagName() { return "splashimage-editor"; }
    static get description() { return "Splash Image (a slide continaing a single image (or other visual resource) filling the whole canvas)"; }

    constructor() {
        super();
        this.$ = {};
        const root = this.$.root = this.attachShadow({mode: "open"});
        root.innerHTML = `
        <label>Splash Image Resource</label><input type="text" name="resource">
        `
        this.$.resource = root.querySelector("input[name='resource']");
    }

    get jsonvalue() {
        return {
            type: this.constructor.contentType,
            resource: this.$.resource.value
        }
    }

    load(content) {
        this.$.resource.value = content.resource;
    }

    get isContainer() { return false; }
}

class CarouselTiledResoucesEditor extends HTMLElement {
    static get contentType() { return "tiledresources"; }
    static get tagName() { return "tiledresources-editor"; }
    static get description() { return "Tiled Resources (a slide contianing several images (or other visual resource) tiled across the canvas in a single row)"; }

    constructor() {
        super();
        this.$ = {};
        const root = this.$.root = this.attachShadow({mode: "open"});
        let rowtemplate = `<label>Resource name:</label><input type="text" name="resource"><br>`
        root.innerHTML = "<fieldset><legend>Resources:</legend><button class='add' type='button'>Add a resource</button></fieldset>";
        
        root.addEventListener("click", e => {
            if (e.target.matches("button.add, button.add *")) {
                root.querySelector("button.add").insertAdjacentHTML("beforebegin", rowtemplate);
            }
        })
    }

    get jsonvalue() {
        return {
            type: this.constructor.contentType,
            resources: Array.from(this.$.root.querySelectorAll("input[name='resource']")).map(i => i.value).filter(r => r)
        }
    }

    load(content) {
        content.resources.forEach(r => {
            this.$.root.querySelector("button.add").insertAdjacentHTML("beforebegin", `<label>Resource name:</label><input type="text" name="resource" value="${r}"><br>`)
        });
    }

    get isContainer() { return true; }
}

export class CarouselEditor extends HTMLElement {
    static get contentType() { return "carousel"; }
    static get tagName() { return "carousel-editor"; }
    static get description() { return "Carousel (a slide-show style display of content)"; }
    
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

        this.constructor.registerEditors(CarouselSplashImageEditor, CarouselTiledResoucesEditor)
        this.$ = {}
        const root = this.$.root = this.attachShadow({mode: 'open'});
        root.innerHTML=`
        <style>
            :host {
                display: block;
                margin-left: 1em;
                background-color: #ffffff;
            }

            .add { text-align: right; }

            .slide { position: relative; background-color: inherit; margin-top: 1em;}

            button { margin: 0.5em; }
            p { margin: 1em;}

            .slide button {
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

            .slide button.move-up {
                top: -2em;
                right: 5em;
                border-right-width: 0;
                background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'><path stroke='currentColor' stroke-width='10%' fill='none' d='M0,1 L1,0 L2,1 M1,0 L1,3'></path></svg>");
            }

            .slide button.move-down {
                top: -2em;
                right: 3em;
                border-left-width: 0;
                background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'><path stroke='currentColor' stroke-width='10%' fill='none' d='M0,2 L1,3 L2,2 M1,0 L1,3'></path></svg>");
            }

            .slide button.delete {
                top: -2em;
                right: 1em;
                background-size: 75%;
                background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NDggNTEyIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik00MzIgMzJIMzEybC05LjQtMTguN0EyNCAyNCAwIDAgMCAyODEuMSAwSDE2Ni44YTIzLjcyIDIzLjcyIDAgMCAwLTIxLjQgMTMuM0wxMzYgMzJIMTZBMTYgMTYgMCAwIDAgMCA0OHYzMmExNiAxNiAwIDAgMCAxNiAxNmg0MTZhMTYgMTYgMCAwIDAgMTYtMTZWNDhhMTYgMTYgMCAwIDAtMTYtMTZ6TTUzLjIgNDY3YTQ4IDQ4IDAgMCAwIDQ3LjkgNDVoMjQ1LjhhNDggNDggMCAwIDAgNDcuOS00NUw0MTYgMTI4SDMyeiI+PC9wYXRoPjwvc3ZnPg==")
            }
            
        </style>
        <div><label title="This must be unique within this page">Carousel name:</label><input type="text" name="name"><br>
        <label>Show prev/next controls? <input type="checkbox" name="controls" checked></label> <label>Show slide indicators? <input type="checkbox" name="indicators" checked></label><br>
        <label>Use dark theme? (check this box if your slides are generally light in colour) <input type="checkbox" name="dark"></label><br>
        <label>Run slideshow automatically? <input type="checkbox" name="autostart"></label></div>
        <div class="add"><select></select><button type="button">Add Slide</button></div>
        `;

        this.constructor.editors.forEach(e => {
            root.querySelector("select").add(new Option(e.description, e.tagName));
        })

        this.$.slidetemplate = `
        <legend>Carousel Slide</legend>
        <button class="move-up"></button><button class="move-down"></button><button class="delete"></button>
        <p><label>Title</label><input type="text" name="title" /><br>
        `
        const add = this.$.add = root.querySelector(".add");
        
        add.addEventListener("click", e => {
            if (e.target.matches("button, button *")) {
                let newslide = this._slide;
                let editor = newslide.appendChild(document.createElement(this.$.root.querySelector("select").value))
                editor.classList.add("slide-content");
        
                add.insertAdjacentElement('beforebegin', newslide)
            }
        })
    }

    get _slide() {
        let i = document.createElement("fieldset");
        i.classList.add("slide");
        i.innerHTML = this.$.slidetemplate;
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
            name: this.$.root.querySelector("input[name='name']").value,
            controls: this.$.root.querySelector("input[name='controls']").checked,
            indicators: this.$.root.querySelector("input[name='indicators']").checked,
            darkmode: this.$.root.querySelector("input[name='dark']").checked,
            autostart: this.$.root.querySelector("input[name='autostart']").checked,
            slides: []
        }

        this.$.root.querySelectorAll(".slide").forEach(i => {
            output.slides.push({
                type: "carousel-slide",
                header: i.querySelector("input[name='title']").value,
                content: i.querySelector(".slide-content").jsonvalue
            })
        })

        return output;
    }

    load(content) {
        if (content.type != this.constructor.contentType) return;
        this.$.root.querySelector("input[name='name']").value = content.name;
        this.$.root.querySelector("input[name='controls']").checked = content.controls;
        this.$.root.querySelector("input[name='indicators']").checked = content.indicators;
        this.$.root.querySelector("input[name='autostart']").checked = content.autostart;
        this.$.root.querySelector("input[name='dark']").checked = content.darkmode;

        content.slides.forEach(i => {
            if (i.type != "carousel-slide") {
                console.log(`Unexpected content type ${i.type} loading carousel slides`);
                return;
            }

            let type = this.constructor.editors.find(e => e.contentType == i.content.type);
            if (type) {
                let slide = this._slide;
                slide.querySelector("input[name='title']").value = i.header;
                let editor = slide.appendChild(document.createElement(type.tagName));
                editor.classList.add("slide-content");
                editor.load(i.content);
                this.$.add.insertAdjacentElement('beforebegin', slide)
            } else {
                console.log(`Content type ${i.content.type} has not been registered as a carousel slide content type.`)
            }
        })
    }

    get isContainer() { return true; }

}