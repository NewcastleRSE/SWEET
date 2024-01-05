export function indexListRenderer(section) {

    if (section.type != "index-list") return null;

    let holder = document.createElement("section");
    holder.classList.add("all-pages")

    let strct = this.store.get("appStructure");

    let items = []

    Object.keys(strct).forEach((key) => {  
        items.push(strct[key]);
    });

    holder.appendChild(createList(items));

    return holder;
}

function createList(items) {

    let list = document.createElement("ul");

    try{
        items.forEach((item) => {

            let li = document.createElement("li");
            let link = document.createElement("a");
    
            link.href = `#${item.slug}`;
            link.innerHTML = item.title;
    
            li.appendChild(link);
    
            if(item.pages?.length > 0) {
                li.appendChild(createList(item.pages));
            }
    
            list.appendChild(li);
    
        });
    }
    catch(e) {
        console.error(e);
        console.log(items);
    }

    return list;
}

