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
            icon.setAttribute("src", section.icon + ".svg");
            icon.setAttribute("class", "icon")
            holder.appendChild(icon);
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
        let holder = document.createElement("section");
        if (section.encoding == "lz-string:UTF16") {
            holder.innerHTML = marked(LZString.decompressFromUTF16(section.text));
        } else {
            holder.innerHTML = `<p class="error">Unknown markdown section encoding: ${section.encoding}</p>`;
        }
        
        return holder;
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
