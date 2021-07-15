import { createApp } from "./app.js";
import * as r from './editors/renderers.js';
import { homepageMenuRenderer } from './renderers/home_page.js'
import { profilerModalRenderer } from './renderers/profiler.js'
import { sideEffectModalRenderer } from './renderers/side_effects.js'
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
        createCalendar: createCalendar
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
        profiler: profilerModalRenderer
    },
    load: function(path) {
        let url = `/app/content?path=${encodeURIComponent(path)}`;
        return fetch(url).then(response => response.json());
    },
    titleHolder: "#page-title",
    contentHolder: "#main-container",
    autostart: true
});