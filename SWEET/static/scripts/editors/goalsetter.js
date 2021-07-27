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

    let newgoalhandler = function() {

        // load appropriate schema
        fetch(`/app/schemas/goals/${section.goaltype}`)
        .then(response => response.json())
        .then(schema => {
        // set up form

            let goal;
            let submitButton = document.getElementById("goal-yes");
            let goalWrapper = document.getElementById("goalWrapper");

            goalWrapper.innerHTML = "";
            document.getElementById("goalLabel").innerHTML = "Set New Goal";
            submitButton.innerText = "Next";

            let form = goalWrapper.appendChild(document.createElement("form"));
            form.setAttribute("id", "goal");
            let list = form.appendChild(document.createElement("datalist"));
            list.setAttribute("id", "activity");
            schema.activity.forEach(i => list.insertAdjacentHTML("beforeend", `<option>${i}</option>`))

            let daysInput = schema.frequency.map(f => `<div class="form-check form-check-inline"><input class="form-check-input" type="radio" name="frequency" id="frequency-${f}" value="${f}"><label class="form-check-label" for="frequency-${f}">${f}</label></div>`).join("");
   
            form.appendChild(document.createElement("p")).innerHTML = "I will do some <input class='form-control w-50 d-inline-block' type='text' name='activity' list='activity' placeholder='choose an activity or type your own'> this week.";
            form.appendChild(document.createElement("p")).innerHTML = `I will do it on &nbsp;${daysInput} days.`;
            form.appendChild(document.createElement("p")).innerHTML = `I will do it for <input class='form-control w-25 d-inline-block' type='number' name='duration' list='duration'/> minutes each day.`;
            // form.insertAdjacentHTML("beforeend", '<p><input type="submit" value="Next" /></p>')
            
            submitButton.addEventListener("click", e => {
                e.preventDefault();

                goal = {
                    goaltype: 'activity',
                    status: 'active',
                    reviewDate: isodate(((d) => { d.setDate(d.getDate()+7); return d;})(new Date())),
                    detail: form.elements['activity'].value,
                    days: form.elements['frequency'].value,
                    minutes: form.elements['duration'].value,
                }

                console.log(goal);

                document.getElementById("goal-yes").innerText = "Save";
                document.getElementById("goalWrapper").innerHTML = `
                <h3 class='w-75 mb-5'>You're ready to set a new goal for the next week!</h3>
                <section>
                <p>You can always see your goals by clicking <strong>My Goals</strong> on the Being Active homepage.</p>
                <p>In one week, you can come back to review your goal and to get a feedback message.</p>
                <p>You may want to stick a reminder somewhere in your house.</p>
                <p>Your goal is: to do some <strong>${goal.detail}</strong> on <strong>${goal.days} days</strong> this week, for <strong>${goal.minutes} minutes</strong> per day.</p>
                </section>`;
                submitButton.addEventListener("click", () => {
                    fetch("/myapp/mygoals/", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(goal)
                    }).then(response => response.json())
                    .then(outcome => {
                        if (outcome.status == "error") {
                            document.getElementById("toast-message-type").text("Error");
                            document.getElementById("toast-message").text(`We were not able to save your new goal. ${outcome.message}`);
                            bootstrap.Modal.getInstance(document.getElementById('goalModal')).hide();
                            return;
                        }
                        bootstrap.Modal.getInstance(document.getElementById('goalModal')).hide();
                        goalWrapper.innerHTML = "";

                    }).catch(e => console.log(e))
                })
            })

            const modal = new bootstrap.Modal(document.getElementById('goalModal'));
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

            let goalCard = document.createElement("div");
            goalCard.setAttribute("class", "card goal text-center shadow h-100");

            let goalCardBody = document.createElement("div");
            goalCardBody.setAttribute("class", "card-body d-flex justify-content-center");

            let goalCardContent = document.createElement("div");
            goalCardContent.setAttribute("class", "align-self-center");


            goalCardContent.innerHTML = `<h5 class="goal-summary">
                        Do some <strong>${goal.detail}</strong> on <strong>${goal.days} days</strong> this week, for <strong>${goal.minutes} minutes</strong> per day.
                    </h5>`;

            goalCardBody.appendChild(goalCardContent);
            goalCard.appendChild(goalCardBody);        
            outer.appendChild(goalCard);

            let today = isodate(new Date());

            if (goal.reviewDate <= today) {
                goalCard.classList.add("review");
                
                // create a review button
                let review = goalCardContent.appendChild(document.createElement("button"));
                review.setAttribute("class", "goal-review btn btn-primary mt-4 mb-3");
                review.textContent = "Review this goal";
                outer.addEventListener("click", function outerclick(e) {
                    e.stopPropagation();
                    const modal = new bootstrap.Modal(document.getElementById('goalModal'));
                    
                    let submitButton = document.getElementById("goal-yes");
                    let goalWrapper = document.getElementById("goalWrapper");

                    goalWrapper.innerHTML = "";
                    document.getElementById("goalLabel").innerHTML = "Review Goal";
                    submitButton.classList.add("d-none")

                    document.getElementById("goalWrapper").innerHTML = `<p>Have you been successful and completed your goal?</p>
                    <div id="review-box-buttons" class="d-flex justify-content-evenly mt-5 mb-5">
                        <button class="btn btn-light" value="y">Yes, Totally</button><button class="btn btn-light" value="p">Yes, Partly</button><button class="btn btn-light" value="n">No, not at all</button>
                    </div>`;

                    goalWrapper.querySelector("#review-box-buttons").addEventListener("click", e => {
                        e.stopPropagation();
                        if (e.target.tagName != "BUTTON") {
                            console.log(e.target); return;
                        }

                        goal.status = "complete";
                        goal.outcome = e.target.value;
                        fetch("/myapp/mygoals/", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(goal)
                        }).then(response => response.json())
                        .then(outcome => {
                            goalWrapper.innerHTML = "<h3 class='text-center mt-5 mb-5'>Thank you for reviewing your goal</h3>";
                            submitButton.innerText = "Done";
                            submitButton.classList.remove("d-none");
                            submitButton.addEventListener("click", e => {
                                e.stopPropagation();
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

            holder.appendChild(outer);
        })
        
        while (holder.children.length < 3) {
            // render a blank goal that can be completed
            let outer = holder.appendChild(document.createElement("div"));
            outer.classList.add("goal");
            outer.classList.add("new");
            outer.innerHTML = newgoaltemplate;
            outer.addEventListener("click", newgoalhandler);
        } 
    })

    return holder;
}
