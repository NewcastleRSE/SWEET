import { createModal } from './extensions/modal.js'

const renderers = {
    home: function() {},
    users: function() {

    },
    resources: function() {}
}

window.addEventListener("DOMContentLoaded", e => {
    let main = document.getElementById("main_content");
    let page = location.pathname.substr(location.pathname.lastIndexOf("/")+1);

    main.appendChild(renderers[page]());
})