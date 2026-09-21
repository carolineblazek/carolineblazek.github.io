// Brand guide flip-through: ← → buttons, arrow keys, click the page, or swipe.
document.querySelectorAll(".flipbook").forEach(book => {
    const total = Number(book.dataset.pages), base = book.dataset.src;
    const page = book.querySelector(".flipbook-page"), current = book.querySelector(".flipbook-current");
    let n = 1;
    const src = i => base + String(i).padStart(2, "0") + ".jpg";
    function go(i) {
        n = ((i - 1 + total) % total) + 1;
        page.src = src(n);
        page.alt = "Brand guide, page " + n + " of " + total;
        current.textContent = String(n).padStart(2, "0");
        new Image().src = src(n % total + 1);        // warm the next page
    }
    book.querySelector(".flipbook-prev").addEventListener("click", () => go(n - 1));
    book.querySelector(".flipbook-next").addEventListener("click", () => go(n + 1));
    page.addEventListener("click", () => go(n + 1));
    book.tabIndex = 0;
    book.addEventListener("keydown", e => {
        if (e.key === "ArrowRight") go(n + 1);
        if (e.key === "ArrowLeft") go(n - 1);
    });
    let x0 = null;
    page.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
    page.addEventListener("touchend", e => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) go(dx < 0 ? n + 1 : n - 1);
        x0 = null;
    });
});
