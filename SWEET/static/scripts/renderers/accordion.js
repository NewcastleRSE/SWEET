export function accordionRenderer(section) {
    
    const randomID =  Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);

    const accordion = document.createElement("div");
    accordion.setAttribute("class","accordion mt-4 mb-5");
    accordion.setAttribute("id", "accordion-" + randomID)

    let index = 0;

    section.content.forEach(item => {
        switch (item.type) {
            default:
                throw `DataError: expected type "accordion-item", received type "${item.type}"`;
                break;
            case "accordion-item":
                const holder = document.createElement("div");
                holder.classList.add("accordion-item", "mb-2");

                const header = document.createElement("h2");
                header.setAttribute("id", "header-" + index);
                header.setAttribute("class", "accordion-header");


                const headerButton = document.createElement("button");
                headerButton.setAttribute("class", "accordion-button collapsed");
                headerButton.setAttribute("type", "button");
                headerButton.setAttribute("data-bs-toggle", "collapse");
                headerButton.setAttribute("data-bs-target", "#collapse-" + randomID + "-" + index);
                headerButton.setAttribute("aria-controls", "collapse-" + index);

                if (item.icon) {
                    let img = document.createElement("img")
                    headerButton.appendChild(img)
                    fetch(`/app/resources/${item.icon}`).then(response => response.json())
                    .then(resource => {
                        if (resource['content-type'] === undefined || resource['content-type'].startsWith("image")) {
                            if (resource.source == "useblob") {
                                img.setAttribute("src", `/app/resources/files/${item.icon}`);
                            } else {
                                img.setAttribute("src", resource.source);
                            }
                            img.setAttribute("alt", resource.description);
                        } else {
                            console.log("attempt to use non-image file as accordion icon");
                            img.remove();
                        }
                    })
                }
                headerButton.insertAdjacentText("beforeend", item.header);

                header.appendChild(headerButton);

                const collapse = document.createElement("div");
                collapse.setAttribute("id", "collapse-" + randomID + "-" + index);
                collapse.setAttribute("class", "accordion-collapse collapse");
                collapse.setAttribute("aria-labelledby", "header-" + index);
                collapse.setAttribute("data-bs-parent", "#accordion-" + randomID);

                const body = document.createElement("div");
                body.setAttribute("class", "accordion-body");

                this.render({ type: "container", content: item.content}).then(node => body.appendChild(node));

                collapse.appendChild(body);
                holder.appendChild(header);
                holder.appendChild(collapse);
                accordion.appendChild(holder);

                break;
        }

        index++;
    })

    return accordion;

}
