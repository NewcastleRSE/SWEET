let selectedSideEffects = []

export function sideEffectFormRenderer(section) {

    let form = document.createElement("form")
    
    fetch(`/app/schemas/sideeffects`)
    .then(response => response.json())
    .then(schema => {
        // form.innerHTML =  `
        //     <section>
        //     <span id="form-se-type"><label for="type">What side effect do you want to record?</label><select id="form-se-type-input" name="type"><option value="">Choose a side effect...</option></select><input type="hidden" name="description"><br></span>
        //     <span id="form-se-date" hidden><label for="date"> Which day do you wish to record for?</label><span id="dateinput"></span><br></span>
        //     <span id="form-se-frequency" hidden><label for="frequency">How many <span data-replace="embedtext"></span> did you have?</label><span><input type="number" id="frequency" name="frequency" min="0" max="50"></span><br></span>
        //     <span id="form-se-severity" hidden><label for="severity">How bad <span data-switch="embedplural" data-true="were" data-false="was"></span> your <span data-replace="embedtext"></span>?</label>
        //     <span id="severityinput"><label class="scale">Not at all</label> <input type="range" min="0" max="5" step="0.1" class="form-range" name="severity"> <label class="scale">Extremely</label></span><br></span>
        //     <span id="form-se-impact" hidden><label for="impact">How badly did your <span data-replace="embedtext"></span> impact your daily life?</label>
        //     <span id="impactinput"><label class="scale">Not at all</label> <input type="range" min="0" max="5" step="0.1" class="form-range" name="impact"> <label class="scale">Extremely</label></span><br></span>
        //     <span id="form-se-notes" hidden><label for="notes">Notes: <span class="sidenote">[e.g. the times of day, triggers, things you tried to help]</span></label><br>
        //     <span id="notesinput"><textarea name="notes" id="notes" cols="50" rows="5"></textarea></span></span>
        //     </section>
        //     `

        form.innerHTML = `
            
            <div class="tab-content" id="sideEffectTabs">
                <div class="tab-pane fade show active" id="form-se-types" role="tabpanel">
                    <section id="form-se-types" class="mx-3">
                        <p>What side effects would you like to add?</p>
                        <div id="se-checkboxes"></div>
                    </section>
                </div>
            </div>
        `

        let existing = null;

        if (section.date) {
            fetch(`/myapp/mydiary/sideeffects?date=${section.date}`).then(response => response.status == 204 ? null : response.json()).then(existingSE => {
                if (existingSE && existingSE.sideeffects) {

                    existing = {}
                    existingSE.sideeffects.forEach(se => {
                        existing[se.type] = se
                    })

                    selectedSideEffects = Object.keys(existing)
                    selectedSideEffects.length > 0 ? document.querySelector("#se-next").disabled = false : document.querySelector("#se-next").disabled = true

                    if (existing.severity == "mild") existing.severity = 1;
                    if (existing.severity == "moderate") existing.severity = 3;
                    if (existing.severity == "severe") existing.severity = 5;
                    if (existing.impact == "a little") existing.impact = 1;
                    if (existing.impact == "moderately") existing.impact = 3;
                    if (existing.impact == "a lot") existing.impact = 5;
                }

                form.querySelector("#se-checkboxes").insertAdjacentHTML('beforeend', 
                    schema.types.map(t => {
                        return `<div class="form-check">
                            <input class="form-check-input" type="checkbox" id="${t.name}" ${selectedSideEffects.includes(t.name) ? "checked" : ""}>
                            <label class="form-check-label" for="${t.name}">
                                ${t.description}
                            </label>
                        </div>`
                    }).join("")
                );

                form.querySelector("#sideEffectTabs").insertAdjacentHTML('beforeend',
                    schema.types.map(t => 
                        `<div class="tab-pane fade" id="form-se-type-${t.name}" role="tabpanel">
                            <h4>${t.description}</h4>
                            <input id="${t.name}-description" type="hidden" value="${t.description}" />
                            <div class="row mb-3" hidden>
                                <label class="col-6" for="${t.name}-date" style="line-height:2.2em">Which day do you wish to record for?</label>
                                <span class="col-6" id="dateinput"></span>
                            </div>
                            <div id="hf-freq-holder" class="row mb-3" hidden>
                                <label class="col-6" for="${t.name}-frequency" style="line-height:2.2em">How many ${t.embedtext} did you have?</label>
                                <input type="number" class="col-6 form-control" id="${t.name}-frequency" name="${t.name}-frequency" min="0" max="50" value="${existing && existing[t.name] ? existing[t.name].frequency : ''}">
                            </div>
                            <p class="mt-3">How bad ${t.embedplural ? 'were' : 'was'} your ${t.embedtext}?</p>
                            <div class="mb-3">
                                <label for="${t.name}-severity" class="float-start">Not at all</label>
                                <label for="${t.name}-severity" class="float-end">Extremely</label>
                                <input type="range" class="form-range" min="0" max="5" step="0.1" class="form-range" id="${t.name}-severity" name="${t.name}-severity" value="${existing && existing[t.name] ? existing[t.name].severity : ''}">
                            </div>
                            <p class="mt-3">How badly did your ${t.embedtext} impact your daily life?</p>
                            <div class="mb-3">
                                <label for="${t.name}-impact" class="float-start">Not at all</label>
                                <label for="${t.name}-impact" class="float-end">Extremely</label>
                                <input type="range" class="form-range" min="0" max="5" step="0.1" class="form-range" id="${t.name}-impact" name="${t.name}-impact" value="${existing && existing[t.name] ? existing[t.name].impact : ''}">
                            </div>
                            <div class="mb-3">
                                <label for="${t.name}-notes">Notes: <span class="sidenote">[e.g. the times of day, triggers, things you tried to help]</label>
                                <textarea class="form-control" name="${t.name}-notes" id="${t.name}-notes" rows="5">${existing && existing[t.name] ? existing[t.name].notes : ''}</textarea>
                            </div>
                        </div>`
                    ).join("")
                );
            })
        }

        

        /*

           // <span id="form-se-${t.name}-frequency">
                    // <label for="frequency">How many ${t.description} did you have?</label>
                    // <span><input type="number" id="frequency" name="frequency" min="0" max="50"></span><br></span>
                    // <span id="form-se-${t.name}-severity"><label for="severity">How bad <span data-switch="embedplural" data-true="were" data-false="was"></span> your <span data-replace="embedtext"></span>?</label>
                    // <span id="${t.name}-severityinput"><label class="scale">Not at all</label> <input type="range" min="0" max="5" step="0.1" class="form-range" name="severity"> <label class="scale">Extremely</label></span><br></span>
                    // <span id="form-se-${t.name}-impact"><label for="impact">How badly did your <span data-replace="embedtext"></span> impact your daily life?</label>
                    // <span id="${t.name}-impactinput"><label class="scale">Not at all</label>
                    <input type="range" min="0" max="5" step="0.1" class="form-range" name="impact"> <label class="scale">Extremely</label></span><br></span>
                    // <span id="form-se-${t.name}-notes"><label for="notes">Notes: <span class="sidenote">[e.g. the times of day, triggers, things you tried to help]</span></label><br>
                    // <span id="${t.name}-notesinput"><textarea class="form-control" name="notes" id="notes" rows="5"></textarea></span></span>
        */

        const seTypes = form.querySelector('#form-se-types')

        seTypes.addEventListener('change', event => {
            if (event.target.type === 'checkbox') {
                const checked = form.querySelectorAll('input[type="checkbox"]:checked')
                selectedSideEffects = Array.from(checked).map(x => x.id)
                selectedSideEffects.length > 0 ? document.querySelector("#se-next").disabled = false : document.querySelector("#se-next").disabled = true
            }
        })
        
        // form.querySelector("#form-se-type-input").addEventListener("change", async e => {
        //     let type = e.target.value;
        //     let scheme = schema.types.filter(t => t.name == type)[0];
            
        //     if (!scheme) return;

        //     form.querySelector("input[name='description']").value = scheme.description;
        //     form.querySelectorAll("span[data-replace]").forEach(s => s.textContent = scheme[s.dataset.replace]);
        //     form.querySelectorAll("span[data-switch]").forEach(s => s.textContent = scheme[s.dataset.switch]? s.dataset.true: s.dataset.false);

        //     ["frequency", "severity", "impact", "notes"].forEach(s => {
        //         let q = form.querySelector(`#form-se-${s}`);

        //         if (scheme.questions.includes(s)) {
        //             q.removeAttribute("hidden")
        //         } else {
        //             q.setAttribute("hidden", "")
        //         }
        //     })

        //     if (section.date) {
        //         let existing = await fetch(`/myapp/mydiary/sideeffects?date=${section.date}&type=${type}`).then(response => response.status == 204? null: response.json())
        //         if (existing) {
        //             if (existing.severity == "mild") existing.severity = 1;
        //             if (existing.severity == "moderate") existing.severity = 3;
        //             if (existing.severity == "severe") existing.severity = 5;
        //             if (existing.impact == "a little") existing.impact = 1;
        //             if (existing.impact == "moderately") existing.impact = 3;
        //             if (existing.impact == "a lot") existing.impact = 5;

        //             scheme.questions.forEach(q => form.elements[q].value = existing[q]);
        //         }
        //     }
        // })

        // if (section.date) {
        //     form.querySelector("#dateinput").innerHTML = `<input type="hidden" name="date" value="${section.date}" data-date="${section.date}" />`;
        // } else {
            /*
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
            */
       // }
    
    })

    form.addEventListener("submit", e => {
        e.preventDefault(); e.stopPropagation();

        selectedSideEffects.forEach((se) => {
            let sideeffect = {
                type: se,
                description: form.elements[se + '-description'].value,
                date: section.date,
                frequency: form.elements[se + '-frequency'].value,
                severity: form.elements[se + '-severity'].value,
                impact: form.elements[se + '-impact'].value,
                notes: form.elements[se + '-notes'].value
            }

            this.post("/myapp/mydiary/sideeffects/", sideeffect)
        })
    })

    form.addEventListener("reset", e => {
        let sideeffect = {
            type: form.elements['type'].value,
            date: form.elements['date'].value
        }

        this.post("/myapp/mydiary/sideeffects/delete/", sideeffect).then(res => {
            console.log(res)
        });

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
        holder.footer.innerHTML = `<button type="button" id="se-form-cancel">Cancel</button><button type="button" id="se-form-next">Next</button><input hidden type="submit" form="${form.getAttribute("id")}" value="Save details">`
        holder.footer.querySelector("#se-close").addEventListener("click", e => {
            holder.hide(true);
        })

        form.querySelector("#se-next").addEventListener("click", async e => {
            console.log(e)
            console.log(selectedSideEffects)
        })
    })

    holder.show();
}



