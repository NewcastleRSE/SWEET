export function alertRenderer(section) {
    let holder = document.createElement("section");
    holder.classList.add(section.class);
    section.content.forEach(s => this.render(s).then(node => holder.appendChild(node)));
    return holder;
}
