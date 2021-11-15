export function userDetailsPageRenderer(section) {
    if (section.type != "user-details-page") return null;

    let holder = document.createElement("section");

    holder.innerHTML = `

        <section id="my-personal-details">
            <h4>Personal Details</h4>
            <div  class="row row-cols-2">
                <div class="col"><label for="firstName">First Name</label><br><span id="firstName">${this.store.get("currentUser").firstName}</span><button type="button" class="edit" data-for="firstName"></button></div>
                <div class="col"><label for="lastName">Last Name</label><br><span id="lastName">${this.store.get("currentUser").lastName}</span><button type="button" class="edit" data-for="lastName"></button></div>
                <div class="col"><label for="email">Email Address</label><br><span id="email">${this.store.get("currentUser").email}</span><button type="button" class="edit" data-for="email"></button></div>
                <div class="col"><button type="button" class="btn btn-primary">Change Password</button></div>
            </div>
        </section>
    `

    holder.querySelectorAll("button[data-for]").forEach(src => {
        src.addEventListener("click", e => {
            let which = src.getAttribute("data-for");

            if (src.classList.contains("edit")) {
                let target = holder.querySelector(`#${which}`);
                let input = document.createElement("input");
                input.setAttribute("type", which=="email"?"email":"text");
                input.setAttribute("id", which);
                input.value = target.textContent;
                target.remove();
                src.insertAdjacentElement("beforebegin", input);
                src.classList.remove("edit");
                src.classList.add("save");
                input.focus();
            } else if (src.classList.contains("save")) {
                let input = holder.querySelector(`#${which}`);
                let user = this.store.get("currentUser");
                user[which] = input.value;
                
                this.post("/myapp/mydetails/", user).then(response => {
                    let target = document.createElement("span");
                    target.setAttribute("id", which);
                    target.textContent = input.value;
                    input.remove();
                    src.insertAdjacentElement("beforebegind", target);
                    src.classList.remove("save");
                    src.classList.add("edit");
                })
            } else {
                console.error("Personal detail edit buttons missing both 'save' and 'edit' classes.");
            }
        })
    })
}