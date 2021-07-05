async function init_page() {
    const path = location.hash && location.hash.length > 1? location.hash: "#home";

    const section = await loadSection(path);

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

const calendarutils = {
    monthnames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    attributise: (d) => `${d.getFullYear()}-${d.getMonth()<9?"0":""}${d.getMonth()+1}-${d.getDate()<10?"0":""}${d.getDate()}`
}


function populateDays(body, basedate=new Date()) {
    let months31 = [0,2,4,6,7,9,11]; // Jan, Mar, May, Jul, Aug, Oct, Dec
    let day1 = new Date(basedate.getFullYear(), basedate.getMonth());
    
    // set rows required to fit current month: 
    // 5 unless 
    //   * 1st is a Sun & it's not Feb
    //   * 1st is a Sat & month has 31 days
    let rows = 5;
    if ((day1.getDay() == 0 && day1.getMonth() != 1) || (day1.getDay() == 6 && months31.includes(basedate.getMonth()))) rows = 6;

    // If the 1st isn't a Monday, start the calendar on the Monday before it;
    if (day1.getDay() != 1) {
        let countback = day1.getDay() == 0? 6: day1.getDay() - 1;
        day1.setDate(day1.getDate() - countback);
    }
    
    body.innerHTML = "";
    for (let w=0; w<rows; w++) {
        let row = body.appendChild(document.createElement("tr"));
        for (let d of [0,1,2,3,4,5,6]) {
            let days = 7*w+d;
            let thisdate = new Date(day1.getFullYear(), day1.getMonth(), day1.getDate() + days);
            let cell = row.appendChild(document.createElement("td"));
            cell.setAttribute("data-thisdate", calendarutils.attributise(thisdate));
        }
    }
}

function populateMonths(body) {
    body.innerHTML = "";
    let months = [["Jan", "Feb", "Mar", "Apr"], ["May", "Jun", "Jul", "Aug"], ["Sep", "Oct", "Nov", "Dec"]]
    for (let block of months) {
        let row = body.appendChild(document.createElement("tr"));
        for (let month of block) {
            let cell = row.appendChild(document.createElement("td"));
            cell.setAttribute("data-thismonth", month);
            cell.textContent = month;
        }
    }
}

function render_calendar(selectedDate=new Date()) {
    let cal = document.createElement("table");
    cal.classList.add("calendar");

    let caption = cal.appendChild(document.createElement("caption"));
    caption.innerHTML = `<section><span class="prev">&lt;</span> <span id="cal-caption" data-basedate="${calendarutils.attributise(selectedDate)}">${calendarutils.monthnames[selectedDate.getMonth()]}</span><span class="next">&gt;</span></section>`;
    let tbody = cal.appendChild(document.createElement("tbody"));
    tbody.dataset.mode = "normal";
    populateDays(tbody, selectedDate);
    cal.querySelector(`[data-thisdate='${calendarutils.attributise(selectedDate)}']`).classList.add("selected");
    
    // prevent calendar from receiving focus:
    cal.addEventListener("mousedown", e => e.preventDefault());

    cal.addEventListener("click", e => {
        src = e.target;

        if (src.matches("caption span, caption span *")) {
            e.preventDefault(); e.stopPropagation();

            // click on span within caption: get the span to determine action:
            while (src.tagName != "SPAN") {
                src = src.parentElement;
            }

            if (src.hasAttribute("id")) {
                // must be the month header, as prev & next don't get assigned ID
                // replace calendar body with months display
                // <awaiting implementation of new month selector below> populateMonths(c.querySelector("tbody"));
            } else {
                let dir = src.classList.contains("prev")? -1: src.classList.contains("next")? 1: 0;
                
                // no id, no prev/next class, someone's been messing with the code!
                if (dir == 0) throw `Unknown span in calendar caption: ${src}`;

                let basedate = new Date(cal.querySelector("#cal-caption").dataset.basedate + "T12:00:00Z");
                basedate.setMonth(basedate.getMonth() + dir);
                populateDays(cal.querySelector("tbody"), basedate);

                cal.querySelector("#cal-caption").textContent = `${calendarutils.monthnames[basedate.getMonth()]} ${basedate.getFullYear()}`;
                cal.querySelector("#cal-caption").dataset.basedate = calendarutils.attributise(basedate);

                cal.dispatchEvent(new CustomEvent("redraw"));
            }
        }
    })

    return cal;
}

function render(section, acc_level = 3) {
    if (section.type == "container") {
        const holder = document.createElement("section");
        section.content.forEach(item => holder.appendChild(render(item, acc_level)));
        return holder;
    } 
    else if (section.type == "menu") {
        const holder = document.createElement("nav");
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
        const quote = document.createElement("blockquote");
        if (section.source) quote.setAttribute("cite", section.source);

        const p = document.createElement("p");
        p.innerText = section.text;
        quote.appendChild(p);

        if (section.citation) {
            const cite = document.createElement("cite");
            cite.innerText = section.citation;
            quote.appendChild(cite)
        }

        return quote;
    } 
    else if (section.type == "menu-item") {
        const holder = document.createElement("a");
        holder.setAttribute("href", section.link);

        const label = document.createElement("label");
        if (section.title.indexOf("&") > -1) {
            label.innerHTML = section.title; // assuming we have & due to html entities
        } else {
            label.textContent = section.title;
        }
        holder.appendChild(label);
        
        if (section.icon && section.icon != "none") {
            const icon = document.createElement("img");
            icon.setAttribute("class", "icon")
            holder.appendChild(icon);
            fetch(`/app/resources/${section.icon}`)
                .then(response => response.json())
                .then(resource =>  icon.setAttribute("src", resource.source))
        }
        
        return holder;

    } 
    else if (section.type == "accordion") {
        const accordion = document.createElement("section");
        accordion.classList.add("accordion");

        section.content.forEach(item => {
            switch (item.type) {
                default:
                    throw `DataError: expected type "accordion-item", received type "${item.type}"`;
                    break;
                case "accordion-item":
                    const holder = document.createElement("article");
                    holder.classList.add("item")
                    holder.classList.add("closed");

                    const header = document.createElement("header");
                    const heading = document.createElement("h".concat(acc_level))
                    heading.innerText = item.header;
                    header.appendChild(heading);
                    header.addEventListener("click", clk => {
                        if (holder.classList.contains("closed")) {
                            accordion.querySelectorAll("article.item").forEach(e => {
                                e.classList.add("closed")
                            });
                            holder.classList.remove("closed"); 
                            //src.nextSibling.scrollIntoView({ behaviour: "smooth", block: "start"});
                            //document.querySelector("html").scrollTop -= 120;
                        } else {
                            holder.classList.add("closed");
                        }
                    })
                    holder.appendChild(header);
                    holder.appendChild(render({ type: "container", content: item.content}, acc_level + 1));

                    accordion.appendChild(holder);
                    break;
            }
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
    holder.classList.add("goalsetter");

    let isodate = function(d) { return d.toISOString().substr(0,10) }

    let newgoaltemplate = "<h1 class='newgoal'>Set A New Goal</h1>";
    let newgoalhandler = function(e) {
        e.preventDefault();
        this.removeEventListener("click", newgoalhandler);

        // load appropriate schema
        fetch(`/app/schemas/goals/${section.goaltype}`)
        .then(response => response.json())
        .then(schema => {
        // set up form
            this.classList.add("popover");
            document.querySelector("#modal-cover").classList.add("show");
            let goal;

            let form = this.appendChild(document.createElement("form"));
            let list = form.appendChild(document.createElement("datalist"));
            list.setAttribute("id", "activity");
            schema.activity.forEach(i => list.insertAdjacentHTML("beforeend", `<option>${i}</option>`))
            let daysinput = schema.frequency.map(f => `<input type="radio" name="frequency" id="frequency-${f}" value="${f}"><label for="frequency-${f}">${f}</label>`).join("");
            let minutesinput = schema.duration.map(f => `<input type="radio" name="duration" id="duration-${f}" value="${f}"><label for="duration-${f}">${f}</label>`).join("");
            
            let fields = form.appendChild(document.createElement("section"));
            fields.appendChild(document.createElement("p")).innerHTML = "I will do some <input type='text' name='activity' list='activity' placeholder='choose an activity or type your own'> this week.";
            fields.appendChild(document.createElement("p")).innerHTML = `I will do it on ${daysinput} days.`;
            fields.appendChild(document.createElement("p")).innerHTML = `I will do it for <input name='dur_oth' type='number' placeholder='' min='0' max='120'> minutes each day.`;
            form.insertAdjacentHTML("beforeend", '<p><input type="submit" value="Next" /><button name="cancel">Cancel</button></p>')
            form.querySelector("[name='dur_oth']").addEventListener("input", e => {
                form.querySelectorAll("[name='duration']:checked").forEach(r => r.checked = false);
            })
            form.querySelectorAll("[name='duration']").forEach(r => r.addEventListener("change", e => {
                if (e.target.checked) {
                    form.querySelector("[name='dur_oth']").value = "";
                }
            })
            )
            form.querySelector("button").addEventListener("click", e => {
                e.stopPropagation(); e.preventDefault();
                this.innerHTML = newgoaltemplate;
                this.addEventListener("click", newgoalhandler);

                this.classList.remove("popover");
                document.querySelector("#modal-cover").classList.remove("show");

            })
            form.addEventListener("submit", e => {
                e.preventDefault();

                goal = {
                    goaltype: 'activity',
                    status: 'active',
                    reviewDate: isodate(((d) => { d.setDate(d.getDate()+7); return d;})(new Date())),
                    detail: form.elements['activity'].value,
                    days: form.elements['frequency'].value,
                    minutes: form.elements['dur_oth'].value,

                }

                this.innerHTML = `
                <h3>You're ready to set a new goal for the next week!</h3>
                <section>
                <p>You can always see your goals by clicking <strong>My Goals</strong> on the Being Active homepage.</p>
                <p>In one week, you can come back to review your goal and to get a feedback message.</p>
                <p>You may want to stick a reminder somewhere in your house.</p>
                <p>Your goal is: to do some <strong>${goal.detail}</strong> on <strong>${goal.days} days</strong> this week, for <strong>${goal.minutes} minutes</strong> per day.</p>
                </section>
                <button name="back">Back</button><button name="save">Save</button>`
                this.querySelector("[name='back']").addEventListener("click", () => {
                    this.innerHTML = "";
                    this.appendChild(form);
                    goal = undefined;
                });
                this.querySelector("[name='save']").addEventListener("click", () => {
                    fetch("/app/mygoals/", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(goal)
                    }).then(response => response.json())
                    .then(outcome => {
                        if (outcome.status == "error") {
                            this.innerHTML = `<p>We were not able to save your new goal. The error message was:</p>
                            <p class="error">${outcome.message}</p>
                            <button>OK</button>`;
                            this.querySelector("button").addEventListener("click", e => {
                                e.stopPropagation();

                                this.innerHTML = newgoaltemplate;
                                this.addEventListener("click", newgoalhandler);

                                this.classList.remove("popover");
                                document.querySelector("#modal-cover").classList.remove("show");
                            })
                            return;
                        }
                        this.innerHTML = "";
                        let summary = this.appendChild(document.createElement("label"));
                        summary.classList.add("goal-summary");
                        summary.innerHTML = `My goal: to do some <strong>${goal.detail}</strong> on <strong>${goal.days} days</strong> this week, for <strong>${goal.minutes} minutes</strong> per day.`;

                        this.classList.add("active");
                        // show the review date:
                        let reviewdate = this.appendChild(document.createElement("span"));
                        reviewdate.classList.add("goal-date");
                        reviewdate.textContent = `Review on: ${new Date(Date.parse(goal.reviewDate)).toLocaleDateString()}`;

                        this.classList.remove("popover");
                        document.querySelector("#modal-cover").classList.remove("show");
                    }).catch(e => console.log(e))
                })
            })
        })
    }

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
            outer.classList.add("goal");

            let today = isodate(new Date());

            let summary = outer.appendChild(document.createElement("label"));
            summary.classList.add("goal-summary");
            summary.innerHTML = `<section><strong>My goal:</strong><br />to do some <strong>${goal.detail}</strong> on <strong>${goal.days} days</strong> this week, for <strong>${goal.minutes} minutes</strong> per day.`;

            if (goal.reviewDate <= today) {
                outer.classList.add("review");
                
                // create a review button
                let review = outer.appendChild(document.createElement("h3"));
                review.classList.add("goal-review");
                review.textContent = "Review this goal";
                outer.addEventListener("click", function outerclick(e) {
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
                    outer.removeEventListener("click", outerclick);
                })
            } else {
                outer.classList.add("active");
                // show the review date:
                let reviewdate = outer.appendChild(document.createElement("h4"));
                reviewdate.classList.add("goal-date");
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

function render_sepicker() {
    let holder = document.body.appendChild(document.createElement("div"));
    holder.classList.add("popover")
    holder.classList.add("side-effect")
    document.querySelector("#modal-cover").classList.add("show");
    holder.innerHTML = `<h3>Record your Side Effects</h3>
    <select name="setype"><option>Please select a side-effect to continue...</option></select>
    <button id="se-close">Close</button>
    `
    fetch("/app/schemas/sideeffects")
    .then(response => response.json())
    .then(schemas => {
        const s = holder.querySelector("[name='setype']");
        schemas.types.forEach(t => {
            s.insertAdjacentHTML("beforeend", `<option value="${t.name}">${t.description}</option>`)
        });

        s.addEventListener("change", e => {
            e.stopPropagation();
            while(s.nextSibling) s.nextSibling.remove();
            holder.appendChild(render_se({type: s.value}))
        })
    })
}
function render_se(section) {
    let form = document.createElement("form")
    form.setAttribute("id", `se-${section.type}-details`);
    
    fetch(`/app/schemas/sideeffects/${section.type}`)
    .then(response => response.json())
    .then(schema => {
        form.innerHTML =  `
            <h4>Recording your ${schema.title}</h4>
            <section>
            <label for="date"> Which ${ schema.frequency } do you wish to record for?</label><span id="dateinput"></span><br />
            <label for="frequency">How frequent were your ${ schema.embedtext }?</label><span><input type="number" id="frequency" name="frequency"> per ${ schema.frequency }</span><br />
            <label for="severity">How bad were your ${ schema.embedtext }?</label><span id="severityinput"></span>
            <label for="impact">How much did your ${ schema.embedtext } impact your daily life?</label><span id="impactinput"></span>
            <label for="notes">Notes: <span class="sidenote">You can use this box to record further details, e.g. the times of day, triggers, things you tried to help</span></label><br />
            <span id="notesinput"><textarea name="notes" id="notes" cols="80" rows="10"></textarea></span>
            </section>
            <input type="submit" value="Save details"><button type="button" id="se-form-cancel">Close without saving</button>
        `

        form.querySelector("#severityinput").innerHTML = (() => {
            let opts = [];
            for (let opt of ["mild", "moderate", "severe"]) {
                opts.push(`<input type="radio" class="hidden" id="severity-${opt}" name="severity" value="${opt}"><label for="severity-${opt}">${opt}</label>`)
            }
            return opts.join("");
        })();

        form.querySelector("#impactinput").innerHTML = (() => {
            let opts = [];
            for (let opt of ["a little", "moderately", "a lot"]) {
                opts.push(`<input type="radio" class="hidden" id="impact-${opt}" name="impact" value="${opt}"><label for="impact-${opt}">${opt}</label>`)
            }
            return opts.join("");
        })();


        form.querySelector("#dateinput").append(...(() => {
            let d = document.createElement("input");
            d.setAttribute("type", "text");
            d.setAttribute("readonly", "");
            d.classList.add("datetext");
            d.setAttribute("name", "date")

            let c = render_calendar();
            c.classList.add(schema.frequency);

            c.addEventListener("redraw", e => {
                c.querySelectorAll("td").forEach(td => {
                    td.textContent = td.dataset.thisdate.substring(8)
                    if (td.dataset.thisdate.substring(0,7) != c.querySelector("#cal-caption").dataset.basedate.substring(0,7)) {
                        td.classList.add("faded");
                    }
                })
            })

            c.dispatchEvent(new CustomEvent("redraw"));

            if (schema.frequency == "week") {
                c.querySelector("td.selected").parentElement.classList.add("selected");
                c.querySelector("td.selected").classList.remove("selected");
            }
            // preventing default on mousedown will stop clicking on the calendar taking focus away from 
            // the text input, allowing us to respond to its focus status for styling.
            c.addEventListener("click", e => {

                src = e.target;
                
                if (src.matches("tbody *") && c.querySelector("tbody").dataset.mode == "select") {
                    e.preventDefault(); e.stopPropagation();
                    // click on table should select day or week based on schema,

                    // first remove any existing selection:
                    c.querySelectorAll(".selected").forEach(e => e.classList.remove("selected"))
                    
                    // select the apppropriate row or cell and update the input dataset and value;
                    // the dataset values will be submitted via fetch/json while the value will be
                    // visible to the user.
                    if (schema.frequency == "week") {
                        while (src.tagName != "TR") src = src.parentElement;

                        src.classList.add("selected");
                        d.dataset.datefrom = src.querySelector("td").dataset.thisdate;
                        d.dataset.dateto = Array.from(src.querySelectorAll("td"), td => td.dataset.thisdate).filter((e,i,a) => i == a.length -1).join("");
                        d.value = `${new Date(d.dataset.datefrom).toLocaleDateString()} to ${new Date(d.dataset.dateto).toLocaleDateString()}`;
                        d.blur();
                    } else {
                        while (src.tagName != "TD") src= src.parentElement;
                        src.classList.add("selected");

                        d.dataset.date = src.dataset.thisdate;
                        d.value = new Date(src.dataset.thisdate).toLocaleDateString();
                        d.blur();
                    }
                }
            })


            return [d,c];
        })())

        form.querySelector("#se-form-cancel").addEventListener("click", e => {
            form.parentElement.remove();
            document.querySelector("#modal-cover").classList.remove("show");
            return false;
        })
    
        // fetch already completed inputs and set up datpicker validation
        fetch(`/app/mydiary/sideeffects/${section.type}`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
        })
    })

    form.addEventListener("submit", e => {
        e.preventDefault(); e.stopPropagation();

        let sideeffect = {
            type: section.type,
            datefrom: form.elements['date'].dataset.date? form.elements['date'].dataset.date: form.elements['date'].dataset.datefrom,
            dateto: form.elements['date'].dataset.date? form.elements['date'].dataset.date: form.elements['date'].dataset.dateto,
            frequency: form.elements['frequency'].value,
            severity: form.elements['severity'].value,
            impact: form.elements['impact'].value,
            notes: form.elements['notes'].value
        }

        fetch("/app/mydiary/sideeffects/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(sideeffect)
        }).then(() => {
            form.parentElement.remove();
            document.querySelector("#modal-cover").classList.remove("show");
            return false;
        })

    })

    return form;
}