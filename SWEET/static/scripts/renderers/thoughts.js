export async function thoughtsRenderer(section) {
    if (section.type != "thoughts") return null;

    if (!section.path) section.path = this.path;

    let holder = document.createElement("section");
    holder.classList.add("thoughts-box", "so-alert");

    let thoughts = section.thoughts || await fetch(`/myapp/mythoughts?path=${encodeURIComponent(section.path)}`).then(response => response.json());

    // holder.insertAdjacentHTML("afterbegin", "<header><span>Critical, negative thoughts</span><span>&nbsp;</span><span>Supportive, neutral thoughts</span></header>")

    holder.insertAdjacentHTML("beforeend", "<footer><button type='button' id='add-thought' class='btn btn-primary'>Add more thoughts</button><button type='button' id='save-thoughts' class='btn btn-primary' disabled>Save</button></footer>")



    const addrow = () => {
        // Negative section
        let negTextArea = document.createElement('textarea');
        negTextArea.name = 'negative';
        negTextArea.id = 'negative';

        negTextArea.addEventListener('input', el => {
            if (el.target.scrollHeight > 80) {
                el.target.style.height = "5px";
                el.target.style.height = (15 + el.target.scrollHeight)+"px";
            }
        });

        let formGroupNeg = document.createElement('div');
        formGroupNeg.classList.add('form-group');

        let labelNeg = document.createElement('label');
        labelNeg.for = 'negative';
        labelNeg.innerText = 'Critical, negative thoughts'
         // let labelNeg = "<label for='negative'>Critical, negative thoughts</label>";
          formGroupNeg.insertAdjacentElement('beforeend', labelNeg);
         formGroupNeg.insertAdjacentElement('beforeend', negTextArea);

         // Positive section
        let posTextArea = document.createElement('textarea');
        posTextArea.name = 'positive';
        posTextArea.id = 'positive';

        posTextArea.addEventListener('input', el => {
            if (el.target.scrollHeight > 80) {
                el.target.style.height = "5px";
                el.target.style.height = (15 + el.target.scrollHeight)+"px";
            }
        });

        let formGroupPos = document.createElement('div');
        formGroupPos.classList.add('form-group');

        let labelPos = document.createElement('label');
        labelPos.for = 'positive';
        labelPos.innerText = 'Supportive, neutral thoughts'
        formGroupPos.insertAdjacentElement('beforeend', labelPos);
        formGroupPos.insertAdjacentElement('beforeend', posTextArea);

        // arrow
        let arrow = document.createElement('span');
        arrow.innerHTML = '&#10148';

        // build form
        let form = document.createElement("form");
        form.insertAdjacentElement('beforeend', formGroupNeg);
        form.insertAdjacentElement('beforeend', arrow);
        form.insertAdjacentElement('beforeend', formGroupPos);


        let deleteBtn = document.createElement("button");
        let icon = '<i class="bi bi-trash"></i>'
        deleteBtn.insertAdjacentHTML('beforeend', icon);
        deleteBtn.id='delete-thought';
        deleteBtn.classList.add('btn');
        deleteBtn.classList.add('btn-primary');

       // form.insertAdjacentHTML("beforeend", "<button type='button' id='delete-thought' className='btn btn-primary'>X</button>");
        form.appendChild(deleteBtn);
        deleteBtn.addEventListener("click", e => {
           // remove current row
            let toRemove = deleteBtn.parentNode;
            toRemove.remove();
            // save current thoughts (i.e. without deleted thought)
            let allthoughts = Array.from(holder.querySelectorAll("form")).filter(f => f.elements['negative'].value && f.elements['positive'].value).map(f => { return { negative: f.elements['negative'].value, positive: f.elements['positive'].value}; });
            this.post("/myapp/mythoughts/", { path: section.path, details: allthoughts});
            e.target.setAttribute("disabled", "");
            // if these leave no rows, add blank one
            if (holder.querySelectorAll("form").length < 1) {
                addrow();
            }
        });
        holder.querySelector("footer").insertAdjacentElement("beforebegin", form);
    }


    holder.addEventListener("change", () => holder.querySelector("#save-thoughts").removeAttribute("disabled"))

    holder.querySelector("#add-thought").addEventListener("click", addrow);

    holder.querySelector("#save-thoughts").addEventListener("click", e => {
        let allthoughts = Array.from(holder.querySelectorAll("form")).filter(f => f.elements['negative'].value && f.elements['positive'].value).map(f => { return { negative: f.elements['negative'].value, positive: f.elements['positive'].value}; });
        this.post("/myapp/mythoughts/", { path: section.path, details: allthoughts});
        e.target.setAttribute("disabled", "");
        this.showPopupMessage("Great! Information you added to My Thoughts Activity has been saved.");
    })

    if (thoughts) {
        holder.hasThoughts = true;
        thoughts.forEach(t => {
            addrow();
            let form = holder.querySelector("form:last-of-type");
            form.elements['negative'].value = t.negative;
            form.elements['positive'].value = t.positive;
        })
    }

    while (holder.querySelectorAll("form").length < 1) {
        addrow();
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
                        type: "menu-item", title: t.title, link: t.path
                    }
                ]})
            }
        }))
        .then(holderPromises => holderPromises.map(p => p.value))
        .then(holders => {
            console.log(holders);
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
