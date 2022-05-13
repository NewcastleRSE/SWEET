import { createApp } from "../app.js";
import { renderers } from '../renderers/renderers.js';
import { createModal, createCalendar } from '../extensions/extensions.js'

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
            renderers: renderers,
            titleHolder: "#page-title",
            contentHolder: "#main-container",
            autostart: false,
            embed: true,
            name: "SWEET Preview"
        });
}