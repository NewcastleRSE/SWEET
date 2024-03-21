const favourites = localStorage.getItem("favourites") ? JSON.parse(localStorage.getItem("favourites")) : [];

export function indexListRenderer(section) {

    if (section.type != "index-list") return null;

    let holder = document.createElement("section");
    holder.classList.add("all-pages")

    let strct = this.store.get("appStructure");

    let items = []

    Object.keys(strct).forEach((key) => {  
        items.push(strct[key]);
    });

    console.log(favourites)

    holder.appendChild(createList(items, '#'));

    return holder;
}

function createList(items, slug) {

    let list = document.createElement("ul");

    // Do any none the items at this level have subpages
    if (items.filter(i => i.pages?.length > 0).length === 0) {
        items = items.sort((a, b) => {
            if (a.title > b.title) return 1;
            if (a.title < b.title) return -1;
            return 0;
        });
    }

    try{
        items.forEach((item) => {

            let li = document.createElement("li");
            let link = document.createElement("a");
    
            link.href = `${slug}${item.slug}`;
            link.innerHTML = item.title;

            if(favourites.find(f => f.path === link.href)?.length > 0) {
                link.classList.add("favourite")
            }
    
            li.appendChild(link);
    
            if(item.pages?.length > 0) {
                li.appendChild(createList(item.pages, `${slug}${item.slug}/`));
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

