export function diaryCalendarRenderer(section) {
    if (section.type != "diary-calendar") return null;

    let c = this.createCalendar();

    c.addEventListener("redraw", () => {
        c.querySelectorAll("td").forEach(td => {

            if (td.dataset.thisdate > this.calendarDate(new Date())) {
                td.classList.add("future");
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

                // clear any old data to account for deletion of items:
                seday.innerHTML = ""; 
                adhday.innerHTML = "";

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

                        if (seday){
                            // we have found the appropriate day
                            // we have cleared the contents earlier, so we can just add stuff with gay abandon.

                            let i = diaryitem();
                            i.classList.add("side-effect");
                            i.querySelector("i").classList.add(`side-effect-${se.type}`)
                            let section = i.querySelector("section")
                            section.innerHTML = `
                            <h4>${se.description? se.description:se.type}</h4>
                            ${ se.description === "Hot Flushes" && se.frequency ? `<p class="se-frequency"><label>Frequency:</label> ${se.frequency}</p>`: ""}
                            <p><span class="severity"><label>Severity: </label><span class="bar"><label style="width: ${se.severity}em"></label></span></span><br />
                            <span class="impact"><label>Impact: </label><span class="bar"><label style="width: ${se.impact}em"></label></span></p>
                            ${ se.notes? `<p class="se-notes"><label>Notes:</label><div>${se.notes}</p>`: ""}`

                            seday.appendChild(i);
                        }
                    })
                }

                if (diary[d].adherence) {
                    // adherence structure:
                    // -- a green tick in the top-right of the box
                    // -- no additional details
                    
                    let i = diaryitem();
                    i.classList.add(`adherence`)
                    i.querySelector("i").classList.add("bi-check-lg")

                    // no additional details: remove section
                    i.querySelector("section").remove();

                    adhday.appendChild(i);
                }

                if (diary[d].drugs) {
                    // note structure:
                    // -- yellow notes icon in the bottom-right of box
                    // -- section contains every note for the current day.
                    
                    if (adhday) {
                        let drugs = diary[d].drugs

                        let existing = diaryitem();
                        existing.classList.add(`notes`)
                        existing.querySelector("i").classList.add("bi-usb-c-fill")
                            
                        adhday.appendChild(existing);

                        this.render({type: "markdown", encoding: "raw", text: drugs.drug })
                        .then(node => {
                            existing.querySelector("section").innerHTML = `<h4>Drug</h4><p id="notes-data" data-taken="${drugs.taken.date}T${drugs.taken.time}">${node.innerHTML}</p>`
                        })
                    }      
                }

                if (diary[d].notes && diary[d].notes.taken) {
                    // note structure:
                    // -- yellow notes icon in the bottom-right of box
                    // -- section contains every note for the current day.
                    
                    if (adhday) {
                        let note = diary[d].notes

                        let existing = diaryitem();
                        existing.classList.add(`notes`)
                        existing.querySelector("i").classList.add("bi-file-text")
                            
                        adhday.appendChild(existing);

                        this.render({type: "markdown", encoding: "raw", text: note.note })
                        .then(node => {
                            existing.querySelector("section").innerHTML = `<h4>Notes</h4><p id="notes-data" data-taken="${note.taken.date}T${note.taken.time}">${node.innerHTML}</p>`
                        })
                    }                    
                }
            })
        })

        if (document.querySelector("#btn-print > a")) {
            document.querySelector("#btn-print > a").dataset.period = basemonth;
        }
    })

    c.addEventListener("click", e => {
        
        if (e.target.matches("td.disabled, td.disabled *")){
            e.stopImmediatePropagation(); e.stopPropagation(); e.preventDefault(); 
            
            return false;
        }

        // respond to clicks on days, not just on the button.
        if (e.target.matches("td, td *")) {
            // create pop-up for adding something to a date:
            let modal = this.createModal(true);
            let d = e.target;
            while (d.tagName != "TD") d = d.parentElement;
            
            if (d.tagName != "TD") return false;
            
            let daytemplate = d.classList.contains("future") ?
            `<a class="d-block card shadow mt-3" id="day-modal-add-note">
                <div class="card-body">
                    <h5 class="card-title">Add or update notes</h5>
                </div>
            </a>`
            :
            `
            <fieldset>
                <label for="day-modal-adherence">I have taken my hormone therapy today</label>
                <button type="button" id="day-modal-adherence">${d.querySelector(".events .adherence")? "&check;": ""}</button>
            </fieldset>
            <a class="d-block card shadow mt-3" id="day-modal-add-se">
                <div class="card-body">
                    <h5 class="card-title">Add or update side effect(s)</h5>
                </div>
            </a>
            <a class="d-block card shadow mt-3" id="day-modal-add-drug">
                <div class="card-body">
                    <h5 class="card-title">Add or update pill change</h5>
                </div>
            </a>
            <a class="d-block card shadow mt-3" id="day-modal-add-note">
                <div class="card-body">
                    <h5 class="card-title">Add or update notes</h5>
                </div>
            </a>
            `;
            let dayfooter = "<button id='se-close' class='btn btn-primary'>Close</button>"
            const clickBack = () => modal.footer.querySelector("#se-close").dispatchEvent(new MouseEvent("click"));

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
                            <h5>General notes about the day</h5>
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
                        clickBack();
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
                        clickBack();
                    })
                }

                if (e.target.matches("#day-modal-add-drug, #day-modal-add-drug *")) {
                    modal.size = "lg";
                    // set up adding note functionality

                    // first, capture the current state of the day modal (this ensures we don't revert an adherence click since the modal was last opened)
                    daytemplate = modal.body.innerHTML;

                    function reset() {
                        modal.body.innerHTML = `
                            <h5>Change in drug taken</h5>
                            <p>Here you can record that you've changed the type or brand of hormone therapy pills.</p>
                            <form id="modal-update-note-form">
                            <input type="hidden" name="takendate"><input type="hidden" name="takentime">
                            <input type="hidden" name="date" value="${d.dataset.thisdate}">
                            <input type="text" name="drug" placeholder="New pills name">
                            </form>
                        `

                        let btnreset = modal.footer.querySelector("input[type='reset']")
                        if (btnreset) btnreset.remove();
                    }

                    reset()

                    let form = modal.body.querySelector("form");
                    let olddrug = await fetch(`/myapp/mydiary/drugs?date=${d.dataset.thisdate}`).then(response => response.json()).then(drugs => drugs.drugs)

                    console.log(olddrug)

                    if ("taken" in olddrug) {
                        form.elements["takendate"].value = olddrug.taken.date;
                        form.elements["takentime"].value = olddrug.taken.time;
                        form.elements["drug"].value = olddrug.drug;
                        modal.footer.insertAdjacentHTML("beforeend", ` <input type="reset" form="${form.getAttribute("id")}" value="Delete Drug" class="btn btn-secondary">`)
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

                        let drug = {
                            date: form.elements['date'].value,
                            drug: form.elements['drug'].value
                        }

                        if (form.elements['takendate'].value) {
                            drug.taken = { date: form.elements["takendate"].value, time: form.elements["takentime"].value }
                            drug.updated = { date: this.calendarDate(now), time: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`}
                        } else {
                            drug.taken = { date: this.calendarDate(now), time: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`}
                        }
                        
                        this.post("/myapp/drugs/", drug);
                        clickBack();
                    })

                    form.addEventListener("reset", () => {
                        let drug = {
                            date: form.elements['date'].value,
                            taken: {
                                date: form.elements['takendate'].value,
                                time: form.elements['takentime'].value
                            }
                        }

                        this.post("/myapp/drugs/delete/", drug);
                        clickBack();
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
                        modal.footer.insertAdjacentHTML('beforeend',` <input id="se-next" type="button" value="Next" class="btn btn-primary" disabled>`)
                        modal.footer.insertAdjacentHTML('beforeend',` <input hidden type="submit" id="se-submit" form="${form.getAttribute("id")}" value="Save details" class="btn btn-primary">`)
                        modal.footer.querySelector("#se-close").textContent = "Back";
                        modal.footer.querySelector("#se-close").classList.remove("btn-primary");
                        modal.footer.querySelector("#se-close").classList.add("btn-secondary");

                        // form.addEventListener("change", changeEvent => {
                        //     if (changeEvent.target.tagName == "SELECT" && !(modal.footer.querySelector("input[type='reset']"))) {
                        //         modal.footer.querySelector("#se-close").insertAdjacentHTML("afterend", ` <input type="reset" form="${form.getAttribute("id")}" value="Delete details" class="btn btn-secondary">`)
                        //     }
                        // })

                        let selectedSideEffects = []

                        modal.footer.querySelector("#se-next").addEventListener("click", async e => {
                            let activeTab = form.querySelector("#sideEffectTabs .active")
  
                            if(activeTab.id === "form-se-types") {
                                const checked = form.querySelectorAll('input[type="checkbox"]:checked')
                                selectedSideEffects = Array.from(checked).map(x => x.id)
                            }

                            let targetPane = selectedSideEffects.shift();

                            if(targetPane === "hf") {
                                form.querySelector('#hf-freq-holder').hidden = false
                            }

                            activeTab.classList.remove("show", "active")
                            form.querySelector("#form-se-type-" + targetPane).classList.add("show", "active")

                            if(selectedSideEffects.length === 0) {
                                modal.footer.querySelector('input[type="submit"]').hidden = false
                                modal.footer.querySelector('#se-next').hidden = true
                            }
                            
                        })

                        form.addEventListener("submit", () => {
                            location.reload();
                            //c.dispatchEvent(new CustomEvent("redraw"));
                            // diaryGraphRenderer()
                            // modal.hide()
                        })                
                    })
                    
                }

                if (e.target.matches("#day-modal-adherence, #day-modal-adherence *")) {
                    let src = e.target;
                    while (src.tagName != "BUTTON" && src.parentElement) src = src.parentElement;
                    if (src.tagName != "BUTTON") return false;

                    let adherence = { date: d.dataset.thisdate, action: "record" }
                    if (src.innerHTML != "") {
                        adherence.action = "remove";
                        src.innerHTML = "";                        
                    } else {
                        src.innerHTML = "&check;"
                    }

                    this.post("/myapp/adherence/", adherence)

                }
            })
            modal.footer.innerHTML = dayfooter;

            modal.footer.querySelector("#se-close").addEventListener("click", e => {
                if (e.target.textContent == "Close") {
                    modal.hide();
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

            modal.addEventListener("hidden.bs.modal", () => {
                this.dispatchEvent("calendar:update", c);
            })
            
            modal.show()
            return false;
        }
    })

    this.addEventListener("postrender", function oneoff() {
        c.dispatchEvent(new CustomEvent("redraw"));
        this.removeEventListener("postrender", oneoff);
    })

    return c
}

