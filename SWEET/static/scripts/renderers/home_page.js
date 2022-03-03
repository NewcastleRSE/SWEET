export function homepageMenuRenderer(section) {
    if (section.type != "homepage-menu") return null;
    function createItem() {
        let holder = document.createElement("div");
        holder.setAttribute("class", "d-block col");
        holder.innerHTML = `
        <div class="card text-center">
        <a class="d-block card" href=""</a>
            <div class="card-body">
                <h5 class="card-title"></h5>
                <p class="card-text"></p>
                <a href="" class="btn btn-primary">Read More</a>
            </div>
        </a>`

        holder.$link = holder.querySelector("a");
        holder.$title = holder.querySelector(".card-title");
        holder.$subtitle = holder.querySelector(".card-text");
        return holder;
    }

    let menu = document.createElement("div");
    menu.setAttribute("class", "row homemenu");

    menu.innerHTML = `
    <div class="col-12 col-xl-8 row row-cols-1 row-cols-lg-2 g-3 mt-3 hmpg-sects"></div>
    <div class="col-12 col-xl-4 row row-cols-1 row-cols-lg-3 row-cols-xl-1 g-3 mt-3 hmpg-acts"></div>
    `

    menu.$sections = menu.querySelector(".hmpg-sects");
    menu.$actions = menu.querySelector(".hmpg-acts");


    section.mainitems.forEach(i => {
        let item = createItem();
        item.$title.textContent = i.title;
        item.$subtitle.textContent = i.description;
        item.$link.setAttribute("href", i.link);
        //item.$link.classList.add("pb-5");

        if (i.icon && i.icon != "none") {

            fetch(`/app/resources/${i.icon}`)
                .then(response => response.json())
                .then(resource => {
                    let img = item.$link.appendChild(document.createElement("img"))
                    img.src = resource.source;
                    img.classList.add("card-icon");
                })
        }

        menu.$sections.appendChild(item);
    })

    section.sideitems.forEach(i => {
        let item = createItem();
        item.$title.textContent = i.title;
        item.$subtitle.textContent = i.description;
        item.$link.setAttribute("href", i.link);
        //item.$link.classList.add("pb-5");

        if (i.icon && i.icon != "none") {

            fetch(`/app/resources/${i.icon}`)
                .then(response => response.json())
                .then(resource => {
                    let img = item.$link.appendChild(document.createElement("img"))
                    img.src = resource.source;
                    img.classList.add("card-icon");
                })
        }

        menu.$actions.appendChild(item);
    })

    let profiler = createItem();
    profiler.$title.textContent = section.profiler.title;
    profiler.$subtitle.textContent = section.profiler.description;
    profiler.$link.setAttribute("href", "#home/my-support");

    if (section.profiler.icon && section.profiler.icon != "none") {
        //profiler.$link.classList.add("pb-5");

        fetch(`/app/resources/${section.profiler.icon}`)
            .then(response => response.json())
            .then(resource => {
                let img = profiler.$link.appendChild(document.createElement("img"))
                img.src = resource.source;
                img.classList.add("card-icon");
            })
    }

    profiler.$link.addEventListener("click", e => {
        e.preventDefault();
        fetch("/myapp/profiler/responses").then(response => response.json())
            .then(output => {
                if (output.profilers.length) {
                    this.path = profiler.$link.getAttribute("href");
                } else {
                    let latestp = this.store.get("latestProfiler");
                    latestp.type = "profiler";
                    this.render(latestp);
                }
            })
    })

    menu.$actions.insertBefore(profiler, menu.$actions.firstChild);

    // check if we need to display a profiler:
    let latestp = this.store.get("latestProfiler")
    let today = this.calendarDate(new Date());

    if (
        (latestp.result == "postponed" && latestp.reminderDate <= today) ||
        (!('result' in latestp) && latestp.dueDate <= today)
    ) {
        latestp.type = "profiler";
        this.render(latestp);
    }

    return menu;
}
