export function plansAndGoalsRenderer(section) {

    let holder = document.createElement("section");
    let goalholder = holder.appendChild(document.createElement("section"));
    let planholder = holder.appendChild(document.createElement("section"));

    fetch("/myyapp/mygoals").then(response => response.json())
    .then(goals => {
        goalholder.appendChild(document.createElement("h4")).textContent = "My Current Goals";
        let actgoals = goalholder.appendChild(document.createElement("section"));
        actgoals.classList.add("row", "row-cols-1", "row-cols-md-3", "g-3", "mt-3");

        goals.current.sort((a,b) => {
            if (b.reviewDate < a.reviewDate) return 1;
            return -1;
        }).forEach(g => {
            actgoals.insertAdjacentHTML("beforeend", `
                <div class="col">
                    <div class="card goal text-center shadow h-100">
                        <div class="card-body d-flex justify-content-center">
                            <div class="align-self-center">
                                <h5 class="goal-summary">${g.goaltype == "activity"? "Do some ": ""}<strong>${g.detail}</strong> on <strong>${g.days} days</strong> this week${g.minutes? `, for <strong>${g.minutes} minutes</strong> per day`:""}.</h5>
                                <h6>Review on: ${new Date(Date.parse(goal.reviewDate)).toLocaleDateString()}</h6>
                            </div>
                        </div>
                    </div>
                </div>`)
        })

        goalholder.appendChild(document.createElement("div")).innerHTML = `<a class="goal-link" href="#home/healthy-living/being-active/goals/set-goal">Review and create your Being Active goals here</a><a class="goal-link" href="#home/healthy-living/healthy-eating">Review and create your Healthy Eating goals here</a>`

        goalholder.appendChild(document.createElement("h4")).textContent = "My Historic Goals";
        let gtable = goalholder.appendChild(document.createElement("table"));
        gtable.insertAdjacentHTML("beforeend", '<tr><th>Goal details</th><th>Your Outcome</th></tr>')
        goals.complete.sort((a,b) => {
            if (b.reviewDate < a.reviewDate) return 1;
            return -1;
        }).forEach(g => {
            gtable.insertAdjacentHTML("beforeend", `
            <tr><td>${g.goaltype == "activity"? "Do some ": ""}<strong>${g.detail}</strong> on <strong>${g.days} days</strong> this week${g.minutes? `, for <strong>${g.minutes} minutes</strong> per day`:""}.</td><td>${g.outcome == "y"? "Complete Successful": g.outcome == "p"? "Partially Successful": "Not Successful"}</td></tr>`);
        })
    });

    fetch("/myapp/myplans").then(response => response.json())
    .then(plans => {
        planholder.appendChild(document.createElement("h4")).textContent = "My Plans";

        if (plans["#home/taking-ht/my-plan"]) {
            let takinght = planholder.appendChild(document.createElement("div"));
            takinght.innerHTML = `<h5>My plan for taking my hormone therapy</h5>
            <p>If it is <strong>${plans["#home/taking-ht/my-plan"]['time']}</strong> and I am <strong>${plans["#home/taking-ht/my-plan"]['place']}</strong>
            and I have <strong>${plans["#home/taking-ht/my-plan"]['activity']}</strong> THEN <strong><em>${plans["#home/taking-ht/my-plan"]['plan']}</em></strong></p>
            <p><a class="plan-link" href="#home/taking-ht/my-plan">Change this plan in the <strong>Taking Hormone Therapy</strong> section</a></p>`;
        }
    });

    return holder;

}