export function diaryGraphRenderer(section) {
    let holder = document.createElement("section");
    holder.setAttribute("id", "diary-page-graphs");

    holder.innerHTML = `
    <h4>My Side-effects</h4>
    <div id="se-graph-title">Here you can see an overview of the frequency and severity of side-effects you recorded.</div>
    <small class="instructions">You can select the time period to display your side-effects by clicking on the buttons below. For example, to see side-effects you have recorded in the past 14 days click '14 Days'.
    <br /><br />This graph shows you all the side-effects you have entered, but you can also choose to just look at just one side-effect on its own. By clicking on the side-effects you DO NOT want to view in the graph key, they will appear with a line through which will remove them from the graph.</small>
    <div class="chart-controls">
        <button class="btn btn-light btn-sm" id="resetZoom">Reset</button>
        <div class="btn-group">
            <button class="btn btn-light btn-sm" id="zoomWeek">7 Days</button>
            <button class="btn btn-primary btn-sm" id="zoomFortnight">14 Days</button>
            <button class="btn btn-light btn-sm" id="zoomMonth">30 Days</button>
            <button class="btn btn-light btn-sm" id="zoomQuarter">90 Days</button>
        </div>
    </div>
    <div class="chart-container" style="position: relative;">
        <canvas id="se-trends"></canvas>
    </div>
    `

    function updateChart(entries, drugs, schema) {
        var now = new Date();
        var week = new Date().setDate(now.getDate() - 7);
        var fortnight = new Date().setDate(now.getDate() - 14);
        var month = new Date().setDate(now.getDate() - 30);
        var quarter = new Date().setDate(now.getDate() - 90);
        var selectedZoom = "zoomFortnight";

        var colours = {
            HotFlushes: '#633188',
            JointPain: '#3535ee',
            Fatigue: '#196b1d',
            MoodChanges: '#b3b3b2',
            NightSweats: '#f1dc1f',
            SleepProblems: '#a08db0',
            OtherSideeffects: '#40e0d0'
        }
        var datasets = [],
            drugChanges = {};

        var categories = [...new Set(entries.map(entry => { return entry.description }))]

        categories.forEach(category => {

            var dates = entries.filter((entry) => entry.description === category).map(entry => { return entry.date });
            var values = entries.filter((entry) => entry.description === category).map(entry => { return entry.severity })

            var data = [];

            dates.forEach((date, index) => {
                data.push({ x: date, y: values[index] })
            })

            datasets.push({
                label: category,
                data: data,
                fill: false,
                borderColor: colours[category.replace(/ /g,'')],
                backgroundColor: colours[category.replace(/ /g,'')],
                tension: 0.1
            })
        })

        const data = {
            labels: entries.map(entry => { return entry.date }),
            datasets: datasets
        };

        drugs.forEach((drug, index) => {
            drugChanges['drug' + index] = {
                type: 'line',
                xMin: new Date(drug.date).valueOf(),
                xMax: new Date(drug.date).valueOf(),
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 2,
                label: {
                    content: drug.drug,
                    enabled: true
                }
              }
        })

        const ctx = document.getElementById('se-trends');
        const seChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Severity'
                        },
                        labelString: 'Severity',
                        min: 0,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 14
                            }
                        }
                    },
                    x: {
                        labelString: 'Date',
                        type: 'time',
                        min: fortnight,
                        max: now,
                        time: {
                            unit: 'day',
                            displayFormats: {
                                quarter: 'DD MM'
                            }
                        },
                        ticks: {
                            font: {
                                size: 14
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: (tooltip) => {
                                return tooltip[0].label.split(',')[0]
                            }
                        }
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            modifierKey: 'shift'
                        },
                        limits: {
                            x: {
                                max: now.valueOf()
                            }
                        },
                        zoom: {

                        }
                    },
                    annotation: {
                        annotations: drugChanges
                    }
                }
            }
        });

        document.addEventListener("click", function(e){
            if(e.target){
                switch(e.target.id) {
                    case 'resetZoom':
                        seChart.options.scales.x.min = fortnight
                        seChart.update()
                        seChart.resetZoom()

                        document.getElementById(selectedZoom).classList.remove('btn-primary');
                        document.getElementById(selectedZoom).classList.add('btn-light');
                        selectedZoom = e.target.id
                        document.getElementById('zoomFortnight').classList.remove('btn-light');
                        document.getElementById('zoomFortnight').classList.add('btn-primary');
                        break;
                    case 'zoomWeek':
                        seChart.options.scales.x.min = week
                        seChart.update();
                        document.getElementById(selectedZoom).classList.remove('btn-primary');
                        document.getElementById(selectedZoom).classList.add('btn-light');
                        selectedZoom = e.target.id
                        e.target.classList.remove('btn-light');
                        e.target.classList.add('btn-primary');
                        break;
                    case 'zoomFortnight':
                        seChart.options.scales.x.min = fortnight
                        seChart.update();
                        document.getElementById(selectedZoom).classList.remove('btn-primary');
                        document.getElementById(selectedZoom).classList.add('btn-light');
                        selectedZoom = e.target.id
                        e.target.classList.remove('btn-light');
                        e.target.classList.add('btn-primary');
                        break;
                    case 'zoomMonth':
                        seChart.options.scales.x.min = month
                        seChart.update();
                        document.getElementById(selectedZoom).classList.remove('btn-primary');
                        document.getElementById(selectedZoom).classList.add('btn-light');
                        selectedZoom = e.target.id
                        e.target.classList.remove('btn-light');
                        e.target.classList.add('btn-primary');
                        break;
                    case 'zoomQuarter':
                        seChart.options.scales.x.min = quarter
                        seChart.update();
                        document.getElementById(selectedZoom).classList.remove('btn-primary');
                        document.getElementById(selectedZoom).classList.add('btn-light');
                        selectedZoom = e.target.id
                        e.target.classList.remove('btn-light');
                        e.target.classList.add('btn-primary');
                        break;
                    default:
                        e.preventDefault
                }
            }
        });
    }

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
    })

    Promise.allSettled([
        fetch(`/myapp/mydiary`).then(response => response.json()),
        fetch("/app/schemas/sideeffects").then(response => response.json())
    ]).then(([diary,schema]) => {

        diary = diary.value;
        let se = [].concat(...Object.keys(diary).map(d => "sideeffects" in diary[d]? diary[d].sideeffects.map(se => Object.assign(se, { date: d}) ): []) );
        let drugs = [].concat(...Object.keys(diary).map(d => "drugs" in diary[d]? diary[d].drugs : []));
        // updateGeneral(se, schema.value);
        // let spec = holder.querySelector("select").value;
        // updateSpecific(se.filter(i => i.type == spec));
        updateChart(se, drugs, schema.value)
    })

    return holder;
}
