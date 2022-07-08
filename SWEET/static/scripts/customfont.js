
// script to control body text size

let upBtn = document.getElementById("sizeUp");
upBtn.addEventListener("click", function() { sizeUp(); });

let resetBtn = document.getElementById("normal");
resetBtn.addEventListener("click", function() { sizeNormal(); });

let downBtn = document.getElementById("sizeDown");
downBtn.addEventListener("click", function() { sizeDown(); });

function sizeUp() {
   document.body.setAttribute('style', 'font-size: 1.4em !important');
}

function sizeNormal() {
    document.body.setAttribute('style', 'font-size: 1em !important');
}

function sizeDown() {
    document.body.setAttribute('style', 'font-size: 0.6em !important');
}
