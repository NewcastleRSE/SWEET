export function markdownRenderer(section) {
    let holder = document.createElement("section");
    holder.classList.add("markdown")
    if (section.encoding == "lz-string:UTF16") {
        holder.innerHTML = marked.parse(LZString.decompressFromUTF16(section.text));
    } else if (section.encoding == "lz-string:B64") {
        holder.innerHTML = marked.parse(LZString.decompressFromBase64(section.text));
    } else if (section.encoding == "raw") {
        holder.innerHTML = marked.parse(section.text);
    } else {
        holder.innerHTML = `<p class="error">Unknown markdown section encoding: ${section.encoding}</p>`;
    }
    
    holder.querySelectorAll("a[href^='http']").forEach(a => a.setAttribute("target", "_blank"));
    
    holder.querySelectorAll("a[href^='%']").forEach(a => {
        a.addEventListener("click", e => {
            e.preventDefault();
            let popup = a.getAttribute("href").substr(1);
            bootstrap.Modal.getInstance(document.querySelector(`#popup-${popup}`)).show();
        })
    });

    holder.querySelectorAll("img").forEach(img => {
        if (img.getAttribute("src").startsWith("http")) return; //ignore absolute image paths

        let [name, position] = img.getAttribute("src").split(":");

        fetch(`/app/resources/${name}`).then(response => response.json())
        .then(resource => {
            if (resource['content-type'] === undefined || resource['content-type'].startsWith("image")) {
                if (resource.source == "useblob") {
                    img.setAttribute("src", `/app/resources/files/${name}`);
                } else {
                    img.setAttribute("src", resource.source);
                }
                img.setAttribute("alt", resource.description);
                if (position) img.classList.add(...position.split(";"));
            } else if (resource['content-type'].startsWith("video")) {
                let src = resource.source == "useblob"? `/app/resources/files/${name}`: resource.source;
                img.insertAdjacentHTML("beforebegin", `<video controls src="${src}"${position? ` class="${position.replace(';',' ')}"`:""}><p>${resource.description}</p></video>`);
                img.remove();
                // maybe do some work with position.
                // maybe do some work with popups.
            }
        })
    })

    holder.querySelectorAll("code").forEach(code => {
        let [item, prop] = code.textContent.split(".");
        console.log(`"${item}"`)
        code.insertAdjacentHTML("beforebegin", this.store.get(item)[prop]);
        code.remove();
    })

    return holder;
}

export function embedRenderer(section) {
    let overlay = this.createModal(true);
    overlay.size = "lg";

    overlay.title.textContent = section.title;

    overlay.footer.innerHTML = "<button type='button' class='btn btn-primary'>Close</button>";
    overlay.footer.querySelector("button").addEventListener("click", () => overlay.hide());

    let embed = document.createElement("iframe");
    embed.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    embed.setAttribute("allowfullscreen", "");

    embed.classList.add(section.contenttype);

    if (section.link.indexOf("autoplay=1") == -1) embed.src = section.link;

    overlay.body.appendChild(embed);

    let trigger = document.createElement("a");
    trigger.classList.add(`embed-${section.contenttype}`);
    trigger.textContent = section.byline;

    trigger.addEventListener("click", function(e) {
        e.preventDefault();
        if (!embed.src) overlay.addEventListener("shown.bs.modal", () => embed.src = section.link)
        overlay.show();
    })

    return trigger;
}

export function popupRenderer(section) {

    let modal = this.createModal();
    modal.size = section.size;
    modal.id = `popup-${section.name}`

    modal.title.textContent = section.title? section.title: "";
    section.content.forEach(s => this.render(s).then(node => modal.body.appendChild(node)));
    modal.footer.innerHTML = "<button type='button' class='btn btn-primary'>Close</button>";
    modal.footer.querySelector("button").addEventListener("click", () => modal.hide());

    return modal.__node;
}

export function popupTriggerRenderer(section) {
    let trigger = document.createElement("a");
    trigger.classList.add("popup-trigger");
    trigger.textContent = section.linktext;

    trigger.addEventListener("click", function(e) {
        e.preventDefault(); e.stopPropagation();
        bootstrap.Modal.getInstance(document.querySelector(`#popup-${section.name}`)).show()
    })

    return trigger;
}


export function blockquoteRenderer(section) {
    const figure = document.createElement("figure");
    figure.setAttribute("class", "quote ms-4 ps-4");
    const quote = document.createElement("blockquote");
    if (section.source) quote.setAttribute("cite", section.source);

    const p = document.createElement("p");
    p.innerText = section.text;
    quote.appendChild(p);

    figure.appendChild(quote);

    if (section.citation) {
        const cite = document.createElement("figcaption");
        cite.setAttribute("class", "blockquote-footer mt-2");
        cite.innerText = section.citation;
        figure.appendChild(cite)
    }

    return figure;

}

