function formCalendar(body, day1) {
    function attributise(d) { return d.toISOString().substr(0,10) }

    for (let w of [0,1,2,3,4]) {
        let row = body.appendChild(document.createElement("tr"));
        for (let d of [0,1,2,3,4,5,6]) {
            let days = 7*w+d;
            let thisdate = new Date(day1.getFullYear(), day1.getMonth(), day1.getDate() + days);
            let cell = row.appendChild(document.createElement("td"));
            cell.setAttribute("data-thisdate", attributise(thisdate));
        }
    }
}