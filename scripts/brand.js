// The three marks — ✺ design, ☻ web / UX, ❉ social media — and the
// small surprises built on them. Loaded on every page.
//
//   window.Brand.burst(x, y, opts)   scatter marks from a point
//   Click anywhere                   a burst of marks from the click
//                                    (in one colour on a role or a mark)
//   Select any text                  each new selection takes the next colour
//   Type "fun" anywhere              marks rain down the screen
(() => {
    const ROLES = {
        design: { glyph: "✺︎", color: "var(--pink)" },
        web:    { glyph: "☻︎", color: "var(--yellow)" },
        social: { glyph: "❉︎", color: "var(--blue)" },
    };
    const ALL = Object.keys(ROLES);
    const still = matchMedia("(prefers-reduced-motion: reduce)");

    // One fixed layer holds every particle, so nothing shifts the page.
    let layer = null;
    function getLayer() {
        if (!layer) {
            layer = document.createElement("div");
            layer.className = "spark-layer";
            layer.setAttribute("aria-hidden", "true");
            document.body.appendChild(layer);
        }
        return layer;
    }

    const rand = (a, b) => a + Math.random() * (b - a);

    // Remove a particle when its animation ends, or after its lifetime anyway:
    // a background tab pauses animations, and animationend would never fire.
    function retire(el, ms) {
        el.addEventListener("animationend", () => el.remove(), { once: true });
        setTimeout(() => el.remove(), ms + 250);
    }
    const pick = list => list[Math.floor(Math.random() * list.length)];

    // A single mark that flies out from (x, y) and fades.
    function spark(x, y, role, { spread = 140, rise = 60, size = [18, 34], life = [700, 1100] } = {}) {
        const r = ROLES[role] || ROLES.design;
        const s = document.createElement("span");
        s.className = "spark";
        s.dataset.role = role;
        s.textContent = r.glyph;
        const angle = rand(0, Math.PI * 2);
        const dist = rand(spread * 0.35, spread);
        s.style.setProperty("--x", x + "px");
        s.style.setProperty("--y", y + "px");
        s.style.setProperty("--dx", Math.cos(angle) * dist + "px");
        s.style.setProperty("--dy", Math.sin(angle) * dist - rise + "px");
        s.style.setProperty("--rot", rand(-260, 260) + "deg");
        s.style.setProperty("--size", rand(size[0], size[1]) + "px");
        const ms = rand(life[0], life[1]);
        s.style.setProperty("--life", ms + "ms");
        retire(s, ms);
        getLayer().appendChild(s);
    }

    function burst(x, y, { roles = ALL, count = 14, ...opts } = {}) {
        if (still.matches) return;
        for (let i = 0; i < count; i++) spark(x, y, pick(roles), opts);
    }

    // Marks falling from the top edge, for the typed easter egg.
    function rain(count = 60) {
        if (still.matches) return;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const s = document.createElement("span");
                const role = pick(ALL);
                s.className = "spark spark--rain";
                s.dataset.role = role;
                s.textContent = ROLES[role].glyph;
                s.style.setProperty("--x", rand(0, innerWidth) + "px");
                s.style.setProperty("--y", "-40px");
                s.style.setProperty("--dx", rand(-80, 80) + "px");
                s.style.setProperty("--dy", innerHeight + 80 + "px");
                s.style.setProperty("--rot", rand(-540, 540) + "deg");
                s.style.setProperty("--size", rand(22, 56) + "px");
                const ms = rand(1800, 3000);
                s.style.setProperty("--life", ms + "ms");
                retire(s, ms);
                getLayer().appendChild(s);
            }, i * 28);
        }
    }

    window.Brand = { ROLES, burst, spark };

    // Each new text selection takes the next colour in the set.
    let sel = 0;
    document.documentElement.dataset.sel = "0";
    document.addEventListener("mousedown", () => {
        if (String(getSelection()).length) return;   // still adjusting the last one
        sel = (sel + 1) % 3;
        document.documentElement.dataset.sel = String(sel);
    });

    // Click anywhere: a burst. Not on things that do something else when
    // clicked (links, buttons, media that opens full screen), and not when the
    // click was the end of a text selection.
    const SKIP = "a, button, input, textarea, select, label, video, dialog, .zoomable, .focus-pill";
    document.addEventListener("click", e => {
        if (!(e.target instanceof Element) || e.target.closest(SKIP)) return;
        if (String(getSelection()).length) return;
        const own = e.target.closest(".role[data-role], .glyph[data-role]");
        burst(e.clientX, e.clientY, own ? { roles: [own.dataset.role], count: 14 } : { count: 16 });
    });

    // Type "fun" anywhere (outside a text field).
    const secret = "fun";
    let typed = "";
    document.addEventListener("keydown", e => {
        if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
        if (e.target instanceof Element && e.target.closest("input, textarea, [contenteditable]")) return;
        typed = (typed + e.key.toLowerCase()).slice(-secret.length);
        if (typed === secret) { typed = ""; rain(); }
    });
})();