export function alertRenderer(section) {
    let holder = document.createElement("section");
    holder.classList.add(section.class);
    section.content.forEach(s => this.render(s).then(node => holder.appendChild(node)));
    return holder;
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

            modal.title.textContent = "Set New Goal";

            let form = modal.body.appendChild(document.createElement("form"));
            form.setAttribute("id", "goal-setup-form");
            let list = form.appendChild(document.createElement("datalist"));
            schema.activity.forEach(i => list.insertAdjacentHTML("beforeend", `<option>${i}</option>`))
            list.insertAdjacentHTML("beforeend", `<option value="type-own">Something else...</option>`)

            let daysInput = schema.frequency.map(f => `<input class="form-check-input" type="radio" name="frequency" id="frequency-${f}" value="${f}"><label class="form-check-label" for="frequency-${f}">${f}</label>`).join("");
   
            form.appendChild(document.createElement("p")).innerHTML = `<label>Activity: </label> <select class='form-control w-50 d-inline-block my-2' name='activity' placeholder='choose an activity' autocomplete='off'></select><br>
            <span id="activity-other-wrapper" hidden><label>Write your own here:</label><input type="text" name="activity-other" class='form-control w-50 d-inline-block my-2' ></span><br>`;

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
                <p>You can always see your goals by clicking <strong>My Goals</strong> on the ${section.goaltype == "activity"? "Being Active": "Healthy Eating"} homepage.</p>
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


export function accordionRenderer(section) {
    
    const randomID =  Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);

    const accordion = document.createElement("div");
    accordion.setAttribute("class","accordion mt-4 mb-5");
    accordion.setAttribute("id", "accordion-" + randomID)

    let index = 0;

    section.content.forEach(item => {
        switch (item.type) {
            default:
                throw `DataError: expected type "accordion-item", received type "${item.type}"`;
                break;
            case "accordion-item":
                const holder = document.createElement("div");
                holder.classList.add("accordion-item", "mb-2");

                const header = document.createElement("h2");
                header.setAttribute("id", "header-" + index);
                header.setAttribute("class", "accordion-header");

                const headerButton = document.createElement("button");
                headerButton.setAttribute("class", "accordion-button collapsed");
                headerButton.setAttribute("type", "button");
                headerButton.setAttribute("data-bs-toggle", "collapse");
                headerButton.setAttribute("data-bs-target", "#collapse-" + randomID + "-" + index);
                headerButton.setAttribute("aria-controls", "collapse-" + index);
                headerButton.innerText = item.header;

                header.appendChild(headerButton);

                const collapse = document.createElement("div");
                collapse.setAttribute("id", "collapse-" + randomID + "-" + index);
                collapse.setAttribute("class", "accordion-collapse collapse");
                collapse.setAttribute("aria-labelledby", "header-" + index);
                collapse.setAttribute("data-bs-parent", "#accordion-" + randomID);

                const body = document.createElement("div");
                body.setAttribute("class", "accordion-body");

                this.render({ type: "container", content: item.content}).then(node => body.appendChild(node));

                collapse.appendChild(body);
                holder.appendChild(header);
                holder.appendChild(collapse);
                accordion.appendChild(holder);

                break;
        }

        index++;
    })

    return accordion;

}



export function menuRenderer(section) {
    const holder = document.createElement("div");
    holder.setAttribute("class", "row row-cols-xl-3 row-cols-2 row-cols-sm-1 g-3 mt-3 nav-normal");

    section.content.forEach(item => {
        if (item.type != "menu-item") throw `DataError: expected type "menu-item", received type "${item.type}"`;
        this.render(item).then(node => holder.appendChild(node));
    });
    return holder;
}

export function menuItemRenderer(section) {
    const holder = document.createElement("div");
    holder.setAttribute("class", "d-block col");

    const card = document.createElement("a");
    card.setAttribute("class", "d-block card submenu h-100");
    card.setAttribute("href", section.link);

    const cardBody = document.createElement("div");
    cardBody.setAttribute("class", "card-body");

    const cardTitle = document.createElement("h5");
    cardTitle.setAttribute("class", "card-title fw-normal");
    if (section.title.indexOf("&") > -1) {
        cardTitle.innerHTML = section.title; // assuming we have & due to html entities
    } else {
        cardTitle.textContent = section.title;
    }
    cardBody.appendChild(cardTitle);
    card.appendChild(cardBody);
    holder.appendChild(card);
    
    if (section.icon && section.icon != "none") {
        const icon = document.createElement("img");
        fetch(`/app/resources/${section.icon}`)
            .then(response => response.json())
            .then(resource => {
                icon.setAttribute("src", resource.source);
                card.style.backgroundImage = "url('" + resource.source + "')"; ;
            })
    }
    
    return holder;
}



