import { renderProfiler } from "./renderers/profiler.js";

async function init_page() {
    const path = location.hash && location.hash.length > 1? location.hash: "#home";

    const section = await loadSection(path);

    console.log(section);

    document.querySelector("title").innerText = document.getElementById("page-title").innerText = section.title;

    var app = document.getElementById("main-container");
    while (app.firstChild) app.removeChild(app.lastChild);
    section.content.forEach(c => app.appendChild(render(c)));
}

async function loadSection(path) {
        
        let page = JSON.parse(localStorage.getItem("SWEET"));
        const url = `/app/content?path=${encodeURIComponent(path)}`
        let section = await fetch(url).then(response => response.json());

        const pathslugs = path.substr(1).split("/");
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

function create_modal() {
    let modal = new DOMParser().parseFromString(`
    <div class="modal fade" tabindex="-1" aria-labelledby="modalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalLabel"></h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
            </div>
            <div class="modal-footer">
            </div>
        </div>
        </div>
    </div>
    `, 'text/html').body.firstElementChild;

    document.body.appendChild(modal);
    bs = new bootstrap.Modal(modal);

    return {
        get title() { return modal.querySelector(".modal-title")},
        get body() { return modal.querySelector(".modal-body")},
        get footer() { return modal.querySelector(".modal-footer")},
        set size(v) {modal.querySelector(".modal-dialog").classList.add(`modal-${v}`)},
        show: function() { bs.show() },
        hide: function(destroy=false) { bs.hide(); if (destroy) modal.remove(); }
    };
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
    } else if (section.type=="homepage-menu") {
        return render_home_menu(section);
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


function render_sepicker() {
    let holder = document.body.appendChild(create_modal());
    holder.$size = 'lg';

    holder.addEventListener('hidden.bs.modal', function() {
        holder.remove();
    })
    holder.classList.add("side-effect")

    holder.$title.textContent = "Record a Side Effect";
    holder.$body.innerHTML = `
    <select name="setype"><option>Please select a side-effect to continue...</option></select>
    `
    holder.$footer.innerHTML = "<button id='se-close'>Cancel</button>"

    holder.querySelector("#se-close").addEventListener("click", e => {
        holder.$$.hide();
    })

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
            s.remove();
            render_se({type: s.value}, holder)
        })
    })

    holder.$$.show();
}

function render_se(section, holder) {

    let form = document.createElement("form")
    form.setAttribute("id", `se-${section.type}-details`);
    
    fetch(`/app/schemas/sideeffects/${section.type}`)
    .then(response => response.json())
    .then(schema => {
        holder.$title.textContent = `Recording your ${schema.title}`
        form.innerHTML =  `
            <section>
            <label for="date"> Which ${ schema.frequency } do you wish to record for?</label><span id="dateinput"></span><br />
            <label for="frequency">How frequent were your ${ schema.embedtext }?</label><span><input type="number" id="frequency" name="frequency"> ${ schema.frequency == "week"? `days per week`: `${ schema.embedtext} per day` }</span><br />
            <label for="severity">How bad were your ${ schema.embedtext }?</label><span id="severityinput"></span>
            <label for="impact">How much did your ${ schema.embedtext } impact your daily life?</label><span id="impactinput"></span>
            <label for="notes">Notes: <span class="sidenote">You can use this box to record further details, e.g. the times of day, triggers, things you tried to help</span></label><br />
            <span id="notesinput"><textarea name="notes" id="notes" cols="50" rows="5"></textarea></span>
            </section>
            `

        holder.$body.appendChild(form);

        holder.$footer.innerHTML = `<input type="submit" form="${form.getAttribute("id")}" value="Save details"><button type="button" id="se-form-cancel">Cancel</button>`

        form.querySelector("#severityinput").innerHTML = (() => {
            let opts = [];
            for (let opt of ["mild", "moderate", "severe"]) {
                opts.push(`<input type="radio" hidden id="severity-${opt}" name="severity" value="${opt}"><label for="severity-${opt}">${opt}</label>`)
            }
            return opts.join("");
        })();

        form.querySelector("#impactinput").innerHTML = (() => {
            let opts = [];
            for (let opt of ["a little", "moderately", "a lot"]) {
                opts.push(`<input type="radio" hidden id="impact-${opt}" name="impact" value="${opt}"><label for="impact-${opt}">${opt}</label>`)
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

            c.addEventListener("click", e => {

                src = e.target;
                
                if (src.matches("tbody *")) {
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

        holder.querySelector("#se-form-cancel").addEventListener("click", e => {
            holder.$$.hide();
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
            holder.$$.hide();
        })

    })
}


export { init_page, loadSection, render, render_calendar, render_goals, render_sepicker, render_home_menu, create_modal}