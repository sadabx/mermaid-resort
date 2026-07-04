lucide.createIcons();

window.addEventListener("load", () => {
  const preloader = document.getElementById("pagePreloader");
  if (!preloader) return;
  preloader.classList.add("is-hidden");
  setTimeout(() => preloader.remove(), 400);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
);

document
  .querySelectorAll(".scroll-reveal")
  .forEach((el) => revealObserver.observe(el));

setTimeout(() => {
  document
    .querySelectorAll(".reveal-on-load")
    .forEach((el) => el.classList.add("is-visible"));
}, 100);
