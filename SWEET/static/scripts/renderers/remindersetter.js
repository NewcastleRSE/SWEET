export function reminderRenderer(section) {
    let holder = document.createElement("section");

    fetch("/myapp/myreminders").then(response => response.json())
    .then(reminders => {

        holder.innerHTML = `
            <form id="diary-reminders">
            <fieldset><p><input type="checkbox" name="daily" id="daily" ${reminders.daily.reminder? "checked": ""}><label class="h5" for="daily">I would like a daily reminder to take my hormone therapy</label></p>
            <p>Send my reminder by <select name="daily-method" ${reminders.daily.reminder? `value="${reminders.daily.method}"`: "disabled"}><option value="email">Email</option><option value="sms">Text Message</option></select> to <input name="daily-to" type="text" ${reminders.daily.reminder? `value="${reminders.daily.to}"`: "disabled"} />.</p>
            </fieldset>
            <fieldset><p><input type="checkbox" name="monthly" id="monthly" ${ reminders.monthly.reminder? "checked": ""}><label class="h5" for="monthly">I would like a regular reminder to collect my prescription</label></p>
            <p>Remind me every <select name="monthly-freq" ${reminders.monthly.reminder? `value="${reminders.monthly.frequency}"`: "disabled"}><option value="one">Month</option><option value="three">Three Months</option></select> starting on <input name="monthly-start" type="date" ${reminders.monthly.reminder? `value="${reminders.monthly.start}"`: "disabled"} />.<br>
            Send my reminder by <select name="monthly-method" ${reminders.monthly.reminder? `value="${reminders.monthly.method}"`: "disabled"}><option value="email">Email</option><option value="sms">Text Message</option></select> to <input name="monthly-to" type="text" ${reminders.monthly.reminder? `value="${reminders.monthly.to}"`: "disabled"} /></p>
            </fieldset>
            <input type="submit" value="Update Reminders" class="btn btn-primary" disabled>
            </form>
        `

        holder.querySelector("form").addEventListener("submit", e => {
            e.preventDefault();
            let form = e.currentTarget;

            let reminders = {
                'daily': {
                    'reminder': form.elements['daily'].checked,
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

            this.post("/myapp/myreminders/", reminders);
        })

        holder.querySelector("input[name='daily']").addEventListener("change", e => {
            holder.querySelectorAll("[name^='daily']").forEach(f => {
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
            holder.querySelectorAll("[name^='monthly']").forEach(f => {
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
    })

    return holder;
}