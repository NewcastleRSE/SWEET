export function userDetailsPageRenderer(section) {
    if (section.type != "user-details-page") return null;

    let holder = document.createElement("section");

    holder.innerHTML = `

        <section id="my-personal-details">
            <h4>Personal Details</h4>
                <form name="personalDetails" id="personalDetails">
                    <div class="mb-3">
                        <label for="Firstname" class="form-label">Firstname</label>
                        <input type="text" class="form-control" name="firstName" id="firstName" placeholder="Firstname" value="${this.store.get("currentUser").firstName}" required>
                    </div>
                    <div class="mb-3">
                        <label for="Lastname" class="form-label">Lastname</label>
                        <input type="text" class="form-control" name="lastName" id="lastName" placeholder="Lastname" value="${this.store.get("currentUser").lastName}" required>
                    </div>
                    <div class="mb-3">
                        <label for="mobile" class="form-label">Mobile</label>
                        <input type="text" class="form-control" pattern="^\s*\(?(020[7,8]{1}\)?[ ]?[1-9]{1}[0-9{2}[ ]?[0-9]{4})|(0[1-8]{1}[0-9]{3}\)?[ ]?[1-9]{1}[0-9]{2}[ ]?[0-9]{3})\s*$" name="mobile" id="mobile" list="mobile_datalist" placeholder="Mobile" value="${this.store.get("currentUser").mobile}" required>
                        <datalist id="mobile_datalist"></datalist>
                    </div>
                    <div class="mb-3">
                        <label for="Email" class="form-label">Email</label>
                        <input type="email" class="form-control" name="email" id="email" placeholder="Email" value="${this.store.get("currentUser").email}" required>
                        <div class="alert alert-warning mt-3" role="alert">
                            <strong>IMPORTANT</strong><br />If you change your email address, you will need to make sure that you use the new email address next time you log in, but you do not need to register again. You will get an email to remind you of this.
                        </div>
                    </div>
                    <div class="my-3">
                        <button type="button" class="btn btn-primary" id="updateDetails">Update</button>
                    </div>
                </form>
                <h4>Security</h4>
                <div class="my-3">
                    <button type="button" id="changePassword" class="btn btn-primary">Change Password</button>
                    <div class="alert alert-warning mt-3" role="alert">
                        <strong>IMPORTANT</strong><br />You will be required to log in again after you change your password.
                    </div>
                </div>
        </section>
    `
    holder.querySelector('#updateDetails').addEventListener("click", e => {
        let user = this.store.get("currentUser");

        user.firstName = holder.querySelector('#firstName').value
        user.lastName = holder.querySelector('#lastName').value
        user.fullName = holder.querySelector('#firstName').value + " " + holder.querySelector('#lastName').value
        user.email = holder.querySelector('#email').value
        user.mobile = holder.querySelector('#mobile').value

        this.post("/myapp/mydetails/", user).then(response => {
            this.store.set("currentUser", user)
        })
    })

    holder.querySelector("#changePassword").addEventListener("click", () => {
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