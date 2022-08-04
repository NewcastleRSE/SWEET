import { createApp } from "./app.js";
import { createModal, createCalendar } from "./extensions/extensions.js";
import { renderers } from './renderers/renderers.js';


let SWEET = createApp({
    extensions: {
        createModal: createModal,
        post: function (url, data) {
            return fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            })
        },
        createCalendar: createCalendar,
        calendarDate: function (d) { return `${d.getFullYear()}-${d.getMonth() < 9 ? "0" : ""}${d.getMonth() + 1}-${d.getDate() < 10 ? "0" : ""}${d.getDate()}` },
        showPopupMessage: function (content, title = undefined, buttons = ["Close"]) {
            let modal = this.createModal(true);

            if (title !== undefined) modal.title.textContent = title;
            this.render(content).then(node => modal.body.appendChild(node));
            for (const b of buttons) {
                let button = document.createElement("button");
                button.textContent = b;
                button.setAttribute("name", b.toLowerCase());
                button.classList.add("btn", "btn-primary");
                modal.footer.appendChild(button);
            }
            modal.addEventListener("click", e => {
                if (e.target.matches("button, button *")) {
                    switch (e.target.name) {
                        case "close":
                            modal.hide();
                    }
                }
            })

            modal.show();
        }
    },
    renderers: renderers,
    load: function (path) {
        let url = `/app/content?path=${encodeURIComponent(path)}`;
        return fetch(url, {
            headers: {
                'X-SWEET-referrer': this.store.get("prevPath")
            },
            redirect: 'error'
        }).then(response => {
            if (response.ok) {
                this.store.set("prevPath", path);
                return response.json();
            }
            if (response.status == 404) {
                return {
                    "slug": "NotFound",
                    "title": "404 - Page Not Found",
                    "content": [
                        {
                            "type": "markdown",
                            "encoding": "raw",
                            "text": `### Error: content at "${path}" not found.
                            
Unfortunately, we were not able to find a page at the location \`${path}\` that you requested. If you followed a link to get here, please click the "Back" button and try a different link. Otherwise, please type the address again checking the spelling carefully.

If you followed a link, the application maintainers will be notified automatically and will fix the problem as soon as possible.`
                        }
                    ]
                }
            }
        },
            reject => {
                // failure to fetch is either a network error or a redirect due to no auth token:
                //   sending the app to the logout url will attempt to logout the user if logged in,
                //   then automatically redirect to login page.
                // if the fetch failed due to a network error, the user's browser should notify them 
                //   of the error while trying to load the login page
                location.href = '/auth/logout';
            });
    },
    titleHolder: "#page-title",
    contentHolder: "#main-container",
    name: "HT&Me"
});

SWEET.addEventListener("prerender", function (page) {
    document.querySelector("main").classList.remove(...document.querySelector("main").classList.values())
    document.querySelector("main").classList.add("flex-shrink-0", this.path.replace("#", "").replaceAll("/", "_"));

    if (page.headerImage) {
        fetch(`/app/resources/${page.headerImage}`).then(response => response.json())
            .then(resource => {
                if (resource['content-type'] === undefined || resource['content-type'].startsWith("image")) {
                    let splash = document.querySelector(".bg-image");
                    splash.setAttribute("style", `background-image: url(${resource.source == "useblob" ? `/app/resources/files/${page.headerImage}` : resource.source})`);
                }
            })
    } else {
        document.querySelector(".bg-image").removeAttribute("style");
    }

    document.querySelectorAll(".btn-up").forEach(b => {
        if (this.path.lastIndexOf("/") == -1) {
            b.setAttribute("hidden", "");
            return;
        }
        // else 

        let parent = this.path.substring(1, this.path.lastIndexOf("/"))

        b.setAttribute("href", `#${parent}`);
        b.removeAttribute("hidden")
        let strct = this.store.get("appStructure");
        let slugs = parent.split("/");


        while (slugs.length) {
            let slug = slugs.shift();

            if (slug in strct) strct = strct[slug]
            else strct = strct.pages.filter(p => p.slug == slug)[0]
        }

        b.textContent = strct.title || "HT&Me";
    });
});

