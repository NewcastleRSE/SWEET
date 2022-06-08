
const calendarutils = {
    monthnames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    attributise: (d) => `${d.getFullYear()}-${d.getMonth()<9?"0":""}${d.getMonth()+1}-${d.getDate()<10?"0":""}${d.getDate()}`
}

function populateDays(body, basedate=new Date()) {
    let months31 = [0,2,4,6,7,9,11]; // Jan, Mar, May, Jul, Aug, Oct, Dec
    let day1 = new Date(basedate.getFullYear(), basedate.getMonth());
    
    // set rows required to fit current month: 
    // 5 unless 
    //   * 1st is a Sun & it's not Feb
    //   * 1st is a Sat & month has 31 days
    let rows = 5;
    if ((day1.getDay() == 0 && day1.getMonth() != 1) || (day1.getDay() == 6 && months31.includes(basedate.getMonth()))) rows = 6;

    // If the 1st isn't a Monday, start the calendar on the Monday before it;
    if (day1.getDay() != 1) {
        let countback = day1.getDay() == 0? 6: day1.getDay() - 1;
        day1.setDate(day1.getDate() - countback);
    }
    
    body.innerHTML = "";
    for (let w=0; w<rows; w++) {
        let row = body.appendChild(document.createElement("tr"));
        row.setAttribute("role", "row");
        for (let d of [0,1,2,3,4,5,6]) {
            let days = 7*w+d;
            let thisdate = new Date(day1.getFullYear(), day1.getMonth(), day1.getDate() + days);
            let cell = row.appendChild(document.createElement("td"));
            cell.setAttribute("role", "gridcell");
            cell.setAttribute("data-thisdate", calendarutils.attributise(thisdate));
        }
    }
}

function populateMonths(body) {
    body.innerHTML = "";
    let months = [["Jan", "Feb", "Mar", "Apr"], ["May", "Jun", "Jul", "Aug"], ["Sep", "Oct", "Nov", "Dec"]]
    for (let block of months) {
        let row = body.appendChild(document.createElement("tr"));
        row.setAttribute("role", "row")
        for (let month of block) {
            let cell = row.appendChild(document.createElement("td"));
            cell.setAttribute("role", "gridcell");
            cell.setAttribute("data-thismonth", month);
            cell.textContent = month;
        }
    }
}

export function createCalendar(selectedDate=new Date()) {
    let cal = document.createElement("table");
    cal.classList.add("calendar");
    cal.setAttribute("role", "grid")
    cal.setAttribute("aria-labelledby", "calendar-caption")

    let prevMonth = new Date()
    prevMonth.setMonth(selectedDate.getMonth()-1)
    let nextMonth = new Date()
    nextMonth.setMonth(selectedDate.getMonth()+1)

    let caption = cal.appendChild(document.createElement("caption"));
    caption.innerHTML = `<section><span id="cal-prev" class="prev">${calendarutils.monthnames[prevMonth.getMonth()]} ${prevMonth.getFullYear()}</span>
    <span id="cal-caption" data-basemonth="${calendarutils.attributise(selectedDate).substr(0,7)}">${calendarutils.monthnames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}</span>
    <span id="cal-next" class="next">${calendarutils.monthnames[nextMonth.getMonth()]} ${nextMonth.getFullYear()}</span></section>`;
    caption.setAttribute("id", "calendar-caption")

    let tbody = cal.appendChild(document.createElement("tbody"));
    tbody.setAttribute("role", "rowgroup");

    tbody.dataset.mode = "select";

    populateDays(tbody, selectedDate);
    
    cal.querySelector(`[data-thisdate='${calendarutils.attributise(selectedDate)}']`).classList.add("selected");
    cal.querySelector(`[data-thisdate='${calendarutils.attributise(selectedDate)}']`).focus();
    
    // prevent calendar from receiving pointer focus 
    
    // I don't think this will break accessibility (should still be kb navigable):
    // I think this was an issue when I used the calendar as part of an input widget
    // this may not be required in all situations; will assess later [JM-19.11.2021]
    cal.addEventListener("mousedown", e => e.preventDefault());

    cal.addEventListener("click", e => {
        if (tbody.dataset.mode != "select") e.stopImmediatePropagation();

        let src = e.target;

        if (src.matches("caption span, caption span *")) {
            e.stopPropagation();

            // click on span within caption: get the span to determine action:
            while (src.tagName != "SPAN") {
                src = src.parentElement;
            }

            // if (src.hasAttribute("id")) {
            //     // must be the month header, as prev & next don't get assigned ID
            //     // replace calendar body with months display
            //     // <awaiting implementation of new month selector below> populateMonths(c.querySelector("tbody"));
            // } else {
                let dir = src.classList.contains("prev")? -1: src.classList.contains("next")? 1: 0;
                
                // no id, no prev/next class, someone's been messing with the code!
                if (dir == 0) throw `Unknown span in calendar caption: ${src}`;

                // base calendar date off 14th (mid-month) so we don't get unexpected behaviour at end of month/with Feb
                let basedate = new Date(cal.querySelector("#cal-caption").dataset.basemonth + "-14T12:00:00Z");
                basedate.setMonth(basedate.getMonth() + dir);
                populateDays(cal.querySelector("tbody"), basedate);

                let prevMonth = new Date()
                prevMonth.setMonth(basedate.getMonth()-1)
                let nextMonth = new Date()
                nextMonth.setMonth(basedate.getMonth()+1)

                cal.querySelector("#cal-caption").textContent = `${calendarutils.monthnames[basedate.getMonth()]} ${basedate.getFullYear()}`;
                cal.querySelector("#cal-caption").dataset.basemonth = calendarutils.attributise(basedate).substr(0,7);

                cal.querySelector("#cal-prev").textContent = `${calendarutils.monthnames[prevMonth.getMonth()]} ${prevMonth.getFullYear()}`;
                cal.querySelector("#cal-next").textContent = `${calendarutils.monthnames[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`;

                cal.dispatchEvent(new CustomEvent("redraw"));
            //}
        }
    })

    return cal;
}

