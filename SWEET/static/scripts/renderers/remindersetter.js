export function reminderRenderer(section) {
    let holder = document.createElement("section");

    fetch("/myapp/myreminders").then(response => response.json())
    .then(reminders => {

        console.log(reminders)

        reminders.take ? reminders.take: reminders.take = {}
        reminders.order ? reminders.order: reminders.order = {}
        reminders.collect ? reminders.collect: reminders.collect = {}

        let currentState = reminders

        holder.innerHTML = `
            <form id="diary-reminders">
            <fieldset><p><input type="checkbox" class="" name="take" id="take" ${reminders.take.reminder? "checked": ""}><label class="h5" for="take" >I would like a take reminder to take my hormone therapy</label></p>
            <p>Remind me every day at <input name="take-time" type="time" ${reminders.take.reminder? `value="${reminders.take.time}`: "disabled"}"/><br><br>
            Send my reminder by <select name="take-method"${reminders.take.reminder? "": " disabled"}><option>---</option><option value="email"${reminders.take.reminder && reminders.take.method=="email"? " selected":""}>Email</option><option value="sms"${reminders.take.reminder && reminders.take.method=="sms"? " selected":""}>Text Message</option></select> to <input name="take-to" oninput="this.size = this.value.length" type="text" minlength="3" maxlength="50" required ${reminders.take.reminder? `value="${reminders.take.to}"`: "disabled"} />.</p>
            </fieldset>
            <fieldset><p><input type="checkbox" name="order" id="order" ${ reminders.order.reminder? "checked": ""}><label class="h5" for="order">I would like a regular reminder to order my prescription</label></p>
            
            <p>Remind me every <select name="order-freq"${reminders.order.reminder? "": " disabled"}>
            <option value="one"${reminders.order.reminder && reminders.order.frequency=="one"? " selected":""}>Month</option>
            <option value="two"${reminders.order.reminder && reminders.order.frequency=="two"? " selected":""}>Two Months</option>
            <option value="three"${reminders.order.reminder && reminders.order.frequency=="three"? " selected":""}>Three Months</option>
            </select> starting on <input name="order-start" type="date" required ${reminders.order.reminder? `value="${reminders.order.start}"`: "disabled"} />.<br><br>
            
            Send my reminder by <select name="order-method"${reminders.order.reminder? "": " disabled"}><option>---</option><option value="email"${reminders.order.reminder && reminders.order.method=="email"? " selected":""}>Email</option><option value="sms"${reminders.order.reminder && reminders.order.method=="sms"? " selected":""}>Text Message</option></select> to <input name="order-to" oninput="this.size = this.value.length" type="text" minlength="3" maxlength="50" required ${reminders.order.reminder? `value="${reminders.order.to}"`: "disabled"} /></p>
            </fieldset>
            <fieldset><p><input type="checkbox" name="collect" id="collect" ${ reminders.collect.reminder? "checked": ""}><label class="h5" for="order">I would like a regular reminder to collect my prescription</label></p>
            
            <p>Remind me every <select name="collect-freq"${reminders.collect.reminder? "": " disabled"}>
            <option value="one"${reminders.collect.reminder && reminders.collect.frequency=="one"? " selected":""}>Month</option>
            <option value="two"${reminders.collect.reminder && reminders.collect.frequency=="two"? " selected":""}>Two Months</option>
            <option value="three"${reminders.collect.reminder && reminders.collect.frequency=="three"? " selected":""}>Three Months</option>
            </select> starting on <input name="collect-start" type="date" required ${reminders.collect.reminder? `value="${reminders.collect.start}"`: "disabled"} />.<br><br>
            
            Send my reminder by <select name="collect-method"${reminders.collect.reminder? "": " disabled"}><option>---</option><option value="email"${reminders.collect.reminder && reminders.collect.method=="email"? " selected":""}>Email</option><option value="sms"${reminders.collect.reminder && reminders.collect.method=="sms"? " selected":""}>Text Message</option></select> to <input name="collect-to" oninput="this.size = this.value.length" type="text" minlength="3" maxlength="50" required ${reminders.collect.reminder? `value="${reminders.collect.to}"`: "disabled"} /></p>
            </fieldset>
            <input type="submit" value="Update Reminders" class="btn btn-primary" disabled>
            </form>
        `
        // grow 'to' boxes to fit content if there is anything saved
        if (reminders.collect.to) {
            let value = this.store.get("currentUser")[reminders.collect.method=="sms" ? "mobile":"email"];
            holder.querySelector(`[name='collect-to']`).setAttribute('size', value.length)
        }
        if (reminders.order.to) {
            let value = this.store.get("currentUser")[reminders.order.method=="sms" ? "mobile":"email"];
            holder.querySelector(`[name='order-to']`).setAttribute('size', value.length)
        }
        if (reminders.take.to) {
            let value = this.store.get("currentUser")[reminders.take.method=="sms" ? "mobile":"email"];
            holder.querySelector(`[name='take-to']`).setAttribute('size', value.length)
        }


        holder.querySelector("form").addEventListener("submit", e => {
            e.preventDefault();
            let form = e.currentTarget;
            let takeModifier = "";
            let orderModifier = "";
            let collectModifier = "";
            let message = "";

            let reminders = {
                'take': {
                    'reminder': form.elements['take'].checked,
                    'time': form.elements['take'].checked? form.elements['take-time'].value: "",
                    'method': form.elements['take'].checked? form.elements['take-method'].value: "",
                    'to': form.elements['take'].checked? form.elements['take-to'].value: ""
                },
                'order': {
                    'reminder': form.elements['order'].checked,
                    'frequency': form.elements['order'].checked? form.elements['order-freq'].value: "",
                    'start': form.elements['order'].checked? form.elements['order-start'].value: "",
                    'method': form.elements['order'].checked? form.elements['order-method'].value: "",
                    'to': form.elements['order'].checked? form.elements['order-to'].value: ""
                },
                'collect': {
                    'reminder': form.elements['collect'].checked,
                    'frequency': form.elements['collect'].checked? form.elements['collect-freq'].value: "",
                    'start': form.elements['collect'].checked? form.elements['collect-start'].value: "",
                    'method': form.elements['collect'].checked? form.elements['collect-method'].value: "",
                    'to': form.elements['collect'].checked? form.elements['collect-to'].value: ""
                }
            }

            // New take reminder
            if((!currentState.take.reminder && form.elements['take'].checked)) {
                takeModifier = "created a"
            }
            // Updated take reminder
            else if (currentState.take.reminder && form.elements['take'].checked) {
                if(JSON.stringify(currentState.take) !== JSON.stringify(reminders.take)){
                    // Objects are different so there are changes
                    takeModifier = "updated your"
                }
            }
            // Deleted take reminder
            else if (currentState.take.reminder && !form.elements['take'].checked) {
                takeModifier = "deleted your"
            }
            else {
                console.error("Invalid reminder state change")
            }

            // New order reminder
            if((!currentState.order.reminder && form.elements['order'].checked)) {
                orderModifier = "created a"
            }
            // Updated order reminder
            else if (currentState.order.reminder && form.elements['order'].checked) {
                if(JSON.stringify(currentState.order) !== JSON.stringify(reminders.order)){
                    // Objects are different so there are changes
                    orderModifier = "updated your"
                }
            }
            // Deletes order reminder
            else if (currentState.order.reminder && !form.elements['order'].checked) {
                orderModifier = "deleted your"
            }
            else {
                console.error("Invalid reminder state change")
            }

            // New collect reminder
            if((!currentState.collect.reminder && form.elements['collect'].checked)) {
                collectModifier = "created a"
            }
            // Updated collect reminder
            else if (currentState.collect.reminder && form.elements['collect'].checked) {
                if(JSON.stringify(currentState.collect) !== JSON.stringify(reminders.collect)){
                    // Objects are different so there are changes
                    collectModifier = "updated your"
                }
            }
            // Deletes collect reminder
            else if (currentState.collect.reminder && !form.elements['collect'].checked) {
                collectModifier = "deleted your"
            }
            else {
                console.error("Invalid reminder state change")
            }

            // Build popup message
            if(takeModifier) {
                message += ` You've ${takeModifier} daily reminder.`
            }
            if(orderModifier) {
                message += ` You've ${takeModifier} order reminder.`
            }
            if(collectModifier) {
                message += ` You've ${orderModifier} collection reminder.`
            }

            this.post("/myapp/myreminders/", reminders).then(() => {
                currentState = reminders;
                e.submitter.setAttribute("disabled", "")
            });
            this.showPopupMessage(`Great!${message}`);
        })

        holder.querySelector("input[name='take']").addEventListener("change", e => {
            holder.querySelectorAll("[name^='take-']").forEach(f => {
                if (e.target.checked) {
                    f.removeAttribute("disabled");
                } else {
                    f.setAttribute("disabled", "");
                    f.value = "";
                }
            })

            holder.querySelector("input[type='submit']").removeAttribute("disabled");
        })

        holder.querySelector("input[name='order']").addEventListener("change", e => {
            holder.querySelectorAll("[name^='order-']").forEach(f => {
                if (e.target.checked) {
                    f.removeAttribute("disabled");
                } else {
                    f.setAttribute("disabled", "");
                    f.value = "";
                }
            })

            holder.querySelector("input[type='submit']").removeAttribute("disabled");
        })

        holder.querySelector("input[name='collect']").addEventListener("change", e => {
            holder.querySelectorAll("[name^='collect-']").forEach(f => {
                if (e.target.checked) {
                    f.removeAttribute("disabled");
                } else {
                    f.setAttribute("disabled", "");
                    f.value = "";
                }
            })

            holder.querySelector("input[type='submit']").removeAttribute("disabled");
        })

        holder.querySelectorAll("[name*='-']").forEach(i => {
            i.addEventListener("change", () => holder.querySelector("input[type='submit']").removeAttribute("disabled"))
        })

        holder.querySelectorAll("[name$='-method'").forEach(method => {
            method.addEventListener("change", e => {
                if (e.target.value) {
                    let name = e.target.getAttribute("name")
                    let prefix = name.substring(0,name.indexOf("-")+1);
                    let value = this.store.get("currentUser")[e.target.value == "sms"? "mobile":"email"];
                    holder.querySelector(`[name='${prefix}to']`).value = value || "";
                    holder.querySelector(`[name='${prefix}to']`).setAttribute('size', value.length)
                }
            })
        })
    })

    return holder;
}
