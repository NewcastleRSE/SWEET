export function diaryCalendarRenderer(section) {
    if (section.type != "diary-calendar") return null;

    let c = this.createCalendar();

    c.addEventListener("redraw", () => {
        c.querySelectorAll("td").forEach(td => {

            if (td.dataset.thisdate > this.calendarDate(new Date())) {
                td.classList.add("disabled");
            }

            if (td.dataset.thisdate.substr(0,7) != c.querySelector("#cal-caption").dataset.basemonth) {
                td.classList.add("faded");
            }

            let dt = td.appendChild(document.createElement("div"));
            dt.classList.add("date");
            
            dt.appendChild(document.createElement("span")).textContent = new Date(td.dataset.thisdate).getDate();
            if (!td.classList.contains("disabled")) {
                dt.appendChild(document.createElement("button")).textContent = "+";
            }

            let holder = td.appendChild(document.createElement("div"));
            holder.classList.add("events");
            holder.innerHTML = "<div class='sef'></div><div class='adhnot'></div>";
        })

        c.dispatchEvent(new CustomEvent("update"))
    })

    c.addEventListener("update", () => {
        let basemonth = c.querySelector("#cal-caption").dataset.basemonth;

        fetch(`/myapp/mydiary?period=${basemonth}`)
        .then(response => response.json())
        .then(diary => {

            // each diary item can be displayed as an icon with a pop-out details
            // this is acheived with a holder div, a displayed i, and a section that is
            // display: none normally, and display: inline when the div is :hover
            function diaryitem() {
                let holder = document.createElement("div");
                holder.classList.add("diary-item");
                holder.appendChild(document.createElement("i"));
                holder.appendChild(document.createElement("section"));
                return holder;
            }

            diary.sideeffects.forEach(se => {
                // side effect structure:
                // -- coloured dot to the left of the box
                // -- section contains information about the side effect
                let seday = c.querySelector(`td[data-thisdate='${se.date}'] div.events div.sef`);

                if (seday && !seday.querySelector(`.side-effect-${se.type}`)) {
                    // we have found the appropriate day, and it doesn't have this type of side effect already:
                    let i = diaryitem();
                    i.classList.add("side-effect");
                    i.querySelector("i").classList.add(`side-effect-${se.type}`)
                    
                    let section = i.querySelector("section")
                    section.innerHTML = `
                    <h4>${se.description? se.description:se.type}</h4>
                    <p>Severity: ${se.severity}<br />
                    Impact: ${se.impact}</p>
                    `
                    seday.appendChild(i);
                }
            })

            diary.adherence.forEach(adh => {
                // adherence structure:
                // -- a green tick in the top-right of the box
                // -- section contains details of prescription
                let adhday = c.querySelector(`td[data-thisdate='${adh.date}'] div.events div.adhnot`);
                
                if (adhday && !adhday.querySelector(".adherence")) {
                    let i = diaryitem();
                    i.classList.add(`adherence`)
                    i.querySelector("i").classList.add("bi-check-lg")

                    let section = i.querySelector("section")
                    section.innerHTML = `
                    <h4>Took medication</h4>
                    <p>Type: ${adh.prescription}<br />
                    Time: ${adh.time}</p>
                    `

                    adhday.appendChild(i);
                }

            })

            // as we can record multiple notes for the same day
            diary.notes.forEach(note => {
                // note structure:
                // -- yellow notes icon in the bottom-right of box
                // -- section contains every note for the current day.
                let noteday = c.querySelector(`td[data-thisdate='${note.date}'] div.events`);
                
                if (noteday) {
                    let existing = noteday.querySelector(".notes");
                    if (!existing) {
                        existing = diaryitem();
                        existing.classList.add(`notes`)
                        existing.querySelector("i").classList.add("bi-file-text")
    
                        let section = existing.querySelector("section")
                        section.innerHTML = `<h4>Notes</h4>`
                        
                        noteday.appendChild(existing);
                    }
                
                    if (!existing.querySelector(`section p[data-taken='${note.taken.date}T${note.taken.time}']`)) {
                        existing.querySelector("section").insertAdjacentHTML('beforeend', `<p data-taken="${note.taken.date}T${note.taken.time}">${note.note}</p>`)
                    }
                }
            })
        })
    })

    c.addEventListener("click", e => {
        
        if (e.target.matches("td.disabled, td.disabled *")){
            e.stopImmediatePropagation(); e.stopPropagation(); e.preventDefault(); 
            
            return false;
        }

        if (e.target.matches("div.date button")) {
            // create pop-up for adding something to a date:
            let modal = this.createModal();
            let d = e.target;
            while (d.tagName != "TD") d = d.parentElement;
            
            if (d.tagName != "TD") return false;
            
            let daytemplate = `
            <fieldset>
                <label for="day-modal-adherence">I have taken my hormone therapy today</label>
                <button type="button" id="day-modal-adherence">${d.querySelector(".events .adherence")? "&check;": ""}</button>
            </fieldset>
            <a class="d-block card shadow mt-3" id="day-modal-add-se">
                <div class="card-body">
                    <h5 class="card-title">Add side effect(s)</h5>
                </div>
            </a>
            <a class="d-block card shadow mt-3" id="day-modal-add-note">
                <div class="card-body">
                    <h5 class="card-title">Add notes</h5>
                </div>
            </a>
            `;
            let dayfooter = "<button id='se-close'>Close</button>"


            modal.title.textContent = new Date(d.dataset.thisdate).toDateString();
            modal.body.innerHTML = daytemplate;
            modal.body.addEventListener("click", e => {
                if (e.target.matches("#day-modal-add-note, #day-modal-add-note *")) {
                    // set up adding note functionality

                    let notedate = d.dataset.thisdate;
                    let taken = new Date();
                    modal.body.innerHTML = `
                        <h5>Make a note</h5>
                        <form id="${d.dataset.thisdate}-note-form">
                        <input type="hidden" name="date" value="${notedate}"><input type="hidden" name="takendate" value="${this.calendarDate(taken)}"><input type="hidden" name="takentime" value="${taken.getHours()}:${taken.getMinutes()}:${taken.getSeconds()}">
                        <textarea name="note" cols="50" rows="5"></textarea>
                        </form>
                    `
                    modal.footer.insertAdjacentHTML('afterbegin',`<input type="submit" form="${d.dataset.thisdate}-note-form" value="Save Note">`)
                    modal.footer.querySelector("#se-close").textContent = "Cancel";

                    modal.body.querySelector("form").addEventListener("submit", e => {
                        e.preventDefault();
                        let form = e.target

                        let note = {
                            date: form.elements['date'].value,
                            taken: {
                                date: form.elements['takendate'].value,
                                time: form.elements['takentime'].value
                            },
                            note: form.elements['note'].value
                        }
                        
                        this.post("/myapp/notes/", note)
                        .then(() => {
                            modal.body.innerHTML = daytemplate;
                            modal.footer.innerHTML = dayfooter;
                            modal.footer.querySelector("#se-close").addEventListener("click", e => {
                                modal.hide(true);
                            })
                            c.dispatchEvent(new CustomEvent("update"));
                        })
                    })
                }

                if (e.target.matches("#day-modal-add-se, #day-modal-add-se *")) {
                    // set up adding a side effect
                    this.render({type: "sideeffectform", date: d.dataset.thisdate})
                    .then(form => {
                        form.setAttribute("id", `${d.dataset.thisdate}-se-form`)
                        modal.size = "lg";
                        while (modal.body.firstChild) modal.body.removeChild(modal.body.lastChild);
                        modal.body.appendChild(form);

                        modal.footer.insertAdjacentHTML('afterbegin',`<input type="submit" form="${form.getAttribute("id")}" value="Save details">`)
                        modal.footer.querySelector("#se-close").textContent = "Cancel";

                        form.addEventListener("submit", e => {
                            modal.body.innerHTML = daytemplate;
                            modal.footer.innerHTML = dayfooter;
                            modal.footer.querySelector("#se-close").addEventListener("click", e => {
                                modal.hide(true);
                            })
                            c.dispatchEvent(new CustomEvent("update"));
                        })
                
                    })
                    
                }

                if (e.target.matches("#day-modal-adherence, #day-modal-adherence *")) {
                    let src = e.target;
                    while (src.tagName != "BUTTON" && src.parentElement) src = src.parentElement;
                    if (src.tagName != "BUTTON") return false;
                    if (src.innerHTML != "") return false;

                    this.post("/myapp/adherence/", { date: d.dataset.thisdate })
                    src.innerHTML = "&check;"

                    c.dispatchEvent(new CustomEvent("update"));
                }
            })
            modal.footer.innerHTML = dayfooter;

            modal.footer.querySelector("#se-close").addEventListener("click", e => {
                modal.hide(true);
            })

            modal.show()
            return false;
        }

        if (e.target.matches("div.events, div.events *")) {
            // open a pop-up showing all of the date's events.

            return false;
        }
    })

    c.dispatchEvent(new CustomEvent("redraw"))
    return c
}