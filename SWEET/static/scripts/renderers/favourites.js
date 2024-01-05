export function favouriteListRenderer(section) {
    if (section.type != "favourite-list") return null;

    let holder = document.createElement("section");
    holder.classList.add("favourite-list");
    section.favourites.forEach(favourite => this.render(favourite.type == "favourite" ? favourite : { type: "favourite", "favourite": favourite }).then(node => holder.appendChild(node)));

    return holder;
}

export function favouriteRenderer(section) {
    if (section.type != "favourite" || !("favourite" in section)) return null;

    let favourite = section.favourite;

    let holder = document.createElement("section");
    holder.classList.add("favourite");

    holder.innerHTML = `
        <div class="my-3">
            <button class="edit" style="float: left; "></button>
            <button class="delete" style="float: right; clear: right;"></button>
            <h5>Key Favourite: ${favourite.type}</h5>
            <div class="favourite-body">
                <strong>Name</strong>: <span class="favourite-name">${favourite.name}</span><br>
                <strong>Phone</strong>: <span class="favourite-phone">${favourite.phone}</span><br>
                <strong>Email</strong>: <span class="favourite-email">${favourite.email}</span>
            </div>
        </div>
        
    `
    holder.querySelector("button.edit").addEventListener("click", e => {
        let modal = this.createModal(true);
        modal.title.textContent = "Edit Favourite";
        modal.footer.innerHTML = "<button type='button' class='close btn btn-primary'>Cancel</button> <button type='submit' class='submit btn btn-primary'>Save Changes</button>"

        this.render({ type: "favourite-form", "favourite": favourite }).then(form => {
            form.$opener = holder;
            form.$modal = modal;

            modal.body.appendChild(form);

            modal.footer.querySelector("button.submit").setAttribute("form", form.getAttribute("id"));
            modal.footer.querySelector("button.close").addEventListener("click", e => modal.hide());

            modal.show();
        })
    })

    holder.querySelector("button.delete").addEventListener("click", e => {
        if (window.confirm(`Delete ${favourite.name} from your favourites?\n(this change cannot be undone)`)) {
            this.post("/myapp/myfavourites/delete/", favourite).then(response => response.json())
                .then(result => holder.remove())
        }
    })

    return holder;

}

export function favouriteFormRenderer(section) {
    if (section.type != "favourite-form") return null;
    let edit = ("favourite" in section);

    let form = document.createElement("form");
    form.setAttribute("id", edit ? section.favourite.name.toLowerCase().replaceAll(" ", "_") : "new-favourite")

    form.innerHTML = `
        <label for="favourite-type" class="p-2">Who is this person?</label><select id="favourite-person-type" name="type">
        <option disabled selected>Please select...</option>
        <option>Breast Cancer Nurse</option>
        <option>GP Practice</option>
        <option>Pharmacist</option>
        <option>Other</option></select><br>
        <label for="favourite-name" class="p-2 lbl-small">Name:</label> <input type="text" id="favourite-name" class="my-1" name="name"${edit ? ` value="${section.favourite.name}"` : ""} minlength="2" maxlength="25" required><br>
        <label for="favourite-phone" class="p-2 lbl-small">Phone:</label> <input type="tel" id="favourite-phone" class="my-1" name="phone"${edit ? ` value="${section.favourite.phone}"` : ""} minlength="6" maxlength="15"><br>
        <label for="favourite-email" class="p-2 lbl-small">Email:</label> <input type="email" oninput="this.value.length > this.size ? this.size = this.value.length : this.size = this.size" id="favourite-email" class="my-1"name="email"${edit ? ` value="${section.favourite.email}"` : ""} minlength="6" maxlength="50"><br>
    `

    if (edit) {
        form.querySelector("select").value = section.favourite.type;
        form.querySelector("select").setAttribute("disabled", "");
    }

    form.addEventListener("submit", e => {
        e.preventDefault();

        let favourite = {
            type: form.elements["type"].value,
            name: form.elements["name"].value,
            phone: form.elements["phone"].value,
            email: form.elements["email"].value
        }

        let poster = edit ?
            this.post("/myapp/myfavourites/update/", { newfavourite: favourite, oldfavourite: section.favourite }) :
            this.post("/myapp/myfavourites/add/", favourite);

        poster.then(() => {
            if (form.$opener) {
                form.$opener.querySelector(".favourite-name").textContent = favourite.name;
                form.$opener.querySelector(".favourite-phone").textContent = favourite.phone;
                form.$opener.querySelector(".favourite-email").textContent = favourite.email;
            }

            if (form.$list) {
                this.render({ type: "favourite", favourite: favourite }).then(node => form.$list.appendChild(node))
            }

            if (form.$modal) form.$modal.hide();
        })
    })

    return form;
}

export function favouritePageRenderer(section) {

    console.log(section)
    if (section.type != "favourites-page") return null;

    let holder = document.createElement("section");
    holder.classList.add("all-favourites")

    fetch("/myapp/favourites").then(response => response.json())
        .then(output => {
            this.render({ type: "favourite-list", favourites: output.favourites.map(c => { return { type: "favourite", favourite: c }; }) })
                .then(list => {
                    holder.appendChild(list);
                    holder.insertAdjacentHTML("beforeend", `
                <div class="favourite-page-new"><button type="button" class="btn btn-primary add">Add new favourite</button></div>
            `)

                    holder.querySelector("button.add").addEventListener("click", e => {
                        let modal = this.createModal(true);
                        modal.title.textContent = "Add Favourite";
                        modal.footer.innerHTML = "<button type='button' class='close btn btn-primary'>Cancel</button> <button type='submit' class='submit btn btn-primary'>Save Changes</button>"

                        this.render({ type: "favourite-form" }).then(form => {
                            form.$modal = modal;
                            form.$list = list;

                            modal.body.appendChild(form);

                            modal.footer.querySelector("button.close").addEventListener("click", e => modal.hide());
                            modal.footer.querySelector("[type='submit']").setAttribute("form", form.getAttribute("id"))

                            modal.show();
                        })
                    })
                })
        })

    return holder;
}

