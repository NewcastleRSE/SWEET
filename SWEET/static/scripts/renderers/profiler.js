export function profilerModalRenderer(section) {
    // create the modal 
    if (!section.modal) {
        section.modal = this.createModal();
    }

    section.modal.size = 'lg';

    if (!section.answers) section.answers = [];
    let page = section.answers.length;
    let url = "/myapp/profiler/";

    // define the rendering logic for each page:
    const renderers = [
        () => { /* page 0 renderer */ 
            
            //section.modal.title.textContent = "Profiler";
            section.modal.body.innerHTML = `<p>Hi there, in this section you can access help and support which has been tailored to meet your needs. In order to provide this personalised support, we'd like to ask you some questions to see how you are getting on with your hormone therapy. Answering these questions will allow us to guide you to relevant sections of the SWEET website that you may find helpful.</p>
            <p>Are you happy to answer these questions?</p>`;
            section.modal.footer.innerHTML = `<button type="button" id="prof-yes" class="btn btn-primary">Yes</button>
            <button type="button" id="prof-later" class="btn btn-secondary">Complete Later</button>
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
                
                this.post(url, profilerResponse);
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
                    this.post(url, profilerResponse)
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
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="imp" id="imp-dis" value="disagree" /></td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="imp" id="imp-con" value="uncertain" /></td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="imp" id="imp-agr" value="agree" /></td>
                        </tr>
                        <tr>
                            <td class="pe-3">I have concerns about my hormone therapy.</td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="con" id="con-dis" value="disagree" /></td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="con" id="con-unc" value="uncertain" /></td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="con" id="con-agr" value="agree" /></td>
                        </tr>
                        <tr>
                            <td class="pe-3">Taking my hormone therapy is difficult for me.</td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="diff" id="diff-dis" value="disagree" /></td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="diff" id="diff-unc" value="uncertain" /></td>
                            <td class="text-center align-middle"><input class="form-check-input" type="radio" name="diff" id="diff-agr" value="agree" /></td>
                        </tr>
                    </table>
                </form>`;
                section.modal.footer.innerHTML =  `
                <button type="button" id="prof-p1-cancel" class="btn">Cancel</button>
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
                    e.stopPropagation();
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
                    <strong>Please tick all that apply to you.</strong></p>
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
                
                section.modal.footer.innerHTML = `<button type="submit" id="prof-p2-submit" class="btn btn-primary" form="prof-p2">Submit reponses</button>`

                section.modal.body.querySelector("form").addEventListener("submit", e => {
                    e.preventDefault(); e.stopPropagation();

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
                        console.log(result);
                        if (result.status == "OK") {
                            section.modal.body.innerHTML = "";
                            result.details.content.forEach(c => this.render(c).then(node => section.modal.body.appendChild(node)))

                            section.modal.footer.innerHTML = `<button type="button" class="btn btn-primary" id="prof-finish">Finish</button>`;
                            section.modal.footer.querySelector("#prof-finish").addEventListener("click", e => {
                                e.preventDefault(); e.stopPropagation();
                                section.modal.hide(true);
                            })
                        }
                    })
                })
            } else {
                // post a 'no concerns' response to the server
                const profilerResponse = {
                    dueDate: section.dueDate,
                    dateCompleted: this.calendarDate(new Date()),
                    result: "complete",
                    concernAreas: "none"
                }

                // post response
                this.post(url, profilerResponse)

                // display a closing message.
                section.modal.body.innerHTML = `<p>Great to hear that you are getting on with your hormone therapy. We will check in with you again in the next few months.</p><p>You can also access these questions at any time from the SWEET home page.</p><p>In the meantime, if you have any concerns or difficulties, you can find lots of useful information and helpful tips within Managing HT. Alternatively you can speak to your breast cancer team or your GP.</p>`
                section.modal.footer.innerHTML = ` <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>`
            }
        }
    ]

    // call the appropriate renderer:
    renderers[page].call(this, section);
}