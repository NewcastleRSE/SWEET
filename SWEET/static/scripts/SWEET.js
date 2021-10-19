import { createApp } from "./app.js";
import * as r from './editors/renderers.js';
import { homepageMenuRenderer } from './renderers/home_page.js'
import { profilerModalRenderer } from './renderers/profiler.js'
import { sideEffectModalRenderer, sideEffectFormRenderer } from './renderers/side_effects.js'
import { diaryCalendarRenderer, diaryGraphRenderer } from "./renderers/diary-page.js";
import { createModal } from './extensions/modal.js'
import { createCalendar } from './extensions/calendar.js'
import { plansAndGoalsRenderer } from './renderers/planandgoal.js'
import { reminderRenderer } from './renderers/remindersetter.js'

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
        diarygraph: diaryGraphRenderer
    },
    load: function(path) {
        let url = `/app/content?path=${encodeURIComponent(path)}`;
        return fetch(url).then(response => response.json());
    },
    titleHolder: "#page-title",
    contentHolder: "#main-container",
    name: "SWEET"
});

//fetch("/myapp/mydetails").then(response => response.json()).then(profile => SWEET.store.set("currentUser", profile));
fetch("/app/schemas/tunnels").then(response => response.json()).then(tunnels => SWEET.store.set("tunnels", tunnels))
SWEET.store.set("tunnelsComplete", []);

SWEET.addEventListener("prerender", function(page) {
    document.querySelector("main").classList.remove(...document.querySelector("main").classList.values())
    document.querySelector("main").classList.add("flex-shrink-0", this.path.replace("#", "").replaceAll("/", "_"));
    
    if (SWEET.path == "#home") {
        document.querySelectorAll("[data-rel='prev']").forEach(b => {
            b.setAttribute("hidden", "");
        })
    } else {
        document.querySelectorAll("[data-rel='prev']").forEach(b => {
            b.removeAttribute("hidden", "");
        })
    }
    
    if (SWEET.path in SWEET.store.get("tunnels") /* and user hasn't seen this tunnel already */) {

        let tunnel = document.createElement("div");
        tunnel.classList.add("tunnel");
        tunnel.innerHTML = `
        <section id="tunnel-container" class="container">
            <header><h3 id="tunnel-title"></h3></header>
            <section id="tunnel-main"></section>
            <footer><button id="tunnel-prev" disabled>Previous</button><button id="tunnel-next">Next</button></footer>
        </section>
        `;

        let base = SWEET.path;
        let route = SWEET.store.get("tunnels")[base];
        let currentStop = 0;
        let prevbutton = tunnel.querySelector("#tunnel-prev");
        let nextbutton = tunnel.querySelector("#tunnel-next");

        function renderInTunnel() {
            let url = `/app/content?path=${encodeURIComponent(`${base}/${route[currentStop]}`)}`;
            fetch(url).then(response => response.json())
            .then(page => {
                tunnel.querySelector("#tunnel-title").textContent = page.title;
                while (tunnel.querySelector("#tunnel-main").firstChild) tunnel.querySelector("#tunnel-main").removeChild(tunnel.querySelector("#tunnel-main").lastChild);
                tunnel.scrollTo(0,0)
                page.content.forEach(c => SWEET.render(c).then(node => tunnel.querySelector("#tunnel-main").appendChild(node)));
            })
        }

        nextbutton.addEventListener("click", e => {
            currentStop++;
            if (currentStop == route.length) {
                tunnel.remove();
            } else {
                renderInTunnel();
                if (currentStop+1 == route.length) e.target.textContent = "Finish";
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

        document.body.appendChild(tunnel);
        renderInTunnel();
    }
    
/*

    // 2021-08-18: moved to prerender handler.
    // handle sequential navigation if set up
    // i.e. template has buttons with data-rel attribute:
    const relbuttons = Array.from(document.querySelectorAll("[data-rel]"))
    let prevlink = document.head.querySelector("link[rel='prev']");
    let nextlink = document.head.querySelector("link[rel='next']");

    if (relbuttons.length) { 

        if (page.prev && SWEET.store.get("tunnelling")) {
            // we are using sequence navigation & have a 'prev' link in the page info:
            if (!prevlink) {
                prevlink = document.head.appendChild(document.createElement("link"));
                prevlink.setAttribute("rel", "prev");
            }

            relbuttons.filter(b => b.dataset.rel == "prev").forEach(prev => {
                prev.setAttribute("href", page.prev);
            })

            prevlink.setAttribute("href", page.prev);
        } else {
            relbuttons.filter(b => b.dataset.rel == "prev").forEach(prev => {
                prev.setAttribute("href", "javascript: history.go(-1)");
            })
            
            if (prevlink) prevlink.remove();
        }

        if (page.next && SWEET.store.get("tunnelling")) {
            // we are using sequence navigation & have a 'next' link in the page info:
            if (!nextlink) {
                nextlink = document.head.appendChild(document.createElement("link"));
                nextlink.setAttribute("rel", "next");
            }
            relbuttons.filter(b => b.dataset.rel == "next").forEach(nextButton => {
                nextButton.setAttribute("href", page.next);
                nextButton.classList.remove("hidden");
            })

            nextlink.setAttribute("href", page.next);
        } else {
            relbuttons.filter(b => b.dataset.rel == "next").forEach(nextButton => {
                nextButton.classList.add("hidden");
                nextButton.removeAttribute("href");
            })
            if (nextlink) nextlink.remove();
        }
        
        relbuttons.forEach(b => b.blur());
    }
*/
});

SWEET.start();
