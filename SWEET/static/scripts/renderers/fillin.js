export async function fillInBoxRenderer(section) {
    if (section.type != "fillin") return null;
    
    section.path = section.path || this.path;

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

        let fillin = { path: section.path, name: section.name, response: form.elements['response'].value }
        this.post("/myapp/fillins/", fillin)
    })

    await fetch(`/myapp/fillins?path=${encodeURIComponent(section.path)}&name=${section.name}`)
    .then(response => response.json())
    .then(details => {
        form.querySelector("[name='response']").value = details.response;
    })

    return holder;
}
