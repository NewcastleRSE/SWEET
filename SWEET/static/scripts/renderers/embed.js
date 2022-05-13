export function embedRenderer(section) {
    let overlay = this.createModal(true);
    overlay.size = "lg";

    overlay.title.textContent = section.title;

    overlay.footer.innerHTML = "<button type='button' class='btn btn-primary'>Close</button>";
    overlay.footer.querySelector("button").addEventListener("click", () => overlay.hide());

    let embed = document.createElement("iframe");
    embed.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    embed.setAttribute("allowfullscreen", "");

    embed.classList.add(section.contenttype);

    if (section.link.indexOf("autoplay=1") == -1) embed.src = section.link;

    overlay.body.appendChild(embed);

    let trigger = document.createElement("a");
    trigger.classList.add(`embed-${section.contenttype}`);
    trigger.textContent = section.byline;

    trigger.addEventListener("click", function(e) {
        e.preventDefault();
        if (!embed.src) overlay.addEventListener("shown.bs.modal", () => embed.src = section.link)
        overlay.show();
    })

    return trigger;
}
