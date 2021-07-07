async function init_page() {
    const path = location.hash && location.hash.length > 1? location.hash: "#home";

    const section = await loadSection(path);

    console.log(section);

    document.querySelector("title").innerText = document.getElementById("page-title").innerText = section.title;

    const breadcrumb = document.getElementById("breadcrumb");
    while (breadcrumb.firstChild) breadcrumb.removeChild(breadcrumb.lastChild);

    section.tree.forEach(step => {
        let a = document.createElement("a");
        a.setAttribute("href", step.path);
        a.innerText = step.title;
        breadcrumb.appendChild(a);
    })

    var app = document.getElementById("main-container");
    while (app.firstChild) app.removeChild(app.lastChild);
    section.content.forEach(c => app.appendChild(render(c)));
}

async function loadSection(path) {
        
        let page = JSON.parse(localStorage.getItem("SWEET"));
        const url = `/app/content?path=${encodeURIComponent(path)}`
        let section = await fetch(url).then(response => response.json());

        pathslugs = path.substr(1).split("/");
        let slug = pathslugs.shift();
        page = page[slug];
        const tree = [];
        let treepath = "#".concat(slug);
        tree.push({"path": treepath, "title": page.title})

        while (pathslugs.length > 0) { 
            slug = pathslugs.shift();
            page = page["pages"].filter(p => p.slug == slug)[0]
            treepath = treepath.concat("/", slug);
            tree.push({"path": treepath, "title": page.title});
        }
        
    return { "title": section.title, "content": section.content, "tree": tree};
}

