export function profilerModalRenderer(section) {
    // create the modal 
    if (!section.modal) {
        section.modal = this.createModal(true);
    }

    section.modal.size = 'lg';

    section.modal.addEventListener("click", e => {
        if (e.target.matches("button.btn-close, button.btn-close *, #prof-p1-cancel")) {
            section.answers = [];
        }
    })

    if (!section.answers) section.answers = [];
    let page = section.answers.length;
    let url = "/myapp/profiler/";

    // define the rendering logic for each page:
    const renderers = [
        () => { /* page 0 renderer */ 
            
            //section.modal.title.textContent = "Profiler";
            section.modal.body.innerHTML = `<p>Hi there, in the My Personal Support section you can access help and support which has been tailored to meet your needs. In order to provide this personalised support, we'd like to ask you some questions to see how you are getting on with your hormone therapy. Answering these questions will allow us to guide you to relevant sections of the HT&amp;Me website that you may find helpful.</p>
            <p>Are you happy to answer these questions?</p>`;
            section.modal.footer.innerHTML = `<button type="button" id="prof-later" class="btn btn-secondary">Complete Later</button>
            <button type="button" id="prof-yes" class="btn btn-primary">Yes</button>
            
            ${ section.reminderDate? `<select id="prof-no" class="btn btn-primary">
                <option>No...</option>
                <option value="no-concerns">I don't have any concerns</option>
                <option value="no-time">I don't have time for this</option>
                <option value="no-already">My questions have already been answered</option>    
            </button>`:""}`;

            section.modal.footer.querySelector("#prof-yes").addEventListener("click", () => {
                section.answers.push({
                    continue: "yes"
                });
                this.render(section);
            });
            section.modal.footer.querySelector("#prof-later").addEventListener("click", () => {
                
                // post section back to server
                const profilerResponse = {
                    dueDate: section.dueDate,
                    result: "postponed",
                    reminderDate: this.calendarDate(((d) => {d.setDate(d.getDate()+3); return d})(new Date())),
                }
                
                this.post(url, profilerResponse).then(response => response.json()).then(profiler => this.store.set("latestProfiler", profiler));
                // clear the modal
                section.modal.hide(true);
            });

            if (section.reminderDate) {
                section.modal.footer.querySelector("#prof-no").addEventListener("change", (e) => {

                    const profilerResponse = {
                        dueDate: section.dueDate,
                        dateComplete: this.calendarDate(new Date()),
                        result: "refused",
                        reason: e.currentTarget.value
                    }

                    // post section back to server
                    this.post(url, profilerResponse).then(response => response.json()).then(profiler => this.store.set("latestProfiler", profiler))
                    // clear the modal
                    section.modal.hide(true);
                });
            }

            section.modal.show();
        },
        () => { 
            /* page 1 renderer */
            
                //section.modal.title.textContent = `Profiler`;
                section.modal.body.innerHTML = `<form id="prof-p1">
                    <p>Please indicate whether you agree or disagree with the following statements:</p>
                    <table class="table table-borderless">
                        <tr><td>&nbsp;</td><th>Disagree</th><th>Uncertain</th><th>Agree</th></tr>
                        <tr>
                            <td class="pe-3">Taking my hormone therapy is very important to me.</td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="imp" id="imp-dis" value="disagree" required/></td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="imp" id="imp-con" value="uncertain" /></td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="imp" id="imp-agr" value="agree" /></td>
                        </tr>
                        <tr>
                            <td class="pe-3">I have concerns about my hormone therapy.</td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="con" id="con-dis" value="disagree" required /></td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="con" id="con-unc" value="uncertain" /></td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="con" id="con-agr" value="agree" /></td>
                        </tr>
                        <tr>
                            <td class="pe-3">Taking my hormone therapy is difficult for me.</td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="diff" id="diff-dis" value="disagree" required/></td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="diff" id="diff-unc" value="uncertain" /></td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="diff" id="diff-agr" value="agree" /></td>
                        </tr>
                    </table>
                </form>`;
                section.modal.footer.innerHTML =  `
                <button type="button" id="prof-p1-cancel" class="btn btn-secondary">Cancel</button>
                <button type="submit" id="prof-p1-submit" class="btn btn-primary" form="prof-p1">Next</button>
                `

                section.modal.body.querySelector("#prof-p1").addEventListener("submit", e => {
                    // on submit ad this page's answers to the section:
                    e.preventDefault();
                    let form = e.currentTarget;

                    section.answers.push({
                        page: 1,
                        N: form.elements['imp'].value != "agree",
                        C: form.elements['con'].value != "disagree",
                        P: form.elements['diff'].value != "disagree"
                    })

                    // then re-call the renderer to show the next page.
                    this.render(section);
                });

                // set up the cancel button
                section.modal.footer.querySelector("#prof-p1-cancel").addEventListener("click", e => {
                    section.modal.hide(true);
                })

        },
        () => {
            /* page 2  renderer */
            let answers = section.answers[1];
            const concerns = (answers.N || answers.C || answers.P);

            if (concerns) {
                // render further questions:
                section.modal.body.innerHTML = `<form id="prof-p2">
                    <p>We'd like to ask you for a bit more detail.<br>
                    <strong>Please tick all that apply to you.</strong><br>
                    Please note that you may need to scroll to see all the text.</p>
                    <table class="table table-borderless">
                        <thead>
                            <tr>
                                <th>&nbsp;</th>
                                <th>Agree</th>
                            </tr>
                        </thead>
                        <tbody id="N-concerns">
                            <tr>
                                <td class="pe-3">I sometimes doubt that I need to take hormone therapy</td>
                                <td class="text-center align-middle"><input type="checkbox" name="agree" value="N1" class="form-check-input">
                            </tr>
                            <tr>
                                <td class="pe-3">I’m not convinced that I need to take hormone therapy for 5-10 years</td>
                                <td class="text-center align-middle"><input type="checkbox" name="agree" value="N2" class="form-check-input"></td>
                            </tr>
                            <tr>
                                <td class="pe-3">I would prefer to use other methods to protect myself from the cancer coming back (e.g. diet, exercise)</td>
                                <td class="text-center align-middle"><input type="checkbox" name="agree" value="N3" class="form-check-input"></td>
                            </tr>
                            <tr>
                                <td class="pe-3">I’m not convinced that hormone therapy is worth it for me</td>
                                <td class="text-center align-middle"><input type="checkbox" name="agree" value="N4" class="form-check-input"></td>
                            </tr>
                        </tbody>
                        <tbody id="C-concerns">
                            <tr>
                                <td class="pe-3">I am concerned about getting side effects in the future </td>
                                <td class="text-center align-middle"><input type="checkbox" name="agree" value="C1" class="form-check-input"></td>
                            </tr>
                            <tr>
                                <td class="pe-3">I am concerned about the side effects I am experiencing now</td>
                                <td class="text-center align-middle"><input type="checkbox" name="agree" value="C2" class="form-check-input"></td>
                            </tr>
                            <tr>
                                <td class="pe-3">I am concerned about the possible longer term effects of taking hormone therapy</td>
                                <td class="text-center align-middle"><input type="checkbox" name="agree" value="C3" class="form-check-input"></td>
                            </tr>
                            <tr>
                                <td class="pe-3">Hormone therapy is an unwelcome reminder that I have had breast cancer</td>
                                <td class="text-center align-middle"><input type="checkbox" name="agree" value="C4" class="form-check-input"></td>
                            </tr>
                            <tr>
                                <td class="pe-3">My hormone therapy has been changed to a brand which doesn’t suit me</td>
                                <td class="text-center align-middle"><input type="checkbox" name="agree" value="C5" class="form-check-input"></td>
                            </tr>
                        </tbody>
                        <tbody id="P-concerns">
                            <tr>
                                <td class="pe-3">I am not clear on how to take my hormone therapy</td>
                                <td class="text-center align-middle"><input type="checkbox" name="agree" value="P1" class="form-check-input"></td>
                            </tr>
                            <tr>
                                <td class="pe-3">I sometimes forget to take my hormone therapy</td>
                                <td class="text-center align-middle"><input type="checkbox" name="agree" value="P2" class="form-check-input"></td>
                            </tr>
                            <tr>
                                <td class="pe-3">I need support with my prescriptions (e.g. remembering to collect prescriptions)</td>
                                <td class="text-center align-middle"><input type="checkbox" name="agree" value="P3" class="form-check-input"></td>
                            </tr>
                        </tbody>
                        <tbody>
                            <tr>
                                <td class="pe-3">I have another concern which isn’t listed above</td>
                                <td class="text-center align-middle"><input type="checkbox" name="agree" value="G1" class="form-check-input"></td>
                            </tr>
                        </tbody>
                    </table>
                </form>`


                if (!answers.P) {
                    section.modal.body.querySelector("#P-concerns").remove();
                }
                if (!answers.N) {
                    section.modal.body.querySelector("#N-concerns").remove();
                }
                if (!answers.C) {
                    section.modal.body.querySelector("#C-concerns").remove();
                }

                section.modal.footer.insertAdjacentHTML("beforeend", `<button type="submit" id="prof-p2-submit" class="btn btn-primary" form="prof-p2">Submit reponses</button>`)
                section.modal.footer.querySelector("#prof-p1-submit").remove();

                // temporarily hide cancel and submit buttons until user has viewed full list
                const tableRows = document.getElementsByTagName('tr');
                const finalRow = tableRows[tableRows.length-1];

                if (!isElementVisible(finalRow)) {
                    // temporarily hide cancel and submit buttons until user has viewed full list
                    section.modal.footer.querySelector("#prof-p1-cancel").style.visibility = 'hidden';
                    section.modal.footer.querySelector("#prof-p2-submit").style.visibility = 'hidden';
                }


                // add scroll event listener to identify when user has scrolled to bottom of modal
                section.modal.body.addEventListener('scroll', e => {
                    const tableRows = document.getElementsByTagName('tr');
                    const finalRow = tableRows[tableRows.length-1];

                    // display both cancel and submit buttons once visible
                    if (isElementVisible(finalRow)) {
                        section.modal.footer.querySelector("#prof-p1-cancel").style.visibility = 'visible';
                        section.modal.footer.querySelector("#prof-p2-submit").style.visibility = 'visible';
                    }

                })

                section.modal.body.querySelector("form").addEventListener("submit", e => {
                    e.preventDefault(); e.stopPropagation();

                    // validate that some concerns have been ticked:
                    if (Array.from(e.target.elements['agree']).filter(c => c.checked).length == 0) {
                        alert("You have not ticked any specific concern items: if you have changed your mind please use the cross to close the popup");
                        return;
                    }
                    
                    // post completed profiler;
                    const profilerResponse = {
                        dueDate: section.dueDate,
                        dateComplete: this.calendarDate(new Date()),
                        result: "complete",
                        concernAreas: ((n,c,p) => {let a = []; if (n) a.push("Necessity"); if (c) a.push("Concern"); if (p) a.push("Practicality"); return a.join(",")})(answers.N, answers.C, answers.P),
                        concernSpecifics: Array.from(e.target.elements['agree']).filter(c => c.checked).map(c => c.value)
                    }

                    this.post(url, profilerResponse).then(response => response.json())
                    .then(result => {
                        if (result.status == "OK") {

                            this.store.set("latestProfiler", result)
                            // following implementation of "My Personal Support" page, can close modal and reidrect app:

                            if (this.path == "#home/my-support") { 
                                this.load();
                                section.modal.hide();
                            } else {

                                section.modal.body.innerHTML = `
                                    <p>Based on your responses, we selected a series of topics which were tailored to your concerns. To read them now <a href="#home/my-support">visit the My Personal Support section</a></p>
                                    <p>You can read these at any time my clicking the 'My Personal Support' button on the website home page. You can now close this window.</p>
                                `;
                                section.modal.body.querySelector("a").addEventListener("click", () => section.modal.hide());
                                section.modal.footer.innerHTML = `<button type="button" class="btn btn-primary" id="prof-finish">Close</button>`;
                                section.modal.footer.querySelector("#prof-finish").addEventListener("click", e => {
                                    e.preventDefault(); e.stopPropagation();
                                    section.modal.hide(true);
                                })
                            }
                        }
                    })
                })
            } else {
                // post a 'no concerns' response to the server
                const profilerResponse = {
                    dueDate: section.dueDate,
                    dateComplete: this.calendarDate(new Date()),
                    result: "complete",
                    concernAreas: "none"
                }

                // post response
                this.post(url, profilerResponse).then(response => response.json()).then(profiler => this.store.set("latestProfiler", profiler))
                

                // display a closing message.
                section.modal.body.innerHTML = `<p>Great to hear that you are getting on well with your hormone therapy. We will check in with you again in the next few months.</p><p>You can also access these questions at any time from the My Personal Support page.</p><p>In the meantime, if you have any concerns or difficulties, you can find lots of useful information and helpful tips within HT &amp Me. Alternatively you can speak to your breast cancer team or your GP.</p>`
                section.modal.footer.innerHTML = ` <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>`
            }
        }
    ]

    // call the appropriate renderer:
    renderers[page].call(this, section);
}

