export function carouselRenderer(section) {
    let carousel = document.createElement("div");
    
    carousel.classList.add("carousel", "slide");
    if (section.darkmode) carousel.classList.add("carousel-dark");

    let id = `carousel-${section.name.toLowerCase().replaceAll(/\s+/g, "-").replaceAll(/\W+/g, "")}`
    carousel.setAttribute("id", id)

    if (!section.autostart) {
        carousel.setAttribute("data-bs-pause", "true");
    }

    if (section.indicators) {
        let indicators = carousel.appendChild(document.createElement("div"));
        indicators.classList.add("carousel-indicators");
        for (var i=0; i<section.slides.length; i++) {
            indicators.insertAdjacentHTML("beforeend", `<button type="button" data-bs-target="#${id}" data-bs-slide-to="${i}" aria-label="Slide ${i+1}"></button>`)
        }
        let first = indicators.querySelector("button");
        first.classList.add("active");
        first.setAttribute("aria-current", "true");
    }

    let inner = carousel.appendChild(document.createElement("div"));
    inner.classList.add("carousel-inner");

    if (section.controls) {
        carousel.insertAdjacentHTML("beforeend", `
            <button class="carousel-control-prev" type="button" data-bs-target="#${id}" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#${id}" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Next</span>
            </button>
        `)
    }

    this.render(section.slides).then(nodes => { 
        inner.append(...nodes);
    }).then( () => {
        inner.querySelector(".carousel-item").classList.add("active");
    })

    let controller = new bootstrap.Carousel(carousel)

    return carousel;
}

export function carouselSlideRender(section) {
    let slide = document.createElement("div");
    slide.classList.add("carousel-item");
    this.render(section.content).then(node => slide.appendChild(node));
    return slide;
}