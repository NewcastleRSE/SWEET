export async function thoughtsRenderer(section) {
    if (section.type != "thoughts") return null;

    let holder = document.createElement("section");
    holder.classList.add("thought");
    holder.$path = section.path;

    let schema = await fetch(`/app/schemas/thoughts?path=${encodeURIComponent(section.path)}`).then(response => response.json());


    
    let [negfillin, posfillin] = await Promise.allSettled([this.render({ type: "fillin", boxsize: "large", path: section.path, name: schema.negfillin}), this.render({ type: "fillin", boxsize: "large", path: section.path, name: schema.posfillin})]).then(ps => ps.map(p => p.value))
    
    if (negfillin.querySelector("textarea").value || posfillin.querySelector("textarea").value) {
        // at least one part of thoughts is filled in so we'll render it:
        holder.insertAdjacentHTML("beforeend", `<h4>${schema.title}</h4>
        <label>${schema.neglabel}</label>`)
        holder.appendChild(negfillin);
        holder.insertAdjacentHTML("beforeend", `<label>${schema.poslabel}</label>`)
        holder.appendChild(posfillin);
    } else {
        // if there's nothing in either box we'll return a 1-button menu to link to this thoughts page:
        await this.render({
            type: "menu",
            content: [{ type: "menu-item", title: schema.title, link: schema.path } ]
        }).then(node => holder.appendChild(node));
    }

    return holder;
}

export function thoughtsPageRenderer(section) {
    if (section.type != "thoughts-page") return null;

    let holder = document.createElement("section");
    holder.classList.add("thoughts-page");

    fetch("/app/schemas/thoughts").then(response => response.json())
    .then(schema => {
        Promise.allSettled(schema.thoughts.map(async t => {
            let node = await this.render({ type: "thoughts", path: t.path})
            if (node.hasThoughts) {
                node.insertAdjacentHTML("afterbegin", `<h3>${t.title}</h3>`)
                return node;
            } else {
                return await this.render({ type: "menu", content: [
                    {
                        type: "menu-item", text: t.title, link: t.path
                    }
                ]})
            }
        }))
        .then(holderPromises => holderPromises.map(p => p.value))
        .then(holders => {
            if (holders.filter(h => h.hasThoughts).length == 0) {
                // we have no thoughts in the app; create a single menu to link to thought pages:
                this.render({
                    type: "container",
                    content: [
                        "It looks like you haven't entered any thoughts you would like to change in the side effects section – hot flushes, night sweats, or sleep problems. To visit the pages where you can do that use the buttons below",
                        {
                            type: "menu",
                            content: schema.thoughts.map(s => { return { type: "menu-item", title: s.title, link: s.path } })
                        }
                    ]
                }).then(node => holder.appendChild(node))
            } else {
                // we have at least one thought, so we'll render each individually (this will render links for thoughts that have not been completed.)
                holder.append(...holders);
            }
        })
    })

    return holder;
}

