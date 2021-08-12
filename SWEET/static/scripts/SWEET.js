import { createApp } from "./app.js";
import * as r from './editors/renderers.js';
import { homepageMenuRenderer } from './renderers/home_page.js'
import { profilerModalRenderer } from './renderers/profiler.js'
import { sideEffectModalRenderer, sideEffectFormRenderer } from './renderers/side_effects.js'
import { diaryCalendarRenderer } from "./renderers/diary-page.js";
import { createModal } from './extensions/modal.js'
import { createCalendar } from './extensions/calendar.js'

createApp({
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
        fillin: r.fillInBoxRenderer
    },
    load: function(path) {
        let url = `/app/content?path=${encodeURIComponent(path)}`;
        return fetch(url).then(response => response.json());
    },
    titleHolder: "#page-title",
    contentHolder: "#main-container",
    name: "SWEET",
    autostart: true
});