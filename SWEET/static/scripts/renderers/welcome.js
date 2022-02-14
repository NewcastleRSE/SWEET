export function welcomeFooterRenderer(section) {
    if (section.type != "welcome-footer") return null;

    let holder = document.createElement("section");
    holder.classList.add("welcome-footer");

    holder.innerHTML = `
    <div>
        <label>Don't show this page again <input type="checkbox" id="no-show" class="form-check-input no-box-shadow"></label> <button type="button" class="btn btn-primary">Continue to HT &amp; Me</button>
    </div>
    `

    holder.querySelector("button").addEventListener("click", e => {
        if (holder.querySelector("#no-show").checked) {
            this.store.get("currentUser")["skipWelcome"] = true;
            this.post("/myapp/mydetails/", this.store.get("currentUser"))

        }
        this.path = "#home";
    })

    return holder;
}