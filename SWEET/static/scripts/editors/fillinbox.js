export class FillInBoxEditor extends HTMLElement {
    static get contentType() { return "fillin"; }
    static get tagName() { return "fillin-editor"; }
    static get description() { return "Fill In Box"; }

    constructor() {
        super();
        this.$ = {};
        const root = this.$.root = this.attachShadow({mode: "open"});
        root.innerHTML = `
        <label>Box Size:</label><select name="size"><option>small</option><option>large</option></select><br>
        <label part="label" title="Must be unique within the page. Must contain only lower-case letters and hyphens">Fill-in Name</label><input type="text" name="name">
        `

        root.querySelector("input[name='name']").addEventListener("change", e => {
            if (e.currentTarget.value.replace(/[a-z-]*/, "").length > 0) {
                window.alert("Fill in box name must only contain lower-case letters and hyphens ('-')!")
                e.preventDefault();
                e.currentTarget.focus();
            }
        })
    }

    get isContainer() { return true }

    load(content) {
        this.$.root.querySelector("select").value = content.boxsize;
        this.$.root.querySelector("input[name='name']").value = content.name;
    }

    get jsonvalue() {
        return {
            type: this.constructor.contentType,
            boxsize: this.$.root.querySelector("select").value,
            name: this.$.root.querySelector("input[name='name']").value
        }
    }
}


export function fillInBoxRenderer(section) {
    let holder = document.createElement("section");
    holder.classList.add("fill-in", section.boxsize);
    let form = holder.appendChild(document.createElement("form"));
    form.innerHTML = section.boxsize == "small"? 
            `<input type="text" name="response" data-fillin-name="${section.name}" class="form-control shadow-hover"><input type="submit" value="Save" class="btn btn-primary">`:
            section.boxsize == "large"?
                `<textarea name="response" data-fillin-name="${section.name}" rows="5" cols="40" class="form-control shadow-hover"></textarea><input type="submit" value="Save" class="btn btn-primary">`:
                console.log("Unknown boxsize:", section.boxsize);

    form.addEventListener("submit", e => {
        e.preventDefault();

        let fillin = { path: this.path, name: section.name, response: form.elements['response'].value }
        this.post("/myapp/fillins/", fillin)
    })

    fetch(`/myapp/fillins?path=${encodeURIComponent(this.path)}&name=${section.name}`)
    .then(response => response.json())
    .then(details => {
        form.querySelector("[name='response']").value = details.response;
    })

    return holder;
}