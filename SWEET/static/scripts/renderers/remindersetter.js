export function reminderRenderer(section) {
    let holder = document.createElement("section");

    fetch("/myapp/myreminders").then(response => response.json())
    .then(reminders => {

        let currentState = reminders

        holder.innerHTML = `
            <form id="diary-reminders">
            <fieldset><p><input type="checkbox" class="" name="daily" id="daily" ${reminders.daily.reminder? "checked": ""}><label class="h5" for="daily" >I would like a daily reminder to take my hormone therapy</label></p>
            <p>Remind me every day at <input name="daily-time" type="time" ${reminders.daily.reminder? `value="${reminders.daily.time}`: "disabled"}"/><br><br>
            Send my reminder by <select name="daily-method"${reminders.daily.reminder? "": " disabled"}><option>---</option><option value="email"${reminders.daily.reminder && reminders.daily.method=="email"? " selected":""}>Email</option><option value="sms"${reminders.daily.reminder && reminders.daily.method=="sms"? " selected":""}>Text Message</option></select> to <input name="daily-to" oninput="this.size = this.value.length" type="text" minlength="3" maxlength="50" required ${reminders.daily.reminder? `value="${reminders.daily.to}"`: "disabled"} />.</p>
            </fieldset>
            <fieldset><p><input type="checkbox" name="monthly" id="monthly" ${ reminders.monthly.reminder? "checked": ""}><label class="h5" for="monthly">I would like a regular reminder to collect my prescription</label></p>
            
            <p>Remind me every <select name="monthly-freq"${reminders.monthly.reminder? "": " disabled"}>
            <option value="one"${reminders.monthly.reminder && reminders.monthly.frequency=="one"? " selected":""}>Month</option>
            <option value="two"${reminders.monthly.reminder && reminders.monthly.frequency=="two"? " selected":""}>Two Months</option>
            <option value="three"${reminders.monthly.reminder && reminders.monthly.frequency=="three"? " selected":""}>Three Months</option>
            </select> starting on <input name="monthly-start" type="date" required ${reminders.monthly.reminder? `value="${reminders.monthly.start}"`: "disabled"} />.<br><br>
            
            Send my reminder by <select name="monthly-method"${reminders.monthly.reminder? "": " disabled"}><option>---</option><option value="email"${reminders.monthly.reminder && reminders.monthly.method=="email"? " selected":""}>Email</option><option value="sms"${reminders.monthly.reminder && reminders.monthly.method=="sms"? " selected":""}>Text Message</option></select> to <input name="monthly-to" oninput="this.size = this.value.length" type="text" minlength="3" maxlength="50" required ${reminders.monthly.reminder? `value="${reminders.monthly.to}"`: "disabled"} /></p>
            </fieldset>
            <input type="submit" value="Update Reminders" class="btn btn-primary" disabled>
            </form>
        `
        // grow 'to' boxes to fit content if there is anything saved
        if (reminders.monthly.to) {
            let value = this.store.get("currentUser")[reminders.monthly.method=="sms" ? "mobile":"email"];
            holder.querySelector(`[name='monthly-to']`).setAttribute('size', value.length)
        }
        if (reminders.daily.to) {
            let value = this.store.get("currentUser")[reminders.daily.method=="sms" ? "mobile":"email"];
            holder.querySelector(`[name='daily-to']`).setAttribute('size', value.length)
        }


        holder.querySelector("form").addEventListener("submit", e => {
            e.preventDefault();
            let form = e.currentTarget;
            let dailyModifier = "";
            let monthlyModifier = "";
            let message;

            let reminders = {
                'daily': {
                    'reminder': form.elements['daily'].checked,
                    'time': form.elements['daily'].checked? form.elements['daily-time'].value: "",
                    'method': form.elements['daily'].checked? form.elements['daily-method'].value: "",
                    'to': form.elements['daily'].checked? form.elements['daily-to'].value: ""
                },
                'monthly': {
                    'reminder': form.elements['monthly'].checked,
                    'frequency': form.elements['monthly'].checked? form.elements['monthly-freq'].value: "",
                    'start': form.elements['monthly'].checked? form.elements['monthly-start'].value: "",
                    'method': form.elements['monthly'].checked? form.elements['monthly-method'].value: "",
                    'to': form.elements['monthly'].checked? form.elements['monthly-to'].value: ""
                }
            }

            // New daily reminder
            if((!currentState.daily.reminder && form.elements['daily'].checked)) {
                dailyModifier = "created a"
            }
            // Updated daily reminder
            else if (currentState.daily.reminder && form.elements['daily'].checked) {
                if(JSON.stringify(currentState.daily) !== JSON.stringify(reminders.daily)){
                    // Objects are different so there are changes
                    dailyModifier = "updated your"
                }
            }
            // Deleted daily reminder
            else if (currentState.daily.reminder && !form.elements['daily'].checked) {
                dailyModifier = "deleted your"
            }
            else {
                console.error("Invalid reminder state change")
            }

            // New monthly reminder
            if((!currentState.monthly.reminder && form.elements['monthly'].checked)) {
                monthlyModifier = "created a"
            }
            // Updated monthly reminder
            else if (currentState.monthly.reminder && form.elements['monthly'].checked) {
                if(JSON.stringify(currentState.monthly) !== JSON.stringify(reminders.monthly)){
                    // Objects are different so there are changes
                    monthlyModifier = "updated your"
                }
            }
            // Deletes monthly reminder
            else if (currentState.monthly.reminder && !form.elements['monthly'].checked) {
                monthlyModifier = "deleted your"
            }
            else {
                console.error("Invalid reminder state change")
            }

            // Build popup message
            if(dailyModifier && monthlyModifier) {
                message = `Great! You've ${dailyModifier} daily reminder and ${monthlyModifier} monthly reminder.`
            }
            else if(dailyModifier && !monthlyModifier) {
                message = `Great! You've ${dailyModifier} daily reminder.`
            }
            else if(!dailyModifier && monthlyModifier) {
                message = `Great! You've ${monthlyModifier} monthly reminder.`
            }

            this.post("/myapp/myreminders/", reminders).then(() => {
                currentState = reminders;
                e.submitter.setAttribute("disabled", "")
            });
            this.showPopupMessage(message);
        })

        holder.querySelector("input[name='daily']").addEventListener("change", e => {
            holder.querySelectorAll("[name^='daily-']").forEach(f => {
                if (e.target.checked) {
                    f.removeAttribute("disabled");
                } else {
                    f.setAttribute("disabled", "");
                    f.value = "";
                }
            })

            holder.querySelector("input[type='submit']").removeAttribute("disabled");
        })

        holder.querySelector("input[name='monthly']").addEventListener("change", e => {
            holder.querySelectorAll("[name^='monthly-']").forEach(f => {
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
