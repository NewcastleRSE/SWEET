export function blockquoteRenderer(section) {
    const figure = document.createElement("figure");
    figure.setAttribute("class", "quote ms-4 ps-4");
    const quote = document.createElement("blockquote");
    if (section.source) quote.setAttribute("cite", section.source);

    const p = document.createElement("p");
    p.innerText = section.text;
    quote.appendChild(p);

    figure.appendChild(quote);

    if (section.citation) {
        const cite = document.createElement("figcaption");
        cite.setAttribute("class", "blockquote-footer mt-2");
        cite.innerText = section.citation;
        figure.appendChild(cite)
    }

    return figure;

}