function render(section, acc_level = 3) {
    if (section.type == "container") {
        const holder = document.createElement("section");
        section.content.forEach(item => holder.appendChild(render(item, acc_level)));
        return holder;
    } 
    else if (section.type == "menu") {
        const holder = document.createElement("div");
        holder.setAttribute("class", "row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 mt-3");
        holder.addEventListener("click", ce => {
/*                        var src = ce.target;
                while(src.tagName.toLowerCase() != "a" && src.parentNode) {
                    src = src.parentNode;
                }

                if (src.tagName.toLowerCase() != "a") return;

                if (src.getAttribute("href").indexOf("#")  > -1) {
                    history.pushState()
                    loadSection(path);
                        ce.preventDefault();
                    }
                }
            */                    })
        section.content.forEach(item => {
            if (item.type != "menu-item") throw `DataError: expected type "menu-item", received type "${item.type}"`;
            holder.appendChild(render(item));
        });
        return holder;
    } 
    else if (section.type == "header") {
        const header = document.createElement("h".concat(section.level));
        header.innerText = section.text;
        return header;
    } 
    else if (section.type == "paragraph") {
        const p = document.createElement("p");

        if (section.content) {
            section.content.forEach(s => p.appendChild(render(s)));
        } else if (section.formats) {
            const formats = section.formats.split(section.separator);
            const texts = section.text.split(section.separator);

            for(let i=0;i<formats.length;i++) {
                let temp;
                switch (formats[i]) {
                    default:
                        temp = document.createTextNode(texts[i]);
                        break;
                    case "b":
                        temp = document.createElement("strong");
                        temp.innerText = texts[i];
                        break;
                    case "i":
                        temp = document.createElement("em");
                        temp.innerText = texts[i];
                        break;
                }
                p.appendChild(temp);
            }
        } else {
            p.innerText = section.text;
        }
        return p; 
    } 
    else if (section.type == "block-quote") {
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
    else if (section.type == "menu-item") {
        const holder = document.createElement("div");
        holder.setAttribute("class", "d-block col");

        const card = document.createElement("a");
        card.setAttribute("class", "d-block card shadow pb-5 h-100");
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
    else if (section.type == "accordion") {

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
                    holder.setAttribute("class", "accordion-item");

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

                    body.appendChild(render({ type: "container", content: item.content}, acc_level + 1))

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
    else if (section.type == "form") {
        let holder = render({type: "container", content: []});
        // create form & set attrs
        render_form(section, holder);

        return holder;
    } else if (section.type == "link") {
        let a = document.createElement("a");
        a.setAttribute("href", section.link);
        a.textContent = section.text? section.text: section.link;
        return a;
    } else if (section.type == "alert") {
        let holder = document.createElement("section");
        holder.classList.add("alert");
        let h = holder.appendChild(document.createElement("h4"));
        h.textContent = section.heading;
        section.content.forEach(s => holder.appendChild(render(s)));
        return holder;
    } else if (section.type == "list") {
        let tag = section.subtype == "bullets"? "ul": "ol";
        let list = document.createElement(tag);
        section.items.forEach(i => {
            item = list.appendChild(document.createElement("li"));
            item.appendChild(render(i));
        });
        return list;
    } else if (section.type=="external") {
        let overlay = document.createElement("section");
        overlay.classList.add("overlay");

        let warning = overlay.appendChild(document.createElement("header"));
        let close = warning.appendChild(document.createElement("button"));
        close.textContent = "return to app";
        close.classList.add("close-button");
        close.addEventListener("click", function(e) {
            overlay.remove();
        });

        let warnheading = warning.appendChild(document.createElement("h1"));
        warnheading.textContent = "You are currently viewing external content";
        warnheading.classList.add("warning");

        let holder = overlay.appendChild(document.createElement("article"));

        let heading = holder.appendChild(document.createElement("h2"));
        heading.textContent = section.title;

        let byline = holder.appendChild(document.createElement("p"));
        byline.textContent = section.byline;

        let embed = document.createElement("iframe");

        switch (section.source) {
            case "youtube":
                embed.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
                embed.setAttribute("allowfullscreen", "");
                break;

        }

        embed.src = section.link;
        holder.appendChild(embed);

        let trigger = document.createElement("a");
        trigger.classList.add(section.source);
        trigger.textContent = section.byline;

        trigger.addEventListener("click", function(e) {
            e.preventDefault();
            document.querySelector("#app-main").appendChild(overlay);
        })

        return trigger;
    } else if (section.type == "markdown") {
        let holder = document.createDocumentFragment();
        let temp = document.createElement("section");
        if (section.encoding == "lz-string:UTF16") {
            temp.innerHTML = marked(LZString.decompressFromUTF16(section.text));
        } else {
            temp.innerHTML = `<p class="error">Unknown markdown section encoding: ${section.encoding}</p>`;
        }
        holder.append(...temp.childNodes);
        return holder;
    } else if (section.type == "goalsetter") {
        return render_goals(section);
    } else if (section.type) {
        console.log("Unknown Section type: ", section.type);
        return document.createTextNode("");
    } else {
        return document.createTextNode(section + " ");
    }
}

function render_form(section, holder) {
    fetch(section.schemaurl)
    .then(response => response.json())
    .then(schemas => {
        if (schemas[section.name].summary) section.questions = schemas[section.name].summary;
        else section.questions = schemas[section.name];
        // add a form to the container
        let form = holder.appendChild(document.createElement("form"));
        form.setAttribute("id", section.name);
        form.addEventListener("submit", s => {
            s.preventDefault();

            // actually use ajax-y submission here!
            alert("Diary entry submitted.");

            if (section.aftersubmit) {
                let app = document.querySelector("#main-container");
                while(app.firstChild) app.removeChild(app.lastChild);

                let aftersection = {
                    type: "container",
                    content: section.aftersubmit
                };

                app.appendChild(render(aftersection));
            }
        });
        //form._questions = section.questions;

        // add a summary table to the container
        let summary = holder.appendChild(document.createElement("table"));
        summary.classList.add("hidden");
        
        let row = summary.appendChild(document.createElement("tr"));
        row.appendChild(document.createElement("th")).textContent = "Question:";
        row.appendChild(document.createElement("th")).textContent = "Your Answer:";

        // add a fieldset to the container
        let question = holder.appendChild(document.createElement("fieldset"));

        let button = holder.appendChild(document.createElement("input"));
        button.setAttribute("type", "button");
        button.setAttribute("value", "Next");
        // add an event listener to container;

        let currentq = 0;
        holder.addEventListener("click", c => {
            c.stopPropagation();

            let src = c.target;
            if(!src.matches("input[type='button']")) return;

            if(src.value.toLowerCase() == "save") {
                form.dispatchEvent(new SubmitEvent("submit", {submitter: src}));
            } else if(src.value.toLowerCase() == "next") {
                let input = c.currentTarget.querySelector(`#q${currentq}`);

                section.questions[currentq].response = input.value;

                /*/ add hidden input to form &
                // summary to table
                record(input.name, input.value);
                */

                currentq++;

                if (currentq == section.questions.length) {
                    src.setAttribute("value", "Save");
                    //src.setAttribute("type", "submit");
                    src.setAttribute("form", form.getAttribute("id"));

                    holder.insertBefore(document.createElement("h4"), summary).textContent = "Review your anwsers:";

                    section.questions.forEach(q => {
                        let question = q.text;
                        let answer = ""; 
                        if (q.datatype == "picklist") {
                            // single response picklist
                            if (q.response.startsWith("[")) {
                                // indicator of value typed into 'other' text
                                answer = q.response.substr(1,q.response.length - 2);
                            } else {
                                answer = q.options.filter(o => o.value = q.response)[0].description;
                            }
                        } else if (q.datatype == "pickmany") {
                            answer = [];
                            q.response.split(";").forEach(v => {
                                console.log(v);
                                if (v.startsWith("[")) {
                                    // indicator of value typed into 'other' text
                                    answer.push(v.substr(1,v.length - 2));
                                } else {
                                    answer.push(q.options.filter(o => o.value == v)[0].description);
                                }
                            });
                            answer = answer.join("; ");
                        } else if(q.datatype == "range" && q.labels) {
                            answer = q.labels[q.response];
                        } else {
                            answer = q.response;
                        }
                        summarise(question, answer);
                    })

                    summary.classList.remove("hidden");
                    question.classList.add("hidden");
                } else {
                    question.innerHTML = "";
                    question.append(...buildinput(section.questions[currentq]));
                }
            }
        })

        // internal helper methods:
        const buildinput = (q) => {
            let legend = document.createElement("legend");
            legend.textContent = `Question ${currentq + 1} of ${section.questions.length}`;

            let label = document.createElement("label");
            label.textContent = q.text;

            let input = document.createElement("input");;
            switch (q.datatype) {
                case "number":
                case "date":
                case "time":
                case "text":
                    input.setAttribute("type", q.datatype);
                    break;
                case "range":
                    input.setAttribute("type", "range");
                    input.setAttribute("min", q.min || 0);
                    input.setAttribute("max", q.max || 4);
                    input.setAttribute("step", q.step || 1);
                    break;
                case "freetext":
                    input = document.createElement("textarea");
                    break;
                case "picklist":
                case "pickmany":
                    input = picker(q);
                    break;
            }

            input.setAttribute("name", q.name);
            input.setAttribute("id", `q${currentq}`)

            if (q.datatype == "range" && q.labels) {
                let descriptor = document.createElement("label");
                descriptor.textContent = q.labels[input.value];

                input.addEventListener("change", e => {
                    descriptor.textContent = q.labels[input.value];
                })
                return [legend, label, input, descriptor];
            }

            return [legend,label,input];
        }

        const picker = (q) => {
            if (!["picklist","pickmany"].includes(q.datatype)) return;

            let picker = document.createElement("fieldset");
            let type = q.datatype == "pickmany"? "checkbox": "radio";
            if (type=="checkbox") {
                picker.appendChild(document.createElement("p")).textContent = "pick as many options as you need to";
            }
            q.options.forEach(o => {
                let c = document.createElement("input");
                c.setAttribute("type", type);
                c.setAttribute("id", o.value);
                c.setAttribute("value", o.value);

                let l = document.createElement("label");
                l.setAttribute("for", o.value);
                l.textContent = o.description;

                let b = document.createElement("br");
                picker.append(c,l,b);
            })

            if (q.allowother) {
                let c = document.createElement("input");
                c.setAttribute("type", type);

                let l = document.createElement("label");
                l.textContent = "Other (please give details):";

                let t = document.createElement("input");
                t.setAttribute("type", "text");

                let b = document.createElement("br");
                picker.append(c,l,t,b);
            }

            Object.defineProperty(picker, "value", {get: function() {
                    let result = "";
                    let checks = Array.from(this.querySelectorAll("input:checked"));
                    
                    if (checks.length == 1) {
                        if (checks[0].value == "on") {
                            // no specific value set so we must have a check for "other"
                            result = "[" + this.querySelector("input:not([value]) ~ input[type='text']").value + "]";
                        } else {
                            result = checks[0].value;
                        }
                    } else if (checks.length > 1) {
                        result = checks.map(e => {
                            if (e.value == "on") {
                                return "[" + this.querySelector("input:not([value]) ~ input[type='text']").value + "]";
                            } else {
                                return e.value;
                            }
                        }).join(";");
                    }

                    return result;
                }
            })

            return picker;
        }

        const record = (q,a) => {
            let i = form.appendChild(document.createElement("input"));
            i.setAttribute("type", "hidden");
            i.setAttribute("name", q);
            i.setAttribute("value", a);
        }
        const summarise = (q,a) => {
            let r = summary.appendChild(document.createElement("tr"));
            r.appendChild(document.createElement("td")).textContent = q;
            r.appendChild(document.createElement("td")).textContent = a;
        }

        // don't forget to build the first question!
        question.append(...buildinput(section.questions[currentq]));
    })
    // return
    return holder;
}

function render_goals(section) {
    let holder = document.createElement("section");
    holder.setAttribute("class", "row row-cols-1 row-cols-md-3 g-3 mt-3")
    let isodate = function(d) { return d.toISOString().substr(0,10) }

    let newgoaltemplate = `<div class="col"><a class="card goal unset text-center shadow" href="" data-bs-toggle="modal" data-bs-target="#setGoalModal">
            <div class="card-body d-flex justify-content-center">
                <div class="align-self-center">Set a new goal</div>
            </div>
        </a></div>`;

    let newgoalhandler = function() {

        // load appropriate schema
        fetch(`/app/schemas/goals/${section.goaltype}`)
        .then(response => response.json())
        .then(schema => {
        // set up form

            let goal;
            let submitButton = document.getElementById("goal-yes");
            let setGoalWrapper = document.getElementById("setGoalWrapper");

            let form = setGoalWrapper.appendChild(document.createElement("form"));
            form.setAttribute("id", "setGoal");
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

                document.getElementById("setGoalWrapper").innerHTML = `
                <h3 class='w-75 mb-5'>You're ready to set a new goal for the next week!</h3>
                <section>
                <p>You can always see your goals by clicking <strong>My Goals</strong> on the Being Active homepage.</p>
                <p>In one week, you can come back to review your goal and to get a feedback message.</p>
                <p>You may want to stick a reminder somewhere in your house.</p>
                <p>Your goal is: to do some <strong>${goal.detail}</strong> on <strong>${goal.days} days</strong> this week, for <strong>${goal.minutes} minutes</strong> per day.</p>
                </section>
                <button name="back">Back</button><button name="save">Save</button>`
                // this.querySelector("[name='back']").addEventListener("click", () => {
                //     this.innerHTML = "";
                //     this.appendChild(form);
                //     goal = undefined;
                // });
                submitButton.addEventListener("click", () => {
                    fetch("/app/mygoals/", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(goal)
                    }).then(response => response.json())
                    .then(outcome => {
                        if (outcome.status == "error") {
                            document.getElementById("toast-message-type").text("Error");
                            document.getElementById("toast-message").text(`We were not able to save your new goal. ${outcome.message}`);
                            bootstrap.Modal.getInstance(document.getElementById('setGoalModal')).hide();
                            return;
                        }
                        bootstrap.Modal.getInstance(document.getElementById('setGoalModal')).hide();
                        setGoalWrapper.innerHTML = "";

                    }).catch(e => console.log(e))
                })
            })
        })
    }

    // newgoalhandler();

    // get user's active goals
    fetch("/app/mygoals")
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
                review.addEventListener("click", e => {
                    e.stopPropagation();
                    outer.classList.add("popover");
                    document.querySelector("#modal-cover").classList.add("show");
                    let reviewbox = outer.appendChild(document.createElement("div"));
                    reviewbox.insertAdjacentHTML("afterbegin", 
                        `<p>Have you been successful and completed your goal?</p>
                        <div id="review-box-buttons">
                            <button value="y">Yes, Totally</button><button value="p">Yes, Partly</button><button value="n">No, not at all</button>
                        </div>`
                    );
                    reviewbox.querySelector("#review-box-buttons").addEventListener("click", e => {
                        e.stopPropagation();
                        if (e.target.tagName != "BUTTON") {
                            console.log(e.target); return;
                        }

                        goal.status = "complete"; goal.outcome = e.target.value;
                        fetch("/app/mygoals/", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(goal)
                        }).then(response => response.json())
                        .then(outcome => {
                            outer.innerHTML = "";
                            outer.insertAdjacentHTML("afterbegin", "<h3>Thank you for reviewing your goal</h3>")
                            let message = outer.appendChild(document.createElement("p"));
                            message.textContent = outcome.message;
                            let finish = outer.appendChild(document.createElement("button"));
                            finish.classList.add("goal-review-finish");
                            finish.textContent = "Done";
                            finish.addEventListener("click", e => {
                                e.stopPropagation();
                                outer.innerHTML = newgoaltemplate;
                                outer.addEventListener("click", newgoalhandler);
                                outer.classList.remove("popover");
                                document.querySelector("#modal-cover").classList.remove("show");
                            })

                        }).catch(e => {
                            console.log(e);
                            outer.classList.add("popover");
                            document.querySelector("#modal-cover").classList.add("show");
                        })
                    })
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
            // outer.addEventListener("click", newgoalhandler);
        } 
    })

    return holder;
}