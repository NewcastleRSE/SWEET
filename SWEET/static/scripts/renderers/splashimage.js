export function splashImageRenderer(section) {
    if (section.type != "splashimage") return null;

    let holder = document.createElement("section");
    holder.classList.add("splash-image");

    fetch(`/app/resources/${section.resource}`).then(response => response.json())
    .then(resource => {
        if (resource['content-type'] === undefined || resource['content-type'].startsWith("image")) {
            let img = document.createElement("img");
            img.classList.add("splash");
            if (resource.source == "useblob") {
                img.setAttribute("src", `/app/resources/files/${section.resource}`);
            } else {
                img.setAttribute("src", resource.source);
            }
            img.setAttribute("alt", resource.description);
            img.setAttribute("title", resource.caption);
            holder.appendChild(img)
        } else if (resource['content-type'].startsWith("video")) {
            let src = resource.source == "useblob"? `/app/resources/files/${section.resource}`: resource.source;
            holder.insertAdjacentHTML("beforeend", `<video class="splash" title="${resource.caption}" src="${src}"><p>${resource.description}</p></video>`);
        }
    })

    return holder;
}