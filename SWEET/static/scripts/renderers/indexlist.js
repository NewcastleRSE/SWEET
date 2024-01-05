export function indexListRenderer(section) {

    if (section.type != "index-list") return null;

    let holder = document.createElement("section");
    holder.classList.add("all-pages")

    return holder;
}