function isElementVisible(el) {
    var rect     = el.getBoundingClientRect(),
        vWidth   = window.innerWidth || document.documentElement.clientWidth,
        vHeight  = window.innerHeight || document.documentElement.clientHeight,
        efp      = function (x, y) { return document.elementFromPoint(x, y) };

    // Return false if it's not in the viewport
    if (rect.right < 0 || rect.bottom < 0
        || rect.left > vWidth || rect.top > vHeight)
        return false;

    // Return true if any of its four corners are visible
    return (
        el.contains(efp(rect.left,  rect.top))
        ||  el.contains(efp(rect.right, rect.top))
        ||  el.contains(efp(rect.right, rect.bottom))
        ||  el.contains(efp(rect.left,  rect.bottom))
    );
}

export function profilerResultRenderer(section) {
    if (section.type != "profiler-result") return null;

    let holder = document.createElement("article");
    holder.classList.add("profiler-result");

    if (!section.date) section.date = section.dateComplete || section.reminderDate || section.dueDate;

    holder.insertAdjacentHTML("beforeend", `<h4>Your personal support concerns on ${new Date(section.date).toDateString()}</h4>`);
    if (section.result == "postponed") {
        // handle how to show a postponed profiler during general rendering
        holder.insertAdjacentHTML("beforeend", `
        <div>
            <label for="take-profiler">You didn't have time to complete the questions last time we asked. If you want to do it now please click this button:</label>
            <button type="button" id="take-profiler" class="btn btn-primary">Answer Questions</button>
        </div>`);
        holder.querySelector("#take-profiler").addEventListener("click", e => {
            section.type="profiler";
            this.render(section);
        })
    } else if (section.result == "refused") {
        // handle refusal to complete the profiler
        holder.insertAdjacentHTML("beforeend", `
        <div>
            <p>You did not answer the questions on this occasion because ${{"no-concern": "you did not have any concerns", "no-time": "you did not have time", "no-already": "your questions had already been answered"}[section.refuseReason]}.</p>
        </div>`)
    } else if (section.result == "complete") {
        if (section.concernAreas == "none") {
            // no concern result
            holder.insertAdjacentHTML("beforeend", `<div><p>You were getting on fine with your hormone therapy when you answered the questions.</p></div>`)
        } else {
            // render concern responses (section.concernDetails : this is an accordion content section)
            holder.insertAdjacentHTML("beforeend", `
            <div>
                <p>Based on your responses, we selected a series of topics which were tailored to your concerns. You can read these below. We hope these will be helpful for you.</p>
            </div>`)

            this.render(section.concernDetails).then(node => holder.appendChild(node));
        }
    } else {
        return null;
    }

    return holder;
}