export async function fillInBoxRenderer(section) {
    if (section.type != "fillin") return null;
    
    section.path = section.path || this.path;

    let holder = document.createElement("section");
    holder.classList.add("fill-in", section.boxsize);
    let form = holder.appendChild(document.createElement("form"));
    form.innerHTML = section.boxsize == "small"? 
            `<input type="text" name="response" data-fillin-name="${section.name}" class="form-control shadow-hover"><input type="submit" value="Save" class="btn btn-primary">`:
            section.boxsize == "large"?
                `<textarea name="response" data-fillin-name="${section.name}" rows="5" cols="40" class="form-control shadow-hover"></textarea><input type="submit" value="Save" class="btn btn-primary">`:
                console.log("Unknown boxsize:", section.boxsize);

    form.addEventListener("submit", e => {
        e.preventDefault();

        let fillin = { path: section.path, name: section.name, response: form.elements['response'].value }
        this.post("/myapp/fillins/", fillin)
    })

    await fetch(`/myapp/fillins?path=${encodeURIComponent(section.path)}&name=${section.name}`)
    .then(response => response.json())
    .then(details => {
        form.querySelector("[name='response']").value = details.response;
    })

    return holder;
}

export function describedMenuRenderer(section) {
    const holder = document.createElement("div");
    holder.setAttribute("class", "row g-3 mt-3 nav-described");

    section.content.forEach(item => {
        if (item.type != "described-menu-item") throw `DataError: expected type "menu-item", received type "${item.type}"`;
        this.render(item).then(node => holder.appendChild(node));
    });
    return holder;
}

export async function describedMenuItemRenderer(section) {
    const holder = document.createElement("div");
    holder.setAttribute("class", "col-12 row");

    const md = await this.render(section.description);
    md.classList.add("col-8", "col-md-9", "col-xl-10");
    holder.appendChild(md);

    const card = document.createElement("a");
    card.classList.add("d-block", "card", "col-4", "col-md-3", "col-xl-2");
    card.setAttribute("href", section.link);

    const cardBody = document.createElement("div");
    cardBody.setAttribute("class", "card-body");

    const cardTitle = document.createElement("h5");
    cardTitle.setAttribute("class", "card-title fw-normal");
    if (section.title.indexOf("&") > -1) {
        cardTitle.innerHTML = section.title; // assuming we have & due to html entities
    } else {
        cardTitle.textContent = section.title;
    }
    cardBody.appendChild(cardTitle);
    card.appendChild(cardBody);
    holder.appendChild(card);
    
    return holder;
}

export async function thoughtsRenderer(section) {
    if (section.type != "thoughts") return null;

    if (!section.path) section.path = this.path;

    let holder = document.createElement("section");
    holder.classList.add("thoughts-box", "so-alert");

    let thoughts = section.thoughts || await fetch(`/myapp/mythoughts?path=${encodeURIComponent(section.path)}`).then(response => response.json());

    holder.insertAdjacentHTML("afterbegin", "<header><span>Critical, negative thoughts</span><span>&nbsp;</span><span>Supportive, neutral thoughts</span></header>")

    holder.insertAdjacentHTML("beforeend", "<footer><button type='button' id='add-thought' class='btn btn-primary'>Add more thoughts</button><button type='button' id='save-thoughts' class='btn btn-primary' disabled>Save</button></footer>")
    
    let rowtemplate = "<input type='text' name='negative'><span>&#10148</span><input type='text' name='positive'>"

    const addrow = () => {
        let form = document.createElement("form");
        form.innerHTML = rowtemplate;
        holder.querySelector("footer").insertAdjacentElement("beforebegin", form);
    }
    holder.addEventListener("change", () => holder.querySelector("#save-thoughts").removeAttribute("disabled"))

    holder.querySelector("#add-thought").addEventListener("click", addrow);
    holder.querySelector("#save-thoughts").addEventListener("click", e => {
        let allthoughts = Array.from(holder.querySelectorAll("form")).filter(f => f.elements['negative'].value && f.elements['positive'].value).map(f => { return { negative: f.elements['negative'].value, positive: f.elements['positive'].value}; });
        this.post("/myapp/mythoughts/", { path: section.path, details: allthoughts});
        e.target.setAttribute("disabled", "");
    })

    if (thoughts) {
        holder.hasThoughts = true;
        thoughts.forEach(t => {
            addrow();
            let form = holder.querySelector("form:last-of-type");
            form.elements['negative'].value = t.negative;
            form.elements['positive'].value = t.positive;
        })
    }

    while (holder.querySelectorAll("form").length < 3) {
        addrow();
    }

    return holder;
}