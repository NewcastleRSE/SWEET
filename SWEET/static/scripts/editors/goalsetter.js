export class GoalSetter extends HTMLElement {
    static get contentType() { return "goalsetter"; }
    static get tagName() { return "goal-setter"; }
    static get description() { return "Goal Setter"; }

    constructor() {
        super();
        this.$ = {};
        const root = this.$.root = this.attachShadow({mode: "open"});
        root.innerHTML = `
        <label>Type of Goal:</label><select name="type"><option>activity</option></select>
        `
    }

    get isContainer() { return true }

    load(content) {
        this.$.root.querySelector("select").value = content.goaltype;
    }

    get jsonvalue() {
        return {
            type: this.constructor.contentType,
            goaltype: this.$.root.querySelector("select").value
        }
    }



}

export function goalRenderer(section) {
    let holder = document.createElement("section");
    holder.setAttribute("class", "row row-cols-1 row-cols-md-3 g-3 mt-3")
    let isodate = function(d) { return d.toISOString().substr(0,10) }

    let newgoaltemplate = `<div class="col"><div class="card goal unset text-center shadow">
            <div class="card-body d-flex justify-content-center">
                <div class="align-self-center">Set a new goal</div>
            </div>
        </div></div>`;

    let fillGoal = (goal) => {
        let goalCard = document.createElement("div");
        goalCard.setAttribute("class", "card goal text-center shadow h-100");

        let goalCardBody = goalCard.appendChild(document.createElement("div"));
        goalCardBody.setAttribute("class", "card-body d-flex justify-content-center");

        let goalCardContent = goalCardBody.appendChild(document.createElement("div"));
        goalCardContent.setAttribute("class", "align-self-center");


        goalCardContent.innerHTML = `<h5 class="goal-summary">
                    Do some <strong>${goal.detail}</strong> on <strong>${goal.days} days</strong> this week, for <strong>${goal.minutes} minutes</strong> per day.
                </h5>`;

        let today = this.calendarDate(new Date());

        if (goal.reviewDate <= today) {
            goalCard.classList.add("review");
            
            // create a review button
            let review = goalCardContent.appendChild(document.createElement("button"));
            review.setAttribute("class", "goal-review btn btn-primary mt-4 mb-3");
            review.textContent = "Review this goal";
            review.addEventListener("click", (e) => {
                e.stopPropagation();
                const modal = this.createModal(true);
                modal.size = "lg";
                
                modal.title.innerHTML = "Review Goal";
                modal.body.innerHTML = `
                <p><em>${goal.detail}; ${goal.days} days; ${goal.minutes} minutes per day</em></p>
                <p>Have you been successful and completed your goal?</p>
                <div id="review-box-buttons" class="d-flex justify-content-evenly mt-5 mb-5">
                    <button class="btn btn-light" value="y">Yes, Totally</button><button class="btn btn-light" value="p">Yes, Partly</button><button class="btn btn-light" value="n">No, not at all</button>
                </div>`;
                modal.footer.innerHTML = '<button class="btn btn-primary" hidden>Close</button>'
                
                modal.body.querySelector("#review-box-buttons").addEventListener("click", e => {
                    e.stopPropagation();
                    if (e.target.tagName != "BUTTON") {
                        console.log(e.target); return;
                    }

                    goal.status = "complete";
                    goal.outcome = e.target.value;
                    this.post("/myapp/mygoals/", goal).then(response => response.json())
                    .then(outcome => {
                        modal.body.innerHTML = "<h3 class='text-center mt-5 mb-5'>Thank you for reviewing your goal</h3>";
                        modal.footer.querySelector("button").removeAttribute("hidden");
                        modal.footer.querySelector("button").addEventListener("click", e => {
                            e.stopPropagation();

                            let outer = goalCard.parentElement;

                            outer.classList.add("goal", "new")
                            outer.classList.remove("col")
                            outer.innerHTML = newgoaltemplate;
                            outer.addEventListener("click", newgoalhandler);

                            modal.hide();
                        })

                    }).catch(e => {
                        console.log(e);
                    })
                })

                modal.show();
            })
        } else {
            goalCard.classList.add("active");
            // show the review date:
            let reviewdate = goalCardContent.appendChild(document.createElement("h6"));
            reviewdate.setAttribute("class", "mt-4 goal-date");
            reviewdate.textContent = `Review on: ${new Date(Date.parse(goal.reviewDate)).toLocaleDateString()}`;
        }

        return goalCard;
    }

    let newgoalhandler = (nge) => {
        let source = nge.currentTarget;

        // load appropriate schema
        fetch(`/app/schemas/goals/${section.goaltype}`)
        .then(response => response.json())
        .then(schema => {
        // set up form

            const modal = this.createModal(true);
            modal.size = "lg";

            let goal = {};

            modal.title.innerHTML = "Set New Goal";

            let form = goalWrapper.appendChild(document.createElement("form"));
            form.setAttribute("id", "goal-setup-form");
            let list = form.appendChild(document.createElement("datalist"));
            list.setAttribute("id", "activity");
            schema.activity.forEach(i => list.insertAdjacentHTML("beforeend", `<option>${i}</option>`))

            let daysInput = schema.frequency.map(f => `<input class="form-check-input" type="radio" name="frequency" id="frequency-${f}" value="${f}"><label class="form-check-label" for="frequency-${f}">${f}</label>`).join("");
   
            form.appendChild(document.createElement("p")).innerHTML = "<label>Activity: </label><input class='form-control w-50 d-inline-block' type='text' name='activity' list='activity' placeholder='choose an activity'><br><em>You can choose from the list or type your own</em>";
            form.appendChild(document.createElement("p")).innerHTML = `<label>How many days?</label>${daysInput}`;
            form.appendChild(document.createElement("p")).innerHTML = `<label>How many minutes per day? </label><input class='form-control d-inline-block' type='number' name='duration' list='duration'>`;
            modal.body.appendChild(form);

            modal.footer.innerHTML = `<button type="button" class="btn btn-secondary">Cancel</button><button type="submit" form="${form.getAttribute("id")}" class="btn btn-primary">Next</button>`
            modal.footer.querySelector("button[type='button']").addEventListener("click", () => {
                modal.hide();
            })
            
            form.addEventListener("submit", e => {
                e.preventDefault(); e.stopImmediatePropagation();

                goal = {
                    goaltype: 'activity',
                    status: 'active',
                    reviewDate: isodate(((d) => { d.setDate(d.getDate()+7); return d;})(new Date())),
                    detail: form.elements['activity'].value,
                    days: form.elements['frequency'].value,
                    minutes: form.elements['duration'].value,
                }


                modal.body.innerHTML = `
                <h3 class='mb-5'>You're ready to set a new goal for the next week!</h3>
                <section>
                <p>You can always see your goals by clicking <strong>My Goals</strong> on the Being Active homepage.</p>
                <p>In one week, you can come back to review your goal and to get a feedback message.</p>
                <p>You may want to stick a reminder somewhere in your house.</p>
                <p>Your goal is: to do some <strong>${goal.detail}</strong> on <strong>${goal.days} days</strong> this week, for <strong>${goal.minutes} minutes</strong> per day.</p>
                </section>`;

                let submitButton = modal.footer.querySelector("button[type='submit']");
                submitButton.setAttribute("type", "button");
                submitButton.textContent = "Save";

                submitButton.addEventListener("click", () => {
                    this.post("/myapp/mygoals/", goal).then(response => response.json())
                    .then(outcome => {
                        if (outcome.status == "error") {
                            document.getElementById("toast-message-type").text("Error");
                            document.getElementById("toast-message").text(`We were not able to save your new goal. ${outcome.message}`);
                        } else {
                            source.innerHTML = "";
                            source.appendChild(fillGoal(goal));
                            source.removeEventListener("click", newgoalhandler);
                        }

                        modal.hide();
                    }).catch(e => console.log(e))
                })
            })

            modal.show();
        })
    }

    // get user's active goals
    fetch("/myapp/mygoals")
    .then(response => response.json())
    .then(goals => {

        goals.current.sort((a,b) => {
            if (b.reviewDate < a.reviewDate) return 1;
            return -1;
        }).forEach(goal => {
            // add a goal to the holder
            let outer = document.createElement("div");
            outer.classList.add("col");

            outer.appendChild(fillGoal(goal));

            holder.appendChild(outer);
        })
        
        while (holder.children.length < 3) {
            // render a blank goal that can be completed
            let outer = holder.appendChild(document.createElement("div"));
            outer.classList.add("goal", "new");
            outer.innerHTML = newgoaltemplate;
            outer.addEventListener("click", newgoalhandler);
        } 
    })

    return holder;
}
