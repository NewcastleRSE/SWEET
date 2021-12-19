export function userDetailsPageRenderer(section) {
    if (section.type != "user-details-page") return null;

    let holder = document.createElement("section");

    holder.innerHTML = `

        <section id="my-personal-details">
            <h4>Personal Details</h4>
            <div  class="row row-cols-2">
                <div class="col"><label for="firstName">First Name</label> <span id="firstName">${this.store.get("currentUser").firstName}</span><button type="button" class="edit" data-for="firstName"><button type="button" class="cancel" data-for="firstName"></button></div>
                <div class="col"><label for="lastName">Last Name</label> <span id="lastName">${this.store.get("currentUser").lastName}</span><button type="button" class="edit" data-for="lastName"></button><button type="button" class="cancel" data-for="lastName"></div>
                <div class="col"><label for="email">Email Address</label> <span id="email">${this.store.get("currentUser").email}</span><button type="button" class="edit" data-for="email"></button><button type="button" class="cancel" data-for="email"></div>
                <div class="col"><button type="button" class="btn btn-primary">Change Password</button><br><span class="sidenote">[n.b. you will be required to log in again after you change your password]</span></div>
            </div>
        </section>
    `

    holder.querySelectorAll("button[data-for]").forEach(src => {
        src.addEventListener("click", e => {
            let which = src.dataset.for;

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

                let canceller = holder.querySelector(`.cancel[data-for='${which}']`)
                canceller.dataset.revert = input.value;

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
                    src.insertAdjacentElement("beforebegin", target);
                    src.classList.remove("save");
                    src.classList.add("edit");
                })
            } else if (src.classList.contains("cancel")) {

                const oldval = src.dataset.revert
                if (!oldval) return;

                let input = holder.querySelector(`#${which}`);
                let saver = holder.querySelector(`.save[data-for='${which}']`)
                
                let target = document.createElement("span");
                target.setAttribute("id", which);
                target.textContent = oldval;
                
                input.remove();
                
                saver.insertAdjacentElement("beforebegin", target);
                saver.classList.remove("save");
                saver.classList.add("edit");
            } else {
                console.error("Personal detail edit buttons missing both 'save' and 'edit' classes.");
            }
        })
    })

    holder.querySelector("button:not([data-for])").addEventListener("click", () => {
        let modal = this.createModal(true);

        modal.title.textContent = "Change Password";
        modal.body.innerHTML = `
        <form id="change-pass-form">
            <label for="oldpass" class="p-2 lbl-small">Current Password:</label> <input type="password" class="password-field" name="oldpass" id="oldpass" size="15" minlength="5" required><br>
            <label for="password" class="p-2 lbl-small">New Password:</label> <input type="password" class="password-field" name="password" id="password" size="15" minlength="5"  required><br>
            <label for="confpass" class="p-2 lbl-small">Confirm New Password:</label> <input type="password" class="password-field" name="confpass" id="confpass" size="15" minlength="5" required>
            <div id="errors"></div>
        </form>
        `
        modal.footer.innerHTML = `<button type="button" id="form-cancel">Cancel</button><input type="submit" form="change-pass-form" value="Save details">`

        modal.footer.querySelector("#form-cancel").addEventListener("click", () => modal.hide());

        modal.body.querySelector("form").addEventListener("submit", e => {
            e.preventDefault(); e.stopPropagation();

            let form = e.target;
            if (form.elements["password"].value != form.elements["confpass"].value) {
                form.querySelector("#errors").innerHTML = `<p>The new password and password confirmation do not match. Please retype them and try again.</p>`;
                return false;
            } else {
                let user = Object.assign({}, this.store.get("currentUser"));
                user.oldpass = form.elements["oldpass"].value;
                user.password = form.elements["password"].value;

                this.post("/myapp/mydetails/", user).then(response => response.json())
                .then(output => {
                    if (output.status == "OK") {
                        location.pathname = "/auth/logout";
                    } else {
                        form.querySelector("#errors").innerHTML = `<p>${output.message}.</p>`;
                        return false;
                    }
                })
            }
        })
        
        modal.show();
    })

    return holder;
}