let selectedSideEffects = []

export function sideEffectFormRenderer(section) {

    let form = document.createElement("form")
    
    fetch(`/app/schemas/sideeffects`)
    .then(response => response.json())
    .then(schema => {

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

                const seTypes = form.querySelector('#form-se-types')

                seTypes.addEventListener('change', event => {
                    if (event.target.type === 'checkbox') {

                        let existingSideEffects = existingSE ? existingSE.sideeffects : []

                        const checked = form.querySelectorAll('input[type="checkbox"]:checked')
                        selectedSideEffects = Array.from(checked).map(x => x.id)
                        selectedSideEffects.length > 0 ? document.querySelector("#se-next").disabled = false : document.querySelector("#se-next").disabled = true

                        if(selectedSideEffects.length === 0 && existingSideEffects.length > 0) {
                            document.querySelector('#se-submit').hidden = false
                            document.querySelector('#se-next').hidden = true
                        }
                        else if(selectedSideEffects.length > 0) {
                            document.querySelector('#se-submit').hidden = true
                            document.querySelector('#se-next').hidden = false
                        }
                    }
                })

                form.addEventListener("submit", e => {
                    e.preventDefault(); e.stopPropagation();
            
                    const payload = []
            
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
            
                        payload.push(sideeffect)
                    })
            
                    let existingSideEffects = existingSE ? existingSE.sideeffects : []

                    let deletions = existingSideEffects.map(se => se.type).filter(x => !selectedSideEffects.includes(x));
            
                    let deleteQueries = []

                    deletions.forEach(se => {
                        deleteQueries.push(this.post("/myapp/mydiary/sideeffects/delete/", {
                            type: se,
                            date: section.date
                        }))
                    })

                    // Handle deletions first and then updates/additions
                    Promise.all(deleteQueries).then((values) => {
                        this.post("/myapp/mydiary/sideeffects/", payload)
                      });

                })

            })
        }
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



