export function contactListRenderer(section) {
    if (section.type != "contact-list") return null;

    let holder = document.createElement("section");
    holder.classList.add("contact-list");
    section.contacts.forEach(contact => this.render({ type: "contact", "contact": contact}).then(node => holder.appendChild(node)));

    return holder;
}

export function contactRenderer(section) {
    if (section.type != "contact" || !("contact" in section)) return null;

    let contact = section.contact;
    let holder = document.createElement("section");
    holder.classList.add("contact");

    holder.innerHTML = `
        <header>
            <button class="edit"></button>
            <button class="delete"></button>
            <h4>Key Contact</h4>
            <h5>${contact.type}</h5>
        </header>
        <div class="contact-body">
            <strong>Name</strong>: <span class="contact-name">${contact.name}</span><br>
            <strong>Phone</strong>: <span class="contact-phone">${contact.phone}</span><br>
            <strong>Email</strong>: <span class="contact-email">${contact.email}</span>
        </div>
    `
    holder.querySelector("button.edit").addEventListener("click", e => {
        let modal = this.createModal(true);
        modal.title.textContent = "Edit Contact";
        modal.footer.innerHTML = "<button type='button' class='close btn btn-secondary'>Cancel</button> <button type='submit' class='submit btn btn-primary'>Save Changes</button>"

        this.render({ type: "contact-form", "contact": contact}).then(form => {
            form.$opener = holder;
            form.$modal = modal;

            modal.body.appendChild(form);
            
            modal.footer.querySelector("button.submit").setAttribute("for", form.getAttribute("id"));
            modal.footer.querySelector("button.close").addEventListener("click", e => modal.hide());

            modal.show();
        })
    })

    holder.querySelector("button.delete").addEventListener("click", e => {
        if (window.confirm(`Delete ${contact.name} from your contacts?\n(this change cannot be undone)`)) {
            this.post("/myapp/mycontacts/delete/", contact).then(response => response.json())
            .then(result => holder.remove())
        }
    })

    return holder;

}

export function contactFormRenderer(section) {
    if (section.type != "contact-form") return null;
    let edit = ("contact" in section);

    let form = document.createElement("form");
    if (edit) form.setAttribute("id", contact.name.toLower().replaceAll(" ", "_"))

    form.innerHTML = `
        <label for="contact-type">Who is this person?</label><select id="contact-person-type" name="type"><option>Breast Cancer Nurse</option><option>GP Practice</option><option>Pharmacist</option><option>Other</option></select><br>
        <label for="contact-name">Name:</label> <input type="text" id="contact-name" name="name"${edit?` value="${section.contact.name}"`:""}><br>
        <label for="contact-phone">Phone:</label> <input type="tel" id="contact-phone" name="phone"${edit?` value="${section.contact.phone}"`:""}><br>
        <label for="contact-email">Email:</label> <input type="email" id="contact-email" name="email"${edit?` value="${section.contact.email}"`:""}><br>
    `

    if (edit) {
        form.querySelector("select").value = section.contact.type;
        form.querySelector("select").setAttribute("disabled", "");
    }

    form.addEventListener("submit", e => {
        let contact =  {
            type: form.elements["type"],
            name: form.elements["name"],
            phone: form.elements["phone"],
            email: form.elements["email"]
        }

        let poster = edit ?
            this.post("/myapp/mycontacts/update/", { newcontact: contact, oldcontact: section.contact}) : 
            this.post("/myapp/mycontacts/add/", contact);

        poster.then(() => {
            if (form.$opener) {
                form.$opener.querySelector(".contact-name").textContent = contact.name;
                form.$opener.querySelector(".contact-phone").textContent = contact.phone;
                form.$opener.querySelector(".contact-email").textContent = contact.email;
            }

            if (form.$modal) form.$modal.hide();
        })
    })

    return holder;
}

export function contactPageRenderer(section) {
    if (section.type != "contact-page") return null;

    let holder = document.createElement("section");
    holder.classList.add("all-contacts")

    fetch("/myapp/mycontacts").then(response => response.json())
    .then(output => {
        this.render({ type: "contact-list", contacts: output.contacts.map(c => { return { type: "contact", contact: c}; })})
        .then(list => {
            holder.appendChild(list);
            holder.insertAdjacentHTML("beforeend", `
                <div class="contact-page-new"><button type="button" class="btn btn-primary add">Add new contact</button></div>
            `)

            holder.querySelector("button.add").addEventListener("click", e => {
                let modal = this.createModal(true);
                modal.title.textContent = "Add Contact";
                modal.footer.innerHTML = "<button type='button' class='close btn btn-secondary'>Cancel</button> <button type='submit' class='submit btn btn-primary'>Save Changes</button>"
        
                this.render({ type: "contact-form"}).then(form => {
                    form.$modal = modal;
        
                    modal.body.appendChild(form);
                    
                    modal.footer.querySelector("button.close").addEventListener("click", e => modal.hide());
        
                    modal.show();
                })
            })
        })
    })

    return holder;
}

