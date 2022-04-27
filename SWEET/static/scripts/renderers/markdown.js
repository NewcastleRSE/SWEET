export function markdownRenderer(section) {
    let holder = document.createElement("section");
    holder.classList.add("markdown")
    if (section.encoding == "lz-string:UTF16") {
        holder.innerHTML = marked.parse(LZString.decompressFromUTF16(section.text));
    } else if (section.encoding == "lz-string:B64") {
        holder.innerHTML = marked.parse(LZString.decompressFromBase64(section.text));
    } else if (section.encoding == "raw") {
        holder.innerHTML = marked.parse(section.text);
    } else {
        holder.innerHTML = `<p class="error">Unknown markdown section encoding: ${section.encoding}</p>`;
    }
    
    holder.querySelectorAll("a[href^='http']").forEach(a => a.setAttribute("target", "_blank"));
    
    holder.querySelectorAll("a[href^='%']").forEach(a => {
        a.addEventListener("click", e => {
            e.preventDefault();
            let popup = a.getAttribute("href").substr(1);
            bootstrap.Modal.getInstance(document.querySelector(`#popup-${popup}`)).show();
        })
    });

    holder.querySelectorAll("img").forEach(img => {
        if (img.getAttribute("src").startsWith("http")) return; //ignore absolute image paths

        let [name, position] = img.getAttribute("src").split(":");

        fetch(`/app/resources/${name}`).then(response => response.json())
        .then(resource => {
            if (resource['content-type'] === undefined || resource['content-type'].startsWith("image")) {
                img.setAttribute("src", resource.source);
                img.setAttribute("alt", resource.description);
                img.setAttribute("title", resourse.caption);

                if (position) img.classList.add(...position.split(";"));
            } else if (resource['content-type'].startsWith("video")) {
                let src = resource.source;
                img.insertAdjacentHTML("beforebegin", `<video controls src="${src}"${position? ` class="${position.replace(';',' ')}"`:""}><p>${resource.description}</p></video>`);
                img.remove();
            }
        })
    })

    holder.querySelectorAll("code").forEach(code => {
        let [item, prop] = code.textContent.split(".");
        try {
            var replacer = this.store.get(item)[prop];
        } catch (e) { } finally {
            // no need to catch specific errors - we'll either have a valid property identifer
            // or we leave this as a normal code block in markdown.
            
            if (replacer) {
                code.insertAdjacentHTML("beforebegin", replacer);
                code.remove();
            }
        }
    })

    return holder;
}