// link intercept for tunnelled pages (prevent section home showing until tunnel is complete);
document.querySelector("#main-container").addEventListener("click", e => {
    let src = e.target;

    while (src.tagName != "A" && src.parentNode) src = src.parentNode;
    if (src.tagName != "A") return true;
    let path = src.getAttribute("href");
    if (!(path in SWEET.store.get("tunnels"))) return true; // ignore non-tunnelled links (including external links)
    if (SWEET.store.get("currentUser")['tunnelsComplete'].includes(path)) return true; // ignore tunnels the user has been through

    // the user has clicked a link for a tunnel they haven't completed yet!

    e.preventDefault(); e.stopPropagation();

    let tunnel = document.createElement("div");
    tunnel.classList.add("tunnel");
    tunnel.innerHTML = `
    <section id="tunnel-container" class="container">
        <header><h3 id="tunnel-title" class="mb-3"></h3> <button type="button" class="btn-close" id="tunnel-close" aria-label="Close"></button></header>
        <section id="tunnel-main"></section>
        <footer >
<button class="btn-primary" id="tunnel-prev" disabled>Back</button> 
<span id="tunnel-pagecount"></span> 
<button class="btn-primary" id="tunnel-next">Next</button>
</footer>
    </section>
    `;

    // disable scrolling on background
    document.getElementsByTagName('body')[0].classList.add('popup-open');

    // intercept internal links in tunnel and display in modal:
    tunnel.addEventListener("click", e => {
        let src = e.target;

        while (src.tagName != "A" && src.parentNode) src = src.parentNode;
        if (src.tagName != "A") return true;
        let path = src.getAttribute("href");
        if (path.charAt(0) != '#') return true;

        e.preventDefault(); e.stopPropagation();

        let modal = SWEET.createModal(true);
        modal.size = "xl";
        fetch(`/app/content?path=${encodeURIComponent(path)}`).then(response => response.json())
            .then(page => {
                modal.title.textContent = page.title;
                page.content.forEach(c => SWEET.render(c).then(node => modal.body.appendChild(node)));
                modal.footer.innerHTML = `<button type="button" class="btn-primary" data-bs-dismiss="modal" aria-label="Close">Close</button>`;
                modal.show();
            })
    })


    let base = path;
    let route = SWEET.store.get("tunnels")[base];
    let currentStop = SWEET.store.get(`tunnel:${base}:stop`) === undefined ? 0 : SWEET.store.get(`tunnel:${base}:stop`);
    let prevbutton = tunnel.querySelector("#tunnel-prev");
    let nextbutton = tunnel.querySelector("#tunnel-next");
    let pagecount = tunnel.querySelector("#tunnel-pagecount");
    let closebutton = tunnel.querySelector("#tunnel-close");

    function renderInTunnel() {
        let url = `/app/content?path=${encodeURIComponent(`${base}/${route[currentStop]['path']}`)}`;
        fetch(url).then(response => response.json())
            .then(page => {
                tunnel.querySelector("#tunnel-title").textContent = page.title;
                while (tunnel.querySelector("#tunnel-main").firstChild) tunnel.querySelector("#tunnel-main").removeChild(tunnel.querySelector("#tunnel-main").lastChild);
                tunnel.scrollTo(0, 0)
                page.content.forEach(c => SWEET.render(c).then(node => tunnel.querySelector("#tunnel-main").appendChild(node)));

                // append any additional content from the tunnel schema:
                route[currentStop]['content'].forEach(c => SWEET.render(c).then(node => tunnel.querySelector("#tunnel-main").appendChild(node)));

                // set page count text.
                pagecount.textContent = `page ${currentStop + 1} of ${route.length}`;

                SWEET.store.set(`tunnel:${base}:stop`, currentStop);
            })
    }

    nextbutton.addEventListener("click", e => {
        currentStop++;
        if (currentStop == route.length) {
            tunnel.remove();
            SWEET.path = base; // as we're using link intercept we need to send the user to the relevant homepage
        } else {
            renderInTunnel();
            e.target.textContent = currentStop + 1 == route.length ? "Finish" : "Next";
            if (currentStop + 1 == route.length && !(base in SWEET.store.get("currentUser")["tunnelsComplete"])) {
                SWEET.store.get("currentUser")["tunnelsComplete"].push(base);
                SWEET.post("/myapp/mydetails/", SWEET.store.get("currentUser"));
            }
            prevbutton.removeAttribute("disabled");
        }
    })

    prevbutton.addEventListener("click", e => {
        if (currentStop == 0) {
            prevbutton.setAttribute("disabled", "")
            return;
        }

        currentStop--;
        renderInTunnel();
        if (currentStop == 0) prevbutton.setAttribute("disabled", "");
    })

    closebutton.addEventListener("click", e => {
        // enable scrolling on background
        document.getElementsByTagName('body')[0].classList.remove('popup-open');
        tunnel.remove();
    })

    document.body.appendChild(tunnel);
    renderInTunnel();

});

document.querySelector("#btn-print > a").addEventListener("click", e => {

    e.preventDefault(); e.stopPropagation();

    switch (SWEET.path) {
        // case "#home/diary":
        //     open(`/myapp/mydiary/print?period=${e.currentTarget.dataset.period}`);
        //     break;
        default:
            window.print();
            //window.alert("Here you will be able to download .pdf versions of some pages.");
            break;
    }
})

// pre-load cached app data, then start app.
Promise.allSettled([
    // user profile retrieval, validation, update and storage:
    fetch("/myapp/mydetails").then(response => response.json()).then(profile => {

        if (!("tunnelsComplete" in profile)) {
            profile["tunnelsComplete"] = [];
            SWEET.post("/myapp/mydetails/", profile);
        }

        SWEET.store.set("currentUser", profile);

    }),
    fetch("/myapp/profiler/latest").then(response => response.json()).then(profiler => SWEET.store.set("latestProfiler", profiler)),
    // tunnel schema fetch
    fetch("/app/schemas/tunnels").then(response => response.json()).then(tunnels => SWEET.store.set("tunnels", tunnels)),
    // app structure fetch
    fetch("/app/structure").then(response => response.json()).then(structure => SWEET.store.set("appStructure", structure))
]).then(() => SWEET.start());

