export function welcomeFooterRenderer(section) {
    if (section.type != "welcome-footer") return null;

    if ("skipWelcome" in this.store.get("currentUser")) return document.createTextNode("");

    let holder = document.createElement("section");
    holder.innnerHTML = `
    <div>
        <label for="no-show">Don't show this page again</label><input type="checkbox" id="no-show" class="form-check-input no-box-shadow"> <button type="button" class="btn btn-primary">Continue to HT &amp; Me</button>
    </div>`

    holder.querySelector("button").addEventListener("click", e => {
        if (holder.querySelector("#no-show").checked) {
            this.store.get("currentUser")["skipWelcome"] = true;
            this.post("/myapp/mydetails/", this.store.get("currentUser"))

            this.path = "#home";
        }
    })

    return holder;
}