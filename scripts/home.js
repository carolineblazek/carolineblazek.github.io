// Type swap — wordmark letters and the three roles.
// Each element names its alternate face in data-alt (and optional data-alt-size).
// It is measured in both faces once the fonts are in; it sits at its default
// width and eases to the other face's width on hover, so neighbours slide aside.
(function () {
    const letters = document.querySelectorAll(".wm-letter, .role");
    letters.forEach(l => {
        l.style.setProperty("--alt", "'" + l.dataset.alt + "'");
        if (l.dataset.altSize) {
            l.style.setProperty("--alt-size", l.dataset.altSize);
            l.style.setProperty("--alt-lh", String(1 / parseFloat(l.dataset.altSize)));
        }
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

    // Which line each word of the tagline sits on, as one string. If lighting
    // a role changes this, that role would make the sentence re-wrap.
    function lineMap(el) {
        const out = [];
        let prev = null, line = 0;
        (function walk(n) {
            for (const c of n.childNodes) {
                if (c.nodeType === 3) {
                    const re = /\S+/g; let m;
                    while ((m = re.exec(c.data))) {
                        const r = document.createRange();
                        r.setStart(c, m.index); r.setEnd(c, m.index + m[0].length);
                        const b = r.getBoundingClientRect(), y = b.top + b.height / 2;
                        if (prev !== null && y - prev > b.height * 0.5) line++;
                        prev = y; out.push(line);
                    }
                } else if (c.nodeType === 1 && getComputedStyle(c).display !== "none") walk(c);
            }
        })(el);
        return out.join(",");
    }

    function measure() {
        letters.forEach(l => {
            l.style.removeProperty("--w-base");
            l.style.removeProperty("--w-alt");
            const pinned = l.classList.contains("is-pinned");
            l.classList.remove("is-pinned");      // measure from rest, even if pinned
            const base = l.getBoundingClientRect().width;
            l.classList.add("is-alt");            // same styles as :hover
            const alt = l.getBoundingClientRect().width;
            l.classList.remove("is-alt");
            if (pinned) l.classList.add("is-pinned");
            l.style.setProperty("--w-base", base + "px");
            // Never narrower than at rest: a letter that shrank on hover would
            // slide out from under the cursor, un-hover, grow back, and flicker.
            l.style.setProperty("--w-alt", Math.max(base, alt) + "px");
            l.dataset.altText = alt;
        });
        fitRoles();
    }

    // Each role, lit, gets the widest box that (a) is never narrower than at
    // rest, so it can't slip out from under the cursor, and (b) doesn't make
    // the sentence re-wrap at this window size. The highlight is then inset
    // so the colour sits the same distance from the text on every role.
    function fitRoles() {
        const tagline = document.querySelector(".tagline");
        if (!tagline) return;
        const roles = [...tagline.querySelectorAll(".role")];
        const fs = parseFloat(getComputedStyle(tagline).fontSize);
        const pad = 0.4 * fs, air = 0.3 * fs;
        const pinned = roles.filter(r => r.classList.contains("is-pinned"));
        pinned.forEach(r => r.classList.remove("is-pinned"));
        roles.forEach(r => { r.style.transition = "none"; });
        const rest = lineMap(tagline);

        roles.forEach(r => {
            const base = parseFloat(r.style.getPropertyValue("--w-base"));
            const alt = parseFloat(r.dataset.altText);
            const options = [Math.max(base, alt + pad * 2), Math.max(base, alt), base];
            let lit = base;
            for (const w of options) {
                r.style.setProperty("--w-lit", w + "px");
                r.classList.add("is-pinned");
                const ok = lineMap(tagline) === rest;
                r.classList.remove("is-pinned");
                if (ok) { lit = w; break; }
            }
            r.style.setProperty("--w-lit", lit + "px");
            // half the spare room around the text, minus the padding we want
            const inset = Math.max((lit - alt) / 2 - air, -0.15 * fs);
            r.style.setProperty("--hl-inset", inset + "px");
        });

        void tagline.offsetWidth;
        roles.forEach(r => { r.style.transition = ""; });
        pinned.forEach(r => r.classList.add("is-pinned"));
    }
    document.fonts.ready.then(measure);
    document.fonts.addEventListener("loadingdone", measure); // any late arrivals
    window.addEventListener("resize", measure);
})();

// Letters: a click keeps a letter in its swapped face and colour until it's
// clicked again, so the name can be recomposed. (brand.js adds the burst.)
(function () {
    document.querySelectorAll(".wm-letter").forEach(l => {
        l.addEventListener("click", () => l.classList.toggle("is-pinned"));
    });
})();

// Roles: hovering previews that kind of work in the grid; clicking pins it,
// so its projects stay highlighted (and the rest faded) while you scroll.
// Click the role again, the pill, or press Esc to let go.
(function () {
    const grid = document.querySelector(".work-grid");
    const roles = [...document.querySelectorAll(".role[data-role]")];
    if (!grid || !roles.length) return;
    let pinned = null;

    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "focus-pill";
    pill.innerHTML = '<span class="glyph" aria-hidden="true"></span><span class="focus-pill-label"></span><span class="focus-pill-x" aria-hidden="true">\u00d7</span>';
    document.body.appendChild(pill);
    const label = pill.querySelector(".focus-pill-label");

    const NAMES = { design: "Design", web: "Web", social: "Social media" };

    function show(role) {
        if (role) grid.dataset.focus = role;
        else delete grid.dataset.focus;
    }

    function pin(role) {
        pinned = role;
        roles.forEach(r => {
            const on = r.dataset.role === role;
            r.classList.toggle("is-pinned", on);
            r.setAttribute("aria-pressed", String(on));
        });
        show(role);
        if (role) {
            pill.dataset.role = role;
            pill.querySelector(".glyph").dataset.role = role;
            label.textContent = NAMES[role] + " projects";
            pill.setAttribute("aria-label", "Showing " + NAMES[role] + " projects. Clear");
            pill.classList.add("is-shown");
        } else {
            pill.classList.remove("is-shown");
        }
    }

    roles.forEach(r => {
        r.tabIndex = 0;
        r.setAttribute("role", "button");
        r.setAttribute("aria-pressed", "false");
        r.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") show(r.dataset.role); });
        r.addEventListener("pointerleave", () => show(pinned));
        r.addEventListener("click", () => pin(pinned === r.dataset.role ? null : r.dataset.role));
        r.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); r.click(); }
        });
    });

    pill.addEventListener("click", () => pin(null));
    document.addEventListener("keydown", e => { if (e.key === "Escape" && pinned) pin(null); });
})();
