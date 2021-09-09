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

            diary.sideeffects.forEach(se => {
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
                let seday = c.querySelector(`td[data-thisdate='${se.date}'] div.events div.sef`);

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

            diary.adherence.forEach(adh => {
                // adherence structure:
                // -- a green tick in the top-right of the box
                // -- no additional details
                let adhday = c.querySelector(`td[data-thisdate='${adh.date}'] div.events div.adhnot`);
                
                if (adhday && !adhday.querySelector(".adherence")) {
                    let i = diaryitem();
                    i.classList.add(`adherence`)
                    i.querySelector("i").classList.add("bi-check-lg")

                    // no additional details: remove section
                    i.querySelector("section").remove();

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
                            if (d.querySelector(".events .adherence")) {
                                modal.body.querySelector("#day-modal-adherence").innerHTML = "&check;";
                            }
                            modal.footer.innerHTML = dayfooter;
                            modal.footer.querySelector("#se-close").addEventListener("click", e => {
                                modal.hide(true);
                            })
                            this.dispatchEvent("calendar:update", c);
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
                            if (d.querySelector(".events .adherence")) {
                                modal.body.querySelector("#day-modal-adherence").innerHTML = "&check;";
                            }

                            modal.footer.innerHTML = dayfooter;
                            modal.footer.querySelector("#se-close").addEventListener("click", e => {
                                modal.hide(true);
                            })
                            this.dispatchEvent("calendar:update", c);
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

                    this.dispatchEvent("calendar:update", c);
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
    <h5>General Trends - Side Effect Severity</h5>
    <svg id="all-se-trends" viewbox="0 0 40 20">
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
            <text x="0" y="1">Worse</text>
            <text x="0" y="15">Better</text>
            <line x1="2.5" y1="0" x2="2.5" y2="16" stroke-width="0.1" stroke="black" />
        </g>
        <g id="axis-x-gen" transform="translate(2.5,16)">
            <line x1="0" y1="0" x2="31" y2="0" stroke-width="0.1" stroke="black" />
        </g>
        <g id="key-gen" transform="translate(32,0)">
        </g>
        <g id="plot-gen" transform="translate(2.5,0)"></g>
    </svg>
    <h5>Individual Side Effects: <select></select></h5>
    <svg id="one-se-trend" viewbox="0 0 40 20">
        <g id="axis-y-ind">
            <text x="0" y="1" font-size="0.75">Worse</text>
            <text x="0" y="15"  font-size="0.75">Better</text>
            <line x1="3" y1="0" x2="3" y2="16" stroke-width="0.1" stroke="black" />
        </g>
        <g id="axis-x-ind" transform="translate(3,16)">
            <line x1="0" y1="0" x2="31" y2="0" stroke-width="0.1" stroke="black" />
        </g>
        <g id="key-ind" transform="translate(34,0)">
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
            l.setAttribute("x1", "6");
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
                .map((e, i) => `${parseInt(e.date.substr(8,2))},${17-(parseInt(e.severity) * 3)}`)
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
                    c.setAttribute("cx", parseInt(e.date.substr(8,2)));
                    c.setAttribute("cy", 17-(parseInt(e.severity) * 3));
                    c.setAttribute("r", "0.1");
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
            .map((e, i) => `${parseInt(e.date.substr(8,2))},${17-(parseInt(e.severity) * 3)}`)
            .join(" ");

        let ipoints = entries
            .sort((a,b) => a.date < b.date? -1: a.date > b.date? 1: 0)
            .map((e, i) => `${parseInt(e.date.substr(8,2))},${17-(parseInt(e.impact) * 3)}`)
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
                c.setAttribute("cx", parseInt(e.date.substr(8,2)));
                c.setAttribute("cy", 17-(parseInt(e.severity) * 3));
                c.setAttribute("r", "0.1");
                c.setAttribute("fill", "red");

                plot.appendChild(c);

                let ic = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                ic.setAttribute("cx", parseInt(e.date.substr(8,2)));
                ic.setAttribute("cy", 17-(parseInt(e.impact) * 3));
                ic.setAttribute("r", "0.1");
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

    this.addEventListener("calendar:update", c => {
        let basedate = c.querySelector("#cal-caption").dataset.basemonth;

        let year = parseInt(basedate.substr(0,4));
        let month = parseInt(basedate.substr(6,2));
        let daysinmonth = new Date(year, month, 0).getDate();

        let xaxes = holder.querySelectorAll("g[id^='axis-x']");
        xaxes.forEach(a => a.querySelectorAll("text").forEach(t => t.remove()))
        for (let i=0;i<daysinmonth;i++) {
            xaxes.forEach(g => {
                let t = document.createElementNS("http://www.w3.org/2000/svg","text");
                t.setAttribute("x", i);
                t.setAttribute("y", "1")
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

    return holder;
}