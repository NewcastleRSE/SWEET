export function render_home_menu(section) {
    if (section.type != "homepage-menu") return null;

    function createItem() {
        let holder = document.createElement("div");
        holder.setAttribute("class", "d-block col");
        holder.innerHTML = `
        <a class="d-block card shadow h-100" href="">
            <div class="card-body">
                <h5 class="card-title"></h5>
                <p class="card-text"></p>
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
    <div class="col-12 col-xl-4 row row-cols-1 row-cols-lg-2 row-cols-xl-1 g-3 mt-3 hmpg-acts"></div>
    <div class="col-12 row row-cols-1 g-3 mt-3 hmpg-prof"></div>
    `

    menu.$sections = menu.querySelector(".hmpg-sects");
    menu.$actions = menu.querySelector(".hmpg-acts");
    menu.$profiler = menu.querySelector(".hmpg-prof");

    section.mainitems.forEach(i => {
        let item = createItem();
        item.$title.textContent = i.title;
        item.$subtitle.textContent = i.description;
        item.$link.setAttribute("href", i.link);
        item.$link.classList.add("pb-5");

        if (i.icon && i.icon != "none") {

            fetch(`/app/resources/${i.icon}`)
            .then(response => response.json())
            .then(resource => {
                item.$link.style.backgroundImage = `url("${resource.source}")`;
            })
        }

        menu.$sections.appendChild(item);
    })

    section.sideitems.forEach(i => {
        let item = createItem();
        item.$title.textContent = i.title;
        item.$subtitle.textContent = i.description;
        item.$link.setAttribute("href", i.link);
        item.$link.classList.add("pb-5");

        if (i.icon && i.icon != "none") {

            fetch(`/app/resources/${i.icon}`)
            .then(response => response.json())
            .then(resource => {
                item.$link.style.backgroundImage = `url("${resource.source}")`;
            })
        }

        menu.$actions.appendChild(item);
    })

    let profiler = createItem();
    profiler.$title.textContent = section.profiler.title;
    profiler.$subtitle.textContent = section.profiler.description;
    profiler.$link.setAttribute("href", "#");
    profiler.$link.classList.remove("h-100");

    profiler.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation();

        renderProfiler({ type: "profiler", dueDate: "2021-07-14" })
    })

    if (section.profiler.icon && section.profiler.icon != "none") {
        profiler.$link.classList.add("pb-5");

        fetch(`/app/resources/${i.icon}`)
        .then(response => response.json())
        .then(resource => {
            profiler.$link.style.backgroundImage = `url("${resource.source}")`;
        })
    }

    menu.$profiler.appendChild(profiler);

    return menu;
}
