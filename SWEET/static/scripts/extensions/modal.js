export function createModal(autodestroy=false) {
    let modal = new DOMParser().parseFromString(`
    <div class="modal fade" tabindex="-1" aria-labelledby="modalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalLabel"></h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
            </div>
            <div class="modal-footer">
            </div>
        </div>
        </div>
    </div>
    `, 'text/html').body.firstElementChild;

    document.body.appendChild(modal);
    let bs = new bootstrap.Modal(modal);
    if (autodestroy) modal.addEventListener("hidden.bs.modal", () => modal.remove())

    return {
        get title() { return modal.querySelector(".modal-title")},
        get body() { return modal.querySelector(".modal-body")},
        get footer() { return modal.querySelector(".modal-footer")},
        set size(v) { modal.querySelector(".modal-dialog").classList.remove("modal-sm", "modal-lg", "modal-xl", "modal-fs"); if (["sm", "lg", "xl", "fs"].includes(v)) modal.querySelector(".modal-dialog").classList.add(`modal-${v}`)},
        set id(v) {modal.setAttribute("id", v)},
        get id() { return modal.getAttribute("id")},
        show: function() { bs.show() },
        hide: function(destroy=false) { bs.hide(); if (destroy && !autodestroy) modal.remove(); }
    };
}

