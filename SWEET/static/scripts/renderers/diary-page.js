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

            td.appendChild(document.createElement("span")).textContent = new Date(td.dataset.thisdate).getDate();
            td.querySelector("span").classList.add("date");

            let holder = td.appendChild(document.createElement("div"));
            holder.classList.add("events");
            holder.innerHTML = "<div class='sef'></div><div class='adhnot'></div>";
        })

        this.dispatchEvent("calendar:update", c);
    })

    this.addEventListener("calendar:update", () => {
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

            Object.keys(diary).forEach(d => {
                let seday = c.querySelector(`td[data-thisdate='${d}'] div.events div.sef`);
                let adhday = c.querySelector(`td[data-thisdate='${d}'] div.events div.adhnot`);

                if (diary[d].sideeffects) {
                    diary[d].sideeffects.forEach(se => {
                        // convert old text items into 5 point scale:
                        if (se.severity == "mild") se.severity = 1;
                        if (se.severity == "moderate") se.severity = 3;
                        if (se.severity == "severe") se.severity = 5;
                        if (se.impact == "a little") se.impact = 1;
                        if (se.impact == "moderately") se.impact = 3;
                        if (se.impact == "a lot") se.impact = 5;
            
                        // side effect structure:
                        // -- coloured dot to the left of the box
                        // -- section contains information about the side effect
                        

                        if (seday && !seday.querySelector(`.side-effect-${se.type}`)) {
                            // we have found the appropriate day, and it doesn't have this type of side effect already:
                            let i = diaryitem();
                            i.classList.add("side-effect");
                            i.querySelector("i").classList.add(`side-effect-${se.type}`)
                            
                            let section = i.querySelector("section")
                            section.innerHTML = `
                            <h4>${se.description? se.description:se.type}</h4>
                            <p><span class="severity"><label>Severity: </label><span class="bar"><label style="width: ${se.severity}em"></label></span></span><br />
                            <span class="impact"><label>Impact: </label><span class="bar"><label style="width: ${se.impact}em"></label></span></p>
                            `
                            seday.appendChild(i);
                        }
                    })
                }

                if (diary[d].adherence) {
                    // adherence structure:
                    // -- a green tick in the top-right of the box
                    // -- no additional details
                    
                    if (adhday && !adhday.querySelector(".adherence")) {
                        let i = diaryitem();
                        i.classList.add(`adherence`)
                        i.querySelector("i").classList.add("bi-check-lg")

                        // no additional details: remove section
                        i.querySelector("section").remove();

                        adhday.appendChild(i);
                    }

                }

                if (diary[d].notes  && diary[d].notes.taken) {
                    // note structure:
                    // -- yellow notes icon in the bottom-right of box
                    // -- section contains every note for the current day.
                    
                    if (adhday) {
                        let existing = adhday.querySelector(".notes");
                        let note = diary[d].notes

                        if (!existing) {

                            existing = diaryitem();
                            existing.classList.add(`notes`)
                            existing.querySelector("i").classList.add("bi-file-text")
        
                            let section = existing.querySelector("section")
                            section.innerHTML = `<h4>Notes</h4>`
                            
                            adhday.appendChild(existing);
                        }

                        this.render({type: "markdown", encoding: "raw", text: note.note }).then(node => existing.querySelector("section").insertAdjacentHTML('beforeend', `<p data-taken="${note.taken.date}T${note.taken.time}">${node.innerHTML}</p>`))
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

        // respond to clicks on days, not just on the button.
        if (e.target.matches("td, td *")) {
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
                    <h5 class="card-title">Add or update side effect(s)</h5>
                </div>
            </a>
            <a class="d-block card shadow mt-3" id="day-modal-add-note">
                <div class="card-body">
                    <h5 class="card-title">Add or update notes</h5>
                </div>
            </a>
            `;
            let dayfooter = "<button id='se-close' class='btn btn-primary'>Close</button>"

            modal.title.textContent = new Date(d.dataset.thisdate).toDateString();
            modal.body.innerHTML = daytemplate;
            modal.body.addEventListener("click", async e => {
                if (e.target.matches("#day-modal-add-note, #day-modal-add-note *")) {
                    modal.size = "lg";
                    // set up adding note functionality

                    // first, capture the current state of the day modal (this ensures we don't revert an adherence click since the modal was last opened)
                    daytemplate = modal.body.innerHTML;

                    function reset() {
                        modal.body.innerHTML = `
                            <h5>General notes about the day <span class="sidenote">[use this to record anything else]</span></h5>
                            <form id="modal-update-note-form">
                            <input type="hidden" name="takendate"><input type="hidden" name="takentime">
                            <input type="hidden" name="date" value="${d.dataset.thisdate}">
                            <textarea name="note" cols="50" rows="5"></textarea>
                            </form>
                        `

                        let btnreset = modal.footer.querySelector("input[type='reset']")
                        if (btnreset) btnreset.remove();
                    }

                    reset()

                    let form = modal.body.querySelector("form");
                    let oldnotes = await fetch(`/myapp/mydiary/notes?date=${d.dataset.thisdate}`).then(response => response.json()).then(notes => notes.notes)

                    if ("taken" in oldnotes) {
                        form.elements["takendate"].value = oldnotes.taken.date;
                        form.elements["takentime"].value = oldnotes.taken.time;
                        form.elements["note"].value = oldnotes.note;
                        modal.footer.insertAdjacentHTML("beforeend", ` <input type="reset" form="${form.getAttribute("id")}" value="Delete Notes" class="btn btn-secondary">`)
                    }

                    modal.footer.querySelector("#se-close").textContent = "Back";
                    modal.footer.querySelector("#se-close").classList.remove("btn-primary");
                    modal.footer.querySelector("#se-close").classList.add("btn-secondary");

                    modal.footer.insertAdjacentHTML("beforeend", ` 
                        <input type="submit" form="${form.getAttribute("id")}" value="Save Changes" class="btn btn-primary">
                    `)


                    form.addEventListener("submit", e => {
                        e.preventDefault();
                        let form = e.target
                        let now = new Date()

                        let note = {
                            date: form.elements['date'].value,
                            note: form.elements['note'].value
                        }

                        if (form.elements['takendate'].value) {
                            note.taken = { date: form.elements["takendate"].value, time: form.elements["takentime"].value }
                            note.updated = { date: this.calendarDate(now), time: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`}
                        } else {
                            note.taken = { date: this.calendarDate(now), time: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`}
                        }
                        
                        this.post("/myapp/notes/", note);
                        if (!(modal.footer.querySelector("input[type='reset']"))) {
                            modal.footer.querySelector("#se-close").insertAdjacentHTML("afterend", ` <input type="reset" form="${form.getAttribute("id")}" value="Delete Notes" class="btn btn-secondary">`)
                        }
                    })

                    form.addEventListener("reset", () => {
                        let note = {
                            date: form.elements['date'].value,
                            taken: {
                                date: form.elements['takendate'].value,
                                time: form.elements['takentime'].value
                            }
                        }

                        this.post("/myapp/notes/delete/", note);
                        reset()
                    })
                }

                if (e.target.matches("#day-modal-add-se, #day-modal-add-se *")) {
                    // set up adding a side effect
                    daytemplate = modal.body.innerHTML;

                    this.render({type: "sideeffectform", date: d.dataset.thisdate})
                    .then(form => {
                        form.setAttribute("id", `${d.dataset.thisdate}-se-form`)
                        modal.size = "lg";

                        while (modal.body.firstChild) modal.body.removeChild(modal.body.lastChild);
                        modal.body.appendChild(form);

                        modal.footer.insertAdjacentHTML('beforeend',` <input type="submit" form="${form.getAttribute("id")}" value="Save details" class="btn btn-primary">`)
                        modal.footer.querySelector("#se-close").textContent = "Back";
                        modal.footer.querySelector("#se-close").classList.remove("btn-primary");
                        modal.footer.querySelector("#se-close").classList.add("btn-secondary");

                        form.addEventListener("change", changeEvent => {
                            if (changeEvent.target.tagName == "SELECT" && !(modal.footer.querySelector("input[type='reset']"))) {
                                modal.footer.querySelector("#se-close").insertAdjacentHTML("afterend", ` <input type="reset" form="${form.getAttribute("id")}" value="Clear details" class="btn btn-secondary">`)
                            }
                        })


                        form.addEventListener("reset", re => {
                            modal.footer.querySelector("input[type='reset']").remove();
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

                }
            })
            modal.footer.innerHTML = dayfooter;

            modal.footer.querySelector("#se-close").addEventListener("click", e => {
                if (e.target.textContent == "Close") {
                    modal.hide();
                    this.dispatchEvent("calendar:update");
                    return;
                }

                if (e.target.textContent == "Back") {
                    modal.body.innerHTML = daytemplate;
                    modal.size = "";
                    e.target.textContent = "Close";
                    e.target.classList.remove("btn-secondary");
                    e.target.classList.add("btn-primary");
                    modal.footer.querySelectorAll("input").forEach(i => i.remove())
                    return;
                }
            })

            modal.show()
            return false;
        }
    })

    this.addEventListener("postrender", () => {
        c.dispatchEvent(new CustomEvent("redraw"))
    })

    return c
}

export function diaryGraphRenderer(section) {
    let holder = document.createElement("section");
    holder.setAttribute("id", "diary-page-graphs");

    holder.innerHTML = `
    <h4>My Side Effects</h4>
    <div id="se-graph-title">Here you can see an overview of the severity of side effects you recorded this month</div>
    <svg id="all-se-trends" viewbox="-1 0 45 20">
        <style>
            text { font-size: 0.75px; }
            line, polyline, path { stroke-width: 0.1px;}
            .hf { color: #633188; }
            .arth { color: #3535ee; }
            .ftg { color: #196b1d; }
            .mood { color: var(--SWEET-grey); }
            .sleep { color: var(--SWEET-lilac); }
        </style>
        <g id="axis-y-gen">
            <text x="-1" y="1">Extremely</text>
            <text x="-1" y="16">Not at all</text>
            <line x1="3" y1="0" x2="3" y2="16" stroke-width="0.1" stroke="black" />
        </g>
        <g id="axis-x-gen" transform="translate(3,16)">
            <line x1="0" y1="0" x2="31" y2="0" stroke-width="0.1" stroke="black" />
            <text x="10" y="2.5">Days of the Month</text>
        </g>
        <g id="key-gen" transform="translate(35,0)">
        </g>
        <g id="plot-gen" transform="translate(3,0)"></g>
    </svg>
    <div id="se-graph-title">Here you can select a side effect to see more details: <select></select></div>
    <svg id="one-se-trend" viewbox="-1 0 45 20">
        <g id="axis-y-ind">
            <text x="-1" y="1" font-size="0.75">Extremely</text>
            <text x="-1" y="16"  font-size="0.75">Not at all</text>
            <line x1="3" y1="0" x2="3" y2="16" stroke-width="0.1" stroke="black" />
        </g>
        <g id="axis-x-ind" transform="translate(3,16)">
            <line x1="0" y1="0" x2="31" y2="0" stroke-width="0.1" stroke="black" />
            <text x="10" y="2.5">Days of the Month</text>
        </g>
        <g id="key-ind" transform="translate(35,0)">
            <text x="0" y="1">Severity</text><line x1="4.5" x2="5.5" y1="0.75" y2="0.75" stroke-width="0.1" stroke="red" />
            <text x="0" y="2">Impact</text><line x1="4.5" x2="5.5" y1="1.75" y2="1.75" stroke-width="0.1" style="stroke: var(--SWEET-gold);" />
        </g>
        <g id="plot-ind" transform="translate(3,0)"></g>
    </svg>
    `

    function updateGeneral(entries, schema) {
        let key = holder.querySelector("#key-gen");
        while(key.firstChild) key.lastChild.remove();

        schema.types.forEach((i, x) => {
            let t = document.createElementNS("http://www.w3.org/2000/svg","text");
            t.setAttribute("x", "0");
            t.setAttribute("y", x+1)
            t.textContent = i.description;
            key.appendChild(t);
            let l = document.createElementNS("http://www.w3.org/2000/svg", "line");
            l.setAttribute("x1", "8");
            l.setAttribute("x2", "7");
            l.setAttribute("y1", `${x}.75`);
            l.setAttribute("y2", `${x}.75`);
            l.setAttribute("class", i.name);
            l.setAttribute("stroke", "currentColor")
            key.appendChild(l);
        })

        entries.forEach(e => {
            if (e.severity == "mild") e.severity = 1;
            if (e.severity == "moderate") e.severity = 3;
            if (e.severity == "severe") e.severity = 5;
        })

        let plot = holder.querySelector("#plot-gen");
        while (plot.firstChild) plot.lastChild.remove();

        schema.types.map(t => t.name).forEach(name => {
            let d = entries
                .filter(e => e.type == name)
                .sort((a,b) => a.date < b.date? -1: a.date > b.date? 1: 0)
                .map((e, i) => `${parseInt(e.date.substr(8,2)) - 1},${16-(parseFloat(e.severity) * 3)}`)
                .join(" ");
            
            let p = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
            p.setAttribute("class", name);
            p.setAttribute("points", d);
            p.setAttribute("marker-start", "url(#point)");
            p.setAttribute("marker-mid", "url(#point)");
            p.setAttribute("marker-end", "url(#point)");
            p.setAttribute("stroke", "currentColor");
            p.setAttribute("fill", "none");
            plot.appendChild(p);

            entries
                .filter(e => e.type == name)
                .sort((a,b) => a.date < b.date? -1: a.date > b.date? 1: 0)
                .forEach(e => {
                    let c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    c.setAttribute("class", name);
                    c.setAttribute("cx", parseInt(e.date.substr(8,2)) - 1);
                    c.setAttribute("cy", 16-(parseFloat(e.severity) * 3));
                    c.setAttribute("r", "0.2");
                    c.setAttribute("fill", "currentColor");

                    plot.appendChild(c);
                })
        })
    }

    function updateSpecific(entries) {
        entries.forEach(e => {
            if (e.severity == "mild") e.severity = 1;
            if (e.severity == "moderate") e.severity = 3;
            if (e.severity == "severe") e.severity = 5;
            if (e.impact == "a little") e.impact = 1;
            if (e.impact == "moderately") e.impact = 3;
            if (e.impact == "a lot") e.impact = 5;
        })

        let plot = holder.querySelector("#plot-ind");
        while (plot.firstChild) plot.lastChild.remove();

        let spoints = entries
            .sort((a,b) => a.date < b.date? -1: a.date > b.date? 1: 0)
            .map((e, i) => `${parseInt(e.date.substr(8,2)) - 1},${16-(parseFloat(e.severity) * 3)}`)
            .join(" ");

        let ipoints = entries
            .sort((a,b) => a.date < b.date? -1: a.date > b.date? 1: 0)
            .map((e, i) => `${parseInt(e.date.substr(8,2)) - 1},${16-(parseFloat(e.impact) * 3)}`)
            .join(" ");

        let sp = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        sp.setAttribute("points", spoints);
        sp.setAttribute("marker-start", "url(#point)");
        sp.setAttribute("marker-mid", "url(#point)");
        sp.setAttribute("marker-end", "url(#point)");
        sp.setAttribute("stroke", "red");
        sp.setAttribute("fill", "none");
        plot.appendChild(sp);

        let ip = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        ip.setAttribute("points", ipoints);
        ip.setAttribute("marker-start", "url(#point)");
        ip.setAttribute("marker-mid", "url(#point)");
        ip.setAttribute("marker-end", "url(#point)");
        ip.setAttribute("style", "stroke: var(--SWEET-gold);");
        ip.setAttribute("fill", "none");
        plot.appendChild(ip);

        entries
            .sort((a,b) => a.date < b.date? -1: a.date > b.date? 1: 0)
            .forEach(e => {
                let c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                c.setAttribute("cx", parseInt(e.date.substr(8,2)) - 1);
                c.setAttribute("cy", 16-(parseFloat(e.severity) * 3));
                c.setAttribute("r", "0.2");
                c.setAttribute("fill", "red");

                plot.appendChild(c);

                let ic = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                ic.setAttribute("cx", parseInt(e.date.substr(8,2)) - 1);
                ic.setAttribute("cy", 16-(parseFloat(e.impact) * 3));
                ic.setAttribute("r", "0.2");
                ic.setAttribute("style", "fill: var(--SWEET-gold)");

                plot.appendChild(ic);
            })

    }

    fetch("/app/schemas/sideeffects").then(response => response.json())
    .then(schema => {
        schema.types.forEach(t => {
            holder.querySelector("select").insertAdjacentHTML("beforeend", `
            <option value="${t.name}">${t.description}</option>`)
        })
    })
    
    holder.querySelector("select").addEventListener("change", e => {
        fetch(`/myapp/mydiary`).then(response => response.json())
        .then(diary => {
            let basedate = this.contentHolder.querySelector("#cal-caption").dataset.basemonth;
            let se = diary.sideeffects.filter(se => se.date.startsWith(basedate) && se.type == e.target.value);
            updateSpecific(se);
        })

    })
/*
    this.addEventListener("calendar:update", c => {
        let basedate = c.querySelector("#cal-caption").dataset.basemonth;

        let year = parseInt(basedate.substr(0,4));
        let month = parseInt(basedate.substr(6,2));
        let daysinmonth = new Date(year, month, 0).getDate();

        let xaxes = holder.querySelectorAll("g[id^='axis-x']");
        xaxes.forEach(a => a.querySelectorAll("text.daynum").forEach(t => t.remove()))
        for (let i=0;i<daysinmonth;i++) {
            xaxes.forEach(g => {
                let t = document.createElementNS("http://www.w3.org/2000/svg","text");
                t.setAttribute("x", i - 0.25);
                t.setAttribute("y", "1")
                t.setAttribute("class", "daynum")
                t.textContent = i+1;
                g.appendChild(t);
            })
        }

        Promise.allSettled([
            fetch(`/myapp/mydiary?period=${basedate}`).then(response => response.json()),
            fetch("/app/schemas/sideeffects").then(response => response.json())
        ]).then(([diary,schema]) => {

            let se = diary.value.sideeffects.filter(se => se.date.startsWith(basedate));
            updateGeneral(se, schema.value);
            let spec = holder.querySelector("select").value;
            updateSpecific(se.filter(i => i.type == spec));
        })

    })
*/
    return holder;
}