export async function profilerLauncherRenderer(section) {
    if (section.type != "profiler-launcher") return null;

    if (!section.profiler) {
        let latest = await fetch("/myapp/profiler/latest").then(response => response.json());
        if (latest.result && ["complete", "refused"].includes(latest.result)) {
            section.profiler = { dueDate: this.calendarDate(new Date()) }
        } else {
            section.profiler = latest;
        }
    }

    section.profiler.type = "profiler";

    let node = await this.render({
        type: "described-menu",
        content: [
            {
                type: "described-menu-item",
                title: "<i class='bi bi-box-arrow-up-right'>&#8203;</i>",
                link: "",
                description: {
                    type: "paragraph",
                    text: "To answer the questions now and get support personalised for your concerns, click this button:"
                }
            }
        ]
    });

    node.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation();

        this.render(section.profiler);
    });

    return node;
}

export async function myPersonalSupportRenderer(section) {
    if (section.type != "my-personal-support") return null;

    let profilers = await fetch("/myapp/profiler/responses").then(response => response.json()).then(p => p.profilers);

    profilers.sort((a, b) => a.dateComplete == b.dateComplete? 0: a.dateComplete > b.dateComplete? -1: 1);

    let latest = profilers.shift();

    let holder = document.createElement("section");
    holder.classList.add("prf-latest");
    //holder.insertAdjacentHTML("beforeend", "<h3>Your Current Suggestions</h3>");

    let message, renderDetails = false;
    if (!latest) {
        message = "It looks like you haven't completed the support questions yet.\n\nFrom time to time we'll ask you a few questions, to check how you're getting on with your hormone therapy.\n\nIf you want to answer the questions now, click the button below, or you can explore the rest of the website and we'll remind you when it's time to come back."
    } else if (latest.result == "postponed") {
        message = "You didn't have time to complete the questions last time we asked; if you want to do it now you can click the button below."
    } else if (latest.result == "refused") {
        message = `You did not answer the questions last time we asked, because ${{"no-concerns": "you did not have any concerns", "no-time": "you did not have time", "no-already": "your questions had already been answered"}[latest.refuseReason]}. If you would like to answer them now please click the button below.`;
    } else if (latest.result == "complete") {
        if (latest.concernAreas == "none") {
            message = "Great to hear that you are getting on with your hormone therapy. We will check in with you again in the next few months.\n\nYou can also access these questions at any time from the My Personal Support page.\n\nIn the meantime, if you have any concerns or difficulties, you can find lots of useful information and helpful tips within HT &amp; Me. Alternatively you can speak to your breast cancer team or your GP."
        } else {
            message = "Based on your responses, we’ve selected a series of topics which are tailored to your concerns.\n\nYou can read these now or save them and come back to them later. We hope these will be helpful for you.\n\nExpand any of the sections below to find out more.";
            renderDetails = true;
        }
    }


    await this.render({ type: "markdown", encoding: "raw", text: message}).then(node => holder.appendChild(node));
    
    if (renderDetails) {
        await this.render(latest.concernDetails).then(node => holder.appendChild(node));
        await this.render({ type: "markdown", encoding: "raw", text: "We’ll check in again in a few months. In the meantime, if you have any concerns or difficulties, you can find lots of useful information and helpful tips within the HT&amp;Me website. Alternatively you can speak to your breast cancer team or your GP.\n\n"}).then(node => holder.appendChild(node))
    }
    
    let newdets = { type: "profiler-launcher" };
    if (latest && latest.result == "postponed") newdets.profiler = latest;

    await this.render(newdets).then(node => { holder.appendChild(node); });

    if (profilers.length) {
        await this.render({ type: "markdown", encoding: "raw", text: "### Your Previous Responses and Suggestions\n\nBelow you will find a list of the results when you have answered these questions before, arranged by date with the most recent first."}).then(node => holder.appendChild(node));
console.log(profilers)
        await this.render({
            type: "accordion",
            content: profilers.map(p => { // fix-up 24/11/2021: async callback for .map was creating array of promises, *NOT* content objects. Logic here does not require async execution anyway!
                p.type = "profiler-result";
                if (!p.date) p.date = p.dateComplete || p.reminderDate || p.dueDate;
                
                return {
                    type: "accordion-item",
                    header: new Date(p.date).toDateString(),
                    content: [
                        p
                    ]
                }
            })
        }).then(node => holder.appendChild(node));
    }

    return holder;
}