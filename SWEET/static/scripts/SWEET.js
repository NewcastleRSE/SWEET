import { createApp } from "./app.js";
import * as r from './editors/renderers.js';
import { homepageMenuRenderer } from './renderers/home_page.js'
import { profilerModalRenderer, profilerResultRenderer, profilerLauncherRenderer, myPersonalSupportRenderer } from './renderers/profiler.js'
import { sideEffectModalRenderer, sideEffectFormRenderer } from './renderers/side_effects.js'
import { diaryCalendarRenderer, diaryGraphRenderer } from "./renderers/diary-page.js";
import { createModal } from './extensions/modal.js'
import { createCalendar } from './extensions/calendar.js'
import { plansAndGoalsRenderer } from './renderers/planandgoal.js'
import { reminderRenderer } from './renderers/remindersetter.js'
import { contactFormRenderer, contactListRenderer, contactPageRenderer, contactRenderer } from './renderers/contacts.js'
import { planRenderer, myPlansRenderer } from './renderers/plan.js'
import { thoughtsPageRenderer } from './renderers/thoughts.js'
import { userDetailsPageRenderer } from './renderers/user_details.js'
import { welcomeFooterRenderer } from './renderers/welcome.js'
import { goalCheckerRenderer} from './renderers/goalchecker.js'


let SWEET = createApp({
    extensions: {
        createModal: createModal,
        post: function(url, data) {
            return fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            })
        },
        createCalendar: createCalendar,
        calendarDate: function(d) { return `${d.getFullYear()}-${d.getMonth()<9?"0":""}${d.getMonth()+1}-${d.getDate()<10?"0":""}${d.getDate()}` }
    },
    renderers: {
        markdown: r.markdownRenderer,
        external: r.embedRenderer,
        popup: r.popupRenderer,
        "block-quote": r.blockquoteRenderer,
        standout: r.alertRenderer,
        goalsetter: r.goalRenderer,
        accordion: r.accordionRenderer,
        menu: r.menuRenderer,
        "menu-item": r.menuItemRenderer,
        'homepage-menu': homepageMenuRenderer,
        sideeffect: sideEffectModalRenderer,
        sideeffectform: sideEffectFormRenderer,
        profiler: profilerModalRenderer,
        "diary-calendar": diaryCalendarRenderer,
        fillin: r.fillInBoxRenderer,
        plansandgoals: plansAndGoalsRenderer,
        reminders: reminderRenderer,
        diarygraph: diaryGraphRenderer,
        "described-menu": r.describedMenuRenderer,
        "described-menu-item": r.describedMenuItemRenderer,
        "user-details-page": userDetailsPageRenderer,
        "contact": contactRenderer,
        "contact-form": contactFormRenderer,
        "contact-list": contactListRenderer,
        "contacts-page": contactPageRenderer,
        "plan": planRenderer,
        "my-plans": myPlansRenderer,
        "thoughts": r.thoughtsRenderer,
        "thoughts-page": thoughtsPageRenderer,
        "welcome-footer": welcomeFooterRenderer,
        "profiler-result": profilerResultRenderer, 
        "profiler-launcher": profilerLauncherRenderer, 
        "my-personal-support": myPersonalSupportRenderer,
        goalchecker: goalCheckerRenderer
    },    
    load: function(path) {
        let url = `/app/content?path=${encodeURIComponent(path)}`;
        return fetch(url).then(response => {
            if (response.ok) {
                return response.json();
            }
            if (response.status == 404) {
                return {
                    "slug": "NotFound",
                    "title": `Error: page "${path}" not found.`,
                    "content": [
                        {
                            "type": "markdown",
                            "encoding": "raw",
                            "text": `### 404 - Page Not Found
                            
Unfortunately, we were not able to find the page \`${path}\` that you requested. If you followed a link to get here, please click the "Back" button and try a different link. Otherwise, please type the address again checking the spelling carefully.

If you followed a link, the application maintainers will be notified automatically and will fix the problem as soon as possible.`
                        }
                    ]
                }
            }
        });
    },
    titleHolder: "#page-title",
    contentHolder: "#main-container",
    name: "HT&Me"
});

SWEET.addEventListener("prerender", function(page) {
    document.querySelector("main").classList.remove(...document.querySelector("main").classList.values())
    document.querySelector("main").classList.add("flex-shrink-0", this.path.replace("#", "").replaceAll("/", "_"));
    
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

        b.textContent = strct.title || "HT & Me";
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
        <footer><button class="btn-secondary" id="tunnel-prev" disabled>Previous</button> <span id="tunnel-pagecount"></span> <button class="btn-primary" id="tunnel-next">Next</button></footer>
    </section>
    `;

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
    let currentStop = SWEET.store.get(`tunnel:${base}:stop`) === undefined? 0: SWEET.store.get(`tunnel:${base}:stop`);
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
            tunnel.scrollTo(0,0)
            page.content.forEach(c => SWEET.render(c).then(node => tunnel.querySelector("#tunnel-main").appendChild(node)));

            // append any additional content from the tunnel schema:
            route[currentStop]['content'].forEach(c => SWEET.render(c).then(node => tunnel.querySelector("#tunnel-main").appendChild(node)));

            // set page count text.
            pagecount.textContent = `page ${currentStop+1} of ${route.length}`;

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
            e.target.textContent = currentStop+1 == route.length? "Finish": "Next";
            if (currentStop+1 == route.length && !(base in SWEET.store.get("currentUser")["tunnelsComplete"])) {
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
        tunnel.remove();
    })

    document.body.appendChild(tunnel);
    renderInTunnel();

});

document.querySelector("#btn-print > a").addEventListener("click", e => { 

    e.preventDefault(); e.stopPropagation(); 
    
    if (SWEET.path == "#home/diary") {
        open(`/myapp/mydiary/print?period=${e.currentTarget.dataset.period}`);
    } else {
        window.alert("Here you will be able to download .pdf versions of some pages."); 
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
    // tunnel schema fetch
    fetch("/app/schemas/tunnels").then(response => response.json()).then(tunnels => SWEET.store.set("tunnels", tunnels)),
    // app structure fetch
    fetch("/app/structure").then(response => response.json()).then(structure => SWEET.store.set("appStructure", structure))
]).then(() => SWEET.start());
    
    