export async function thoughtsRenderer(section) {
    if (section.type != "thoughts") return null;

    let holder = document.createElement("section");
    holder.classList.add("thought");
    holder.$path = section.path;

    let schema = await fetch(`/app/schemas/thoughts?path=${encodeURIComponent(section.path)}`);

    let negfillin = await this.render({ type: "fillin", boxsize: "large", path: section.path, name: schema.negfillin});
    let posfillin = await this.render({ type: "fillin", boxsize: "large", path: section.path, name: schema.posfillin});

    if (negfillin.querySelector("textarea").value || posfillin.querySelector("textarea").value) {
        // at least one part of thoughts is filled in so we'll render it:
        holder.insertAdjacentHTML("beforeend", `<h4>${schema.title}</h4>
        <label>${schema.neglabel}</label>`)
        holder.appendChild(negfillin);
        holder.insertAdjacentHTML("beforeend", `<label>${schema.poslabel}</label>`)
        holder.appendChild(posfillin);
    }

    // if there's nothing in either box we'll return an empty holder and the calling code can decide what to do about it.
    return holder;
}

export function thoughtsPageRenderer(section) {
    if (section.type != "thoughts-page") return null;

    let holder = document.createElement("section");
    holder.classList.add("thoughts-page");

    fetch("/app/schemas/thoughts").then(response => response.json())
    .then(schema => {
        let holders = schema.thoughts.map(async t => await this.render({ type: "thoughts", path: t.path}))
        if (holders.filter(h => h.childElementCount > 0).length == 0) {
            // we have no thoughts in the app; create a menu to link to thought pages:
            this.render({
                type: "container",
                content: [
                    "It looks like you haven't entered any thoughts you would like to change in the Side-Effects section – Hot flushes, Fatigue, or Sleep problems. To the pages where you can do that use the buttons below",
                    {
                        type: "menu",
                        content: schema.thoughts.map(s => { return { type: "menu-item", title: s.title, link: s.path } })
                    }
                ]
            }).then(node => holder.appendChild(node))
        } else {
            holder.append(...holders.filter(h => h.childElementCount > 0));
        }
    })

    return holder;
}

