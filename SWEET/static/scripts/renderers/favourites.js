export function favouritePageRenderer(section) {

    if (section.type != "favourites-page") return null;

    let holder = document.createElement("section");
    holder.classList.add("all-favourites")

    fetch("/myapp/favourites").then(response => response.json())
        .then(output => {
            console.log(output)
            output.favourites.forEach(favourite => {

                console.log(favourite)

                let element = document.createElement("h5");
                let link = document.createElement("a");
                link.href = favourite.path;
                link.innerText = favourite.title;
    
                element.appendChild(link);
                holder.appendChild(element)
            })
        })

    return holder;
}

