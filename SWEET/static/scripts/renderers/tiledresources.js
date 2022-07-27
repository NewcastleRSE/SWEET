export function tiledResourcesRenderer(section) {
    if (section.type != "tiledresources") return null;

    let holder = document.createElement("section");
    holder.classList.add("row", "tiles-row")

    Promise.allSettled(section.resources.map(r => fetch(`/app/resources/${r}`).then(response => response.json())))
    .then(results => {
        results.filter(r => r.status == "fulfilled").map(r => r.value).forEach(resource => {
            if (resource['content-type'] === undefined || resource['content-type'].startsWith("image")) {
                let tile = document.createElement("div");
                tile.classList.add("col", "resource-tile");

                let img = document.createElement("img");
                img.classList.add("tile-img")
                img.setAttribute("src", resource.source);
                img.setAttribute("alt", resource.description);
                img.setAttribute("title", resource.caption);
                tile.appendChild(img);

                let caption = tile.appendChild(document.createElement("span"));
                caption.classList.add("tile-caption");
                caption.textContent = resource.caption;

                holder.appendChild(tile);
            } else {
                console.log("Attempt to add a non-image resource to a tiled slide: is this OK?");
            }
        })
    })
    

    return holder;
}