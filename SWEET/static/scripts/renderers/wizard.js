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
