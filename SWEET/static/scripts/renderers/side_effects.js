function render_se(section, holder) {

    let form = document.createElement("form")
    form.setAttribute("id", `se-${section.type}-details`);
    
    fetch(`/app/schemas/sideeffects/${section.type}`)
    .then(response => response.json())
    .then(schema => {
        holder.title.textContent = `Recording your ${schema.title}`
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

        holder.body.appendChild(form);

        holder.footer.innerHTML = `<input type="submit" form="${form.getAttribute("id")}" value="Save details"><button type="button" id="se-form-cancel">Cancel</button>`

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

        holder.footer.querySelector("#se-form-cancel").addEventListener("click", e => {
            holder.hide(true);
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
            holder.hide(true);
        })

    })
}

export function sideEffectModalRenderer() {

    let holder = this.createModal();
    holder.size = 'lg';

    holder.title.textContent = "Record a Side Effect";
    holder.body.innerHTML = `
    <select name="setype"><option>Please select a side-effect to continue...</option></select>
    `
    holder.footer.innerHTML = "<button id='se-close'>Cancel</button>"

    holder.footer.querySelector("#se-close").addEventListener("click", e => {
        holder.hide(true);
    })

    fetch("/app/schemas/sideeffects")
    .then(response => response.json())
    .then(schemas => {
        const s = holder.body.querySelector("[name='setype']");
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

    holder.show();
}



