import { createApp } from "../app.js";
import * as r from './renderers.js';
import { homepageMenuRenderer } from '../renderers/home_page.js'
import { profilerModalRenderer } from '../renderers/profiler.js'
import { sideEffectModalRenderer, sideEffectFormRenderer } from '../renderers/side_effects.js'
import { diaryCalendarRenderer } from "../renderers/diary-page.js";
import { thoughtsPageRenderer } from "../renderers/thoughts.js";
import { createModal } from '../extensions/modal.js'
import { createCalendar } from '../extensions/calendar.js'

export function SWEETPreviewer() {
    return createApp({
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
                "popup-trigger": r.popupTriggerRenderer,
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
                "described-menu": r.describedMenuRenderer,
                "described-menu-item": r.describedMenuItemRenderer,
                thoughts: r.thoughtsRenderer,
                "thoughts-page": thoughtsPageRenderer
            },
            titleHolder: "#page-title",
            contentHolder: "#main-container",
            autostart: false,
            embed: true,
            name: "SWEET Preview"
        });
}