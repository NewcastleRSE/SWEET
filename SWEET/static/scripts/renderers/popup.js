export function popupRenderer(section) {

    let modal = this.createModal();
    modal.size = section.size;
    modal.id = `popup-${section.name}`

    modal.title.textContent = section.title && section.title != "undefined" ? section.title: "";
    section.content.forEach(s => this.render(s).then(node => modal.body.appendChild(node)));
    modal.footer.innerHTML = "<button type='button' class='btn btn-primary'>Close</button>";
    modal.footer.querySelector("button").addEventListener("click", () => modal.hide());

    return modal.__node;
}

export function popupTriggerRenderer(section) {
    let trigger = document.createElement("a");
    trigger.classList.add("popup-trigger");
    trigger.textContent = section.linktext;

    trigger.addEventListener("click", function(e) {
        e.preventDefault(); e.stopPropagation();
        bootstrap.Modal.getInstance(document.querySelector(`#popup-${section.name}`)).show()
    })

    return trigger;
}

