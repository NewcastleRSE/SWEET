import { createApp } from "./app.js";
import * as r from './editors/renderers.js';
import { homepageMenuRenderer } from './renderers/home_page.js'
import { profilerModalRenderer } from './renderers/profiler.js'
import { sideEffectModalRenderer, sideEffectFormRenderer } from './renderers/side_effects.js'
import { diaryCalendarRenderer } from "./renderers/diary-page.js";
import { createModal } from './extensions/modal.js'
import { createCalendar } from './extensions/calendar.js'
import { plansAndGoalsRenderer } from './renderers/planandgoal.js'

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
        plansandgoals: plansAndGoalsRenderer
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
SWEET.store.set("tunnelsComplete", []);

SWEET.addEventListener("prerender", function(page) { 
    if (page.slug == "welcome") {
        SWEET.store.set("tunnelling", true);
        SWEET.store.set("tunnel", SWEET.path);
    } else if (page.pages
            && page.pages.find(p => p.slug == "welcome") 
            && SWEET.store.get("tunnel")
            && SWEET.store.get("tunnel").startsWith(SWEET.path)) {
        SWEET.store.set("tunnelling", false);
        SWEET.store.set("tunnel", "");
    }
    
    // 2021-08-18: moved to prerender handler.
    // handle sequential navigation if set up
    // i.e. template has buttons with data-rel attribute:
    const relbuttons = Array.from(document.querySelectorAll("[data-rel]"))
    let prevlink = document.head.querySelector("link[rel='prev']");
    let nextlink = document.head.querySelector("link[rel='next']");

    if (relbuttons.length) { 
        if (page.prev) {
            // we are using sequence navigation & have a 'prev' link in the page info:
            if (!prevlink) {
                prevlink = document.head.appendChild(document.createElement("link"));
                prevlink.setAttribute("rel", "prev");
            }
            

            relbuttons.filter(b => b.dataset.rel == "prev").forEach(prev => {
                prev.setAttribute("href", page.prev);
                prev.classList.remove("hidden");
            })
            prevlink.setAttribute("href", page.prev);
        } else {
            relbuttons.filter(b => b.dataset.rel == "prev").forEach(prev => {
                prev.classList.add("hidden");
                prev.removeAttribute("href");
            })
            
            if (prevlink) prevlink.remove();
        }

        console.log(page.next, SWEET.store.get("tunnelling"))
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
});

SWEET.start();
