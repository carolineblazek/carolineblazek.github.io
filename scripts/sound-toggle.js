// Adds a sound button to any video marked data-sound.
// Autoplay only works muted, so the video always starts silent and the
// viewer turns sound on themselves — which is also the gesture browsers
// require before any audio may play.
document.querySelectorAll("video[data-sound]").forEach(video => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sound-toggle";

    function render() {
        const on = !video.muted;
        button.textContent = on ? "Sound on" : "Sound off";
        button.setAttribute("aria-pressed", String(on));
        button.setAttribute("aria-label", on ? "Turn sound off" : "Turn sound on");
    }

    button.addEventListener("click", () => {
        video.muted = !video.muted;
        if (!video.muted) video.play().catch(() => {});   // some browsers pause on unmute
        render();
    });

    // Keep the label honest if anything else changes the state.
    video.addEventListener("volumechange", render);

    video.muted = true;
    render();
    (video.parentNode || video).appendChild(button);
});
