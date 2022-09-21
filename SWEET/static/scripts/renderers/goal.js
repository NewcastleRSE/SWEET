export function goalRenderer(section) {
    let holder = document.createElement("section");
    let cardSection = document.createElement("div");
    cardSection.setAttribute("class", "row row-cols-1 row-cols-md-3 g-3 mt-3 my-4")
    cardSection.id = "goalsCardSection";

    let tableSection = document.createElement("div");
    tableSection.id = "goalsTableSection";

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
                    ${goal.goaltype == "activity"? "Do some ": ""}<strong>${goal.detail}</strong> on <strong>${goal.days} days</strong> this week${goal.minutes? `, for <strong>${goal.minutes} minutes</strong> per day`:""}.
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
                
                modal.title.innerHTML = "   ";
                modal.body.innerHTML = `
                <p><em>${goal.detail}; ${goal.days} days${goal.minutes? `; ${goal.minutes} minutes per day`: ""}</em></p>
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
                        modal.body.innerHTML = "";
                        this.render({ type: "markdown", encoding: "raw", text: outcome.message}).then(node => modal.body.appendChild(node));
                        
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
            let deleteBtn = document.createElement("button");
            deleteBtn.textContent = 'Delete this goal';
            deleteBtn.classList.add("btn", "goal-review", "btn", "btn-primary", "mt-4", "mb-3");
            goalCardContent.appendChild(deleteBtn);

            deleteBtn.addEventListener(('click'), e => {
                goal.status = "deleted";
                goal.outcome = "n";
               
                this.post("/myapp/mygoals/", goal).then(response => response.json())
                    .then(outcome => {
                        let outer = goalCard.parentElement;

                        outer.classList.add("goal", "new")
                        outer.classList.remove("col")
                        outer.innerHTML = newgoaltemplate;
                        outer.addEventListener("click", newgoalhandler);

                    }).catch(e => {
                    console.log(e);
                })
            })

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

            modal.title.textContent = "Set New Goal";

            let form = modal.body.appendChild(document.createElement("form"));
            form.setAttribute("id", "goal-setup-form");
            let list = form.appendChild(document.createElement("datalist"));
            schema.activity.forEach(i => list.insertAdjacentHTML("beforeend", `<option>${i}</option>`))
            list.insertAdjacentHTML("beforeend", `<option value="type-own">Something else...</option>`)

            let daysInput = schema.frequency.map(f => `<input class="form-check-input" type="radio" name="frequency" id="frequency-${f}" value="${f}"><label class="form-check-label" for="frequency-${f}">${f}</label>`).join("");
   
            form.appendChild(document.createElement("p")).innerHTML = `<label>Activity: </label> <select class='form-control w-50 d-inline-block my-2' name='activity' placeholder='choose an activity' autocomplete='off'></select>
            <span id="activity-other-wrapper" hidden><br><label>Write your own here:</label><input type="text" name="activity-other" class='form-control w-50 d-inline-block my-2' ></span>`;

            form.appendChild(document.createElement("p")).innerHTML = `<label>How many days?</label> ${daysInput}`;
            if (schema.duration) {
                form.appendChild(document.createElement("p")).innerHTML = `<label>How many minutes per day? </label><input class='form-control d-inline-block' type='number' name='duration' min='0'>`;
            }

            form.querySelector("select").innerHTML = list.innerHTML;
            form.querySelector("select").addEventListener("change", e => {
                if (e.target.value == "type-own") {
                    form.querySelector("#activity-other-wrapper").removeAttribute("hidden")
                } else {
                    form.querySelector("#activity-other-wrapper").setAttribute("hidden", "")
                }
            })

            modal.body.appendChild(form);

            modal.footer.innerHTML = `<button type="button" class="btn btn-secondary">Cancel</button><button type="submit" form="${form.getAttribute("id")}" class="btn btn-primary">Next</button>`
            modal.footer.querySelector("button[type='button']").addEventListener("click", () => {
                modal.hide();
            })
            
            form.addEventListener("submit", e => {
                e.preventDefault(); e.stopImmediatePropagation();

                fetch(`/myapp/checkgoal?goaltype=${section.goaltype}&detail=${form.elements['activity'].value == "type-own"? form.elements['activity-other'].value: form.elements['activity'].value}`)
                .then(response => response.json())
                .then(outcome => {
                    let showerror = (message) => {
                        form.elements['activity'].insertAdjacentHTML("afterend", `
                        <p style="font-size: 80%; color: red; margin-bottom: 0;">${message}</p>`)
                    }
                    if (outcome.status != "OK") {
                        showerror("You must select an activity before continuing.")
                    } else if (outcome.result) {
                        showerror("Sorry, we were not able to save your requested goal: You can only log one goal for each type of activity. Why not try making a goal for a different activity?")
                    } else {
                        goal = {
                            goaltype: section.goaltype,
                            status: 'active',
                            reviewDate: isodate(((d) => { d.setDate(d.getDate()+7); return d;})(new Date())),
                            detail: form.elements['activity'].value == "type-own"? form.elements['activity-other'].value: form.elements['activity'].value,
                            days: form.elements['frequency'].value
                        }
        
                        if (schema.duration) {
                            goal.minutes = form.elements['duration'].value
                        }
        
                        modal.title.innerHTML = "";
                        
                        modal.body.innerHTML = `
                        <h3 class='mb-5'>NEW ${schema.displayName.toUpperCase()} GOAL</h3>
                        <section>
                        <p>Well done!</p>
                        <p>You've set a new goal for the next week.</p>
                        <p>You can always see your goals by clicking <strong>My Goals</strong> on the ${section.goaltype == "activity"? "Being Active": "Healthy Eating"} homepage or go to the <strong>My Goals and Plans</strong> page on HT&Me homepage.</p>
                        <p>In one week, you can come back to get personal feedback on your goal.</p>
                        <p>It's a good idea to stick up a reminder somewhere in your house.</p>
                        <p>Your goal is: <strong>${goal.detail}</strong><br>
                        How often: <strong>${goal.days} days</strong>${
                            goal.minutes?`<br>
                        For: <strong>${goal.minutes} minutes</strong>`:""
                        }.</p>
                        </section>`;
        
                        let submitButton = modal.footer.querySelector("button[type='submit']");
                        submitButton.setAttribute("type", "button");
                        submitButton.textContent = "Save";
        
                        submitButton.addEventListener("click", () => {
                            this.post("/myapp/mygoals/", goal).then(response => response.json())
                            .then(outcome => {
                                if (outcome.status == "error") {
                                    //document.getElementById("toast-message-type").text("Error");
                                    //document.getElementById("toast-message").text(`We were not able to save your new goal. ${outcome.message}`);
                                    alert(`We were not able to save your requested goal:\n${outcome.message}`)
        
                                } else {
                                    source.innerHTML = "";
                                    source.appendChild(fillGoal(goal));
                                    source.removeEventListener("click", newgoalhandler);
                                }
        
                                modal.hide();
                            }).catch(e => console.log(e))
                        })
                    }
                })
            })

            modal.show();
        })
    }

    // dleted and completed goals for summary table
    let completedGoal = (goals) => {

        let responsiveTableDiv = document.createElement("div");
        responsiveTableDiv.classList.add("table-responsive");
        let completedTable = document.createElement("table");
        completedTable.classList.add("table");
        let completedHeader = document.createElement("thead");
        let completedHRow = document.createElement("tr");

        // create header row for each activity type
        let headerList = ['Activity','Days', 'Review date', 'Status', 'Outcome'];
        if (section.goaltype === 'activity') {
            // activity goal type also has a number of minutes
            headerList = ['Activity', 'Days' , 'Minutes' ,'Review date', 'Status', 'Outcome'];
        }

        // create header row
        headerList.forEach((item) => {
            let completedCol = document.createElement("th");
            completedCol.attributes.scope = "col";
            completedCol.innerText = item;
            completedHRow.appendChild(completedCol);
        });

        //table body
        let completedBody = document.createElement("tbody");

        // convert shorthand from storage into readable form
        let outcomeLookup = {
            "y": "complete",
            "n": "not complete",
            "p": "partially complete"
        }

        // add row for each goal
        goals.forEach((g) => {
            let tr = document.createElement("tr");
            let activity = document.createElement("td");
            activity.innerText = g.detail;
            let often = document.createElement("td");
            often.innerText = g.days;
            let review = document.createElement("td");
            review.innerText = g.reviewDate;
            let status = document.createElement("td");
            status.innerText = g.status;
            let outcome = document.createElement("td");
            outcome.innerText = outcomeLookup[g.outcome];

            // special header for activity goals
            if (section.goaltype === 'activity') {
                let minutes = document.createElement("td");
                minutes.innerText = g.minutes;
                tr.append(activity, often, minutes, review, status, outcome);
            } else {
                tr.append(activity, often, review, status, outcome);
            }

            completedBody.appendChild(tr);
        });


        completedHeader.appendChild(completedHRow);
        completedTable.appendChild(completedHeader);
        completedTable.appendChild(completedBody);
        responsiveTableDiv.appendChild(completedTable);


        return responsiveTableDiv;
    }

    // get user's active goals
    fetch(`/myapp/mygoals/${section.goaltype}`)
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

           cardSection.appendChild(outer);
        })
        
        while (cardSection.children.length < 3) {
            // render a blank goal that can be completed
            let outer = cardSection.appendChild(document.createElement("div"));
            outer.classList.add("goal", "new");
            outer.innerHTML = newgoaltemplate;
            outer.addEventListener("click", newgoalhandler);
        }

        // create table of deleted and completed goals
        if (goals.complete.length > 0 || goals.deleted.length > 0) {
            let notCurrentGoals = goals.complete.concat(goals.deleted)

            let orderedGoals = notCurrentGoals.sort((a,b) => {
                if (b.reviewDate < a.reviewDate) return 1;
                return -1;
            });


            tableSection.appendChild(completedGoal(orderedGoals));
        }

    })

    holder.appendChild(cardSection);
    holder.appendChild(tableSection);

    return holder;
}
