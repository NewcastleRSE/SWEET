export function sideEffectFormRenderer(section) {

    let form = document.createElement("form")
    
    fetch(`/app/schemas/sideeffects`)
    .then(response => response.json())
    .then(schema => {
        form.innerHTML =  `
            <section>
            <span id="form-se-type"><label for="type">What side effect do you want to record?</label><select id="form-se-type-input" name="type"><option value="">Choose a side effect...</option></select><input type="hidden" name="description"><br></span>
            <span id="form-se-date" hidden><label for="date"> Which day do you wish to record for?</label><span id="dateinput"></span><br></span>
            <span id="form-se-frequency" hidden><label for="frequency">How many <span data-replace="embedtext"></span> did you have?</label><span><input type="number" id="frequency" name="frequency" min="0" max="50"></span><br></span>
            <span id="form-se-severity" hidden><label for="severity">How bad <span data-switch="embedplural" data-true="were" data-false="was"></span> your <span data-replace="embedtext"></span>?</label>
            <span id="severityinput"><label class="scale">Not at all</label> <input type="range" min="0" max="5" step="0.1" class="form-range" name="severity"> <label class="scale">Extremely</label></span><br></span>
            <span id="form-se-impact" hidden><label for="impact">How badly did your <span data-replace="embedtext"></span> impact your daily life?</label>
            <span id="impactinput"><label class="scale">Not at all</label> <input type="range" min="0" max="5" step="0.1" class="form-range" name="impact"> <label class="scale">Extremely</label></span><br></span>
            <span id="form-se-notes" hidden><label for="notes">Notes: <span class="sidenote">[e.g. the times of day, triggers, things you tried to help]</span></label><br>
            <span id="notesinput"><textarea name="notes" id="notes" cols="50" rows="5"></textarea></span></span>
            </section>
            `

        form.querySelector("#form-se-type-input").insertAdjacentHTML('beforeend', schema.types.map(t => `<option value="${t.name}">${t.description}</option>`).join(""));
        form.querySelector("#form-se-type-input").addEventListener("change", async e => {
            let type = e.target.value;
            let scheme = schema.types.filter(t => t.name == type)[0];
            
            if (!scheme) return;

            form.querySelector("input[name='description']").value = scheme.description;
            form.querySelectorAll("span[data-replace]").forEach(s => s.textContent = scheme[s.dataset.replace]);
            form.querySelectorAll("span[data-switch]").forEach(s => s.textContent = scheme[s.dataset.switch]? s.dataset.true: s.dataset.false);

            ["frequency", "severity", "impact", "notes"].forEach(s => {
                let q = form.querySelector(`#form-se-${s}`);

                if (scheme.questions.includes(s)) {
                    q.removeAttribute("hidden")
                } else {
                    q.setAttribute("hidden", "")
                }
            })

            if (section.date) {
                let existing = await fetch(`/myapp/mydiary/sideeffects?date=${section.date}&type=${type}`).then(response => response.status == 204? null: response.json())
                if (existing) {
                    if (existing.severity == "mild") existing.severity = 1;
                    if (existing.severity == "moderate") existing.severity = 3;
                    if (existing.severity == "severe") existing.severity = 5;
                    if (existing.impact == "a little") existing.impact = 1;
                    if (existing.impact == "moderately") existing.impact = 3;
                    if (existing.impact == "a lot") existing.impact = 5;

                    scheme.questions.forEach(q => form.elements[q].value = existing[q]);
                }
            }
        })

        if (section.date) {
            form.querySelector("#dateinput").innerHTML = `<input type="hidden" name="date" value="${section.date}" data-date="${section.date}" />`;
        } else {
            form.querySelector("#dateinput").append(...(() => {
                let d = document.createElement("input");
                d.setAttribute("type", "text");
                d.setAttribute("readonly", "");
                d.classList.add("datetext");
                d.setAttribute("name", "date")

                let c = this.createCalendar();

                c.addEventListener("redraw", e => {
                    c.querySelectorAll("td").forEach(td => {
                        td.textContent = td.dataset.thisdate.substring(8)
                        if (td.dataset.thisdate.substring(0,7) != c.querySelector("#cal-caption").dataset.basedate.substring(0,7)) {
                            td.classList.add("faded");
                        }
                    })
                })

                c.dispatchEvent(new CustomEvent("redraw"));

                c.addEventListener("click", e => {

                    src = e.target;
                    
                    if (src.matches("tbody *")) {
                        e.preventDefault(); e.stopPropagation();

                        c.querySelectorAll(".selected").forEach(e => e.classList.remove("selected"))
                        
                        while (src.tagName != "TD") src= src.parentElement;
                        src.classList.add("selected");

                        d.dataset.date = src.dataset.thisdate;
                        d.value = new Date(src.dataset.thisdate).toLocaleDateString();
                        d.blur();
                    }
                })

                return [d,c];
            })())
            form.querySelector("#form-se-date").removeAttribute("hidden")
        }
    
    })

    form.addEventListener("submit", e => {
        e.preventDefault(); e.stopPropagation();

        let sideeffect = {
            type: form.elements['type'].value,
            description: form.elements['description'].value,
            date: form.elements['date'].dataset.date,
            frequency: form.elements['frequency'].value,
            severity: form.elements['severity'].value,
            impact: form.elements['impact'].value,
            notes: form.elements['notes'].value
        }

        this.post("/myapp/mydiary/sideeffects/",sideeffect)
    })

    form.addEventListener("reset", e => {
        let sideeffect = {
            type: form.elements['type'].value,
            date: form.elements['date'].value
        }

        this.post("/myapp/mydiary/sideeffects/delete/", sideeffect);

        ["date", "frequency", "severity", "impact", "notes"].forEach(s => {
            form.querySelector(`#form-se-${s}`).setAttribute("hidden", "");
        })

        form.querySelector("select").value = "";
    })

    return form;
}

export function sideEffectModalRenderer() {

    let holder = this.createModal();
    holder.size = 'lg';

    holder.title.textContent = "Record a Side Effect";

    this.render({type: "sideeffectform"}).then(form => {
        form.setAttribute("id", "modal-se-form")
        holder.body.appendChild(form)
        holder.footer.innerHTML = `<button type="button" id="se-form-cancel">Cancel</button><input type="submit" form="${form.getAttribute("id")}" value="Save details">`
        holder.footer.querySelector("#se-close").addEventListener("click", e => {
            holder.hide(true);
        })
    })

    holder.show();
}



