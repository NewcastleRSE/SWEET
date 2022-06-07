export function menuRenderer(section) {
    const holder = document.createElement("div");
    holder.setAttribute("class", "row row-cols-xl-1 row-cols-1 row-cols-sm-1 g-3 mt-3 nav-normal");

    section.content.forEach(item => {
        if (item.type != "menu-item") throw `DataError: expected type "menu-item", received type "${item.type}"`;
        this.render(item).then(node => holder.appendChild(node));
    });
    return holder;
}

export function menuItemRenderer(section) {
    const holder = document.createElement("div");
    holder.setAttribute("class", "d-block col");

    const card = document.createElement("a");
    card.setAttribute("class", "d-block card submenu h-100");
    card.setAttribute("href", section.link);

    const cardBody = document.createElement("div");
    cardBody.setAttribute("class", "card-body");

    const cardTitle = document.createElement("h5");
    cardTitle.setAttribute("class", "card-title fw-normal");
    if (section.title.indexOf("&") > -1) {
        cardTitle.innerHTML = section.title; // assuming we have & due to html entities
    } else {
        cardTitle.textContent = section.title;
    }
    cardBody.appendChild(cardTitle);
    card.appendChild(cardBody);
    holder.appendChild(card);
    
    if (section.icon && section.icon != "none") {
        const icon = document.createElement("img");
        fetch(`/app/resources/${section.icon}`)
            .then(response => response.json())
            .then(resource => {
                icon.setAttribute("src", resource.source);
                card.style.backgroundImage = "url('" + resource.source + "')"; ;
            })
    }
    
    return holder;
}

export function describedMenuRenderer(section) {
    const holder = document.createElement("div");
    holder.setAttribute("class", "row g-3 mt-3 nav-described");

    section.content.forEach(item => {
        if (item.type != "described-menu-item") throw `DataError: expected type "menu-item", received type "${item.type}"`;
        this.render(item).then(node => holder.appendChild(node));
    });
    return holder;
}

export async function describedMenuItemRenderer(section) {
    const holder = document.createElement("div");
    holder.setAttribute("class", "col-12 row");

    const md = await this.render(section.description);
    md.classList.add("col-8", "col-md-9", "col-xl-10");
    holder.appendChild(md);

    const card = document.createElement("a");
    card.classList.add("d-block", "card", "col-4", "col-md-3", "col-xl-2");
    card.setAttribute("href", section.link);

    const cardBody = document.createElement("div");
    cardBody.setAttribute("class", "card-body");

    const cardTitle = document.createElement("h5");
    cardTitle.setAttribute("class", "card-title fw-normal");
    if (section.title.indexOf("&") > -1) {
        cardTitle.innerHTML = section.title; // assuming we have & due to html entities
    } else {
        cardTitle.textContent = section.title;
    }
    cardBody.appendChild(cardTitle);
    card.appendChild(cardBody);
    holder.appendChild(card);
    
    return holder;
}
