
// script to control body text size

let upBtn = document.getElementById("sizeUp");
upBtn.addEventListener("click", function() { sizeUp(); });

let resetBtn = document.getElementById("normal");
resetBtn.addEventListener("click", function() { sizeNormal(); });

let downBtn = document.getElementById("sizeDown");
downBtn.addEventListener("click", function() { sizeDown(); });

function sizeUp() {
   document.body.style.fontSize='1.2rem';
}

function sizeNormal() {
    document.body.style.fontSize='1rem';
}

function sizeDown() {
    document.body.style.fontSize='0.8rem';
}
