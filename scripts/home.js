// Type swap — wordmark letters and the three roles.
// Each element names its alternate face in data-alt (and optional data-alt-size).
// It is measured in both faces once the fonts are in; it sits at its default
// width and eases to the other face's width on hover, so neighbours slide aside.
(function () {
    const letters = document.querySelectorAll(".wm-letter, .role");
    letters.forEach(l => {
        l.style.setProperty("--alt", "'" + l.dataset.alt + "'");
        if (l.dataset.altSize) l.style.setProperty("--alt-size", l.dataset.altSize);
    });

    // The alternate faces are never on screen at rest, so the browser won't
    // fetch them on its own. An invisible copy of each letter, set in its
    // alternate face, makes it ask for them.
    const warm = document.createElement("span");
    warm.setAttribute("aria-hidden", "true");
    warm.style.position = "absolute";
    warm.style.left = "-9999px";
    warm.style.top = "0";
    warm.style.visibility = "hidden";
    warm.style.pointerEvents = "none";
    letters.forEach(l => {
        const s = document.createElement("span");
        s.textContent = l.textContent;
        s.style.fontFamily = "'" + l.dataset.alt + "', serif";
        warm.appendChild(s);
    });
    document.body.appendChild(warm);
    void warm.offsetWidth; // force layout so the requests go out now

    function measure() {
        letters.forEach(l => {
            l.style.removeProperty("--w-base");
            l.style.removeProperty("--w-alt");
            const base = l.getBoundingClientRect().width;
            l.classList.add("is-alt");            // same styles as :hover
            const alt = l.getBoundingClientRect().width;
            l.classList.remove("is-alt");
            l.style.setProperty("--w-base", base + "px");
            l.style.setProperty("--w-alt", alt + "px");
        });
    }
    document.fonts.ready.then(measure);
    document.fonts.addEventListener("loadingdone", measure); // any late arrivals
    window.addEventListener("resize", measure);
})();
