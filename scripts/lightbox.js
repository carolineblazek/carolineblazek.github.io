// Click any project photo or video to see it full screen.
// Slideshows (flipbook.js) open here too, with ← → arrows and a page count.
// Close with the ×, Esc, or a click outside the media.
(() => {
    const pad = i => String(i).padStart(2, "0");

    const box = document.createElement("dialog");
    box.className = "lightbox";
    box.setAttribute("aria-label", "Full-screen view");
    box.innerHTML =
        '<button type="button" class="lightbox-close" aria-label="Close">×</button>' +
        '<div class="lightbox-media"></div>' +
        '<div class="lightbox-nav" hidden>' +
            '<button type="button" class="lightbox-prev" aria-label="Previous page">←</button>' +
            '<span class="lightbox-count"></span>' +
            '<button type="button" class="lightbox-next" aria-label="Next page">→</button>' +
        '</div>';
    document.body.appendChild(box);
    const media = box.querySelector(".lightbox-media");
    const nav = box.querySelector(".lightbox-nav");
    const count = box.querySelector(".lightbox-count");
    let gallery = null;   // { total, src(i), index, label, onChange(i) } while a slideshow is open

    function show(node) {
        media.replaceChildren(node);
        if (!box.open) box.showModal();
    }

    // A single photo or video
    function openMedia(el) {
        gallery = null;
        nav.hidden = true;
        const copy = el.cloneNode(false);
        ["class", "loading", "tabindex", "role"].forEach(a => copy.removeAttribute(a));
        if (copy.tagName === "VIDEO") {
            copy.muted = true;
            copy.controls = true;   // lets the viewer unmute or scrub
            copy.loop = true;
            copy.playsInline = true;
        }
        show(copy);
        if (copy.tagName === "VIDEO") copy.play().catch(() => {});
    }

    // A slideshow, starting on its current page
    function step(by) {
        const g = gallery;
        g.index = ((g.index - 1 + by + g.total) % g.total) + 1;
        const img = new Image();
        img.src = g.src(g.index);
        img.alt = g.label + ", page " + g.index + " of " + g.total;
        count.textContent = pad(g.index) + " / " + pad(g.total);
        show(img);
        if (g.onChange) g.onChange(g.index);   // keep the slideshow on the page in step
    }

    function openGallery(g) {
        gallery = g;
        nav.hidden = false;
        step(0);
    }

    window.Lightbox = { openMedia, openGallery };

    document.querySelectorAll(".row img:not(.flipbook-page), .row video").forEach(el => {
        el.classList.add("zoomable");
        el.tabIndex = 0;
        el.setAttribute("role", "button");
        el.addEventListener("click", () => openMedia(el));
        el.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openMedia(el); }
        });
    });

    box.querySelector(".lightbox-close").addEventListener("click", () => box.close());
    box.querySelector(".lightbox-prev").addEventListener("click", () => step(-1));
    box.querySelector(".lightbox-next").addEventListener("click", () => step(1));
    box.addEventListener("click", e => { if (e.target === box || e.target === media) box.close(); });
    box.addEventListener("keydown", e => {
        if (!gallery) return;
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
    });
    let x0 = null;
    media.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
    media.addEventListener("touchend", e => {
        if (x0 === null || !gallery) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
        x0 = null;
    });
    box.addEventListener("close", () => { media.replaceChildren(); gallery = null; });   // stops any video
})();
