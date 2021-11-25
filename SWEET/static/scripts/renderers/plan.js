export function planRenderer(section) {
    if (section.type != "plan") return null;

    let holder = document.createElement("section");
    holder.classList.add("plan")
    holder.innerHTML = `
    <form>
        <label><strong>If it is</strong> [write time]</label>
        <input type="text" name="time" class="form-control shadow-hover">
        <label><strong>And I am</strong> [write place]</label>
        <input type="text" name="place" class="form-control shadow-hover">
        <label><strong>And I have</strong> [write activity]</label>
        <input type="text" name="activity" class="form-control shadow-hover">
        <label><strong>Then</strong> [I will take]</label>
        <input type="text" name="response" class="form-control shadow-hover">
        <input type="submit" value="Save" class="btn btn-primary">
    </form>`

    let form = holder.querySelector("form");
    
    form.addEventListener("submit", e => {
        e.preventDefault();

        let plan = {
            type: section.plan,
            time: form.elements["time"],
            place: form.elements["place"],
            activity: form.elements["activity"],
            plan: form.elements["plan"],
        }

        this.post("/myapp/myplans/", plan)
    })

    fetch(`/myapp/myplans/${section.plan}`).then(response => response.json())
    .then(plan => {
        for (field in ["time", "place", "activity", "plan"]) {
            if (field in plan) form.elements[field] = plan[field];
        }
    })

    return holder;
}

export function myPlansRenderer(section) {
    if (section.type != "my-plans") return null;

    let holder = document.createElement("section");
    holder.classList.add("my-plans");

    let content;
    fetch(`/myapp/myplans/${section.plan}`).then(response => response.json())
    .then(plan => {
        if (plan.result) {
            content = {
                type: "container",
                content: [
                    {
                        type: "markdown",
                        encoding: "raw",
                        text: "It looks like you haven’t made a plan yet for taking your hormone therapy tablets.\n\nMaking a plan is a really good way to make sure you fit taking tablets into your life, and remember to take your tablet every day. To go to the Make a Plan page click the button below."
                    },
                    {
                        type: "menu",
                        content: [{
                            type: "menu-item",
                            title: "Go to Make a Plan page",
                            link: "#home/taking-ht/my-plan"
                        }]
                    }
                ]
            }
        } else {
            content = { type: "plan", plan: section.plan }
        }

        this.render(content).then(node => holder.appendChild(node))
    });

    return holder;
}