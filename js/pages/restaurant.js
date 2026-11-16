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

// =========================================================================
// PHOTO PREVIEW POPUP MODAL & SLIDER (CARD POPUP)
// =========================================================================
(function initRestaurantPhotoPreview() {
  const modal = document.getElementById("photoPreviewModal");
  if (!modal) return;

  const backdrop = document.getElementById("photoPreviewBackdrop");
  const imgEl = document.getElementById("photoPopupImg");
  const titleEl = document.getElementById("photoPopupTitle");
  const captionEl = document.getElementById("photoPopupCaption");
  const counterEl = document.getElementById("photoPopupCounter");
  const closeBtn = document.getElementById("photoPreviewClose");
  const prevBtn = document.getElementById("photoPopupPrev");
  const nextBtn = document.getElementById("photoPopupNext");
  const thumbsBar = document.getElementById("photoThumbnailsBar");

  let activeImages = [];
  let currentIndex = 0;
  let groupTitle = "Dining Gallery";
  let touchStartX = 0;
  let touchEndX = 0;

  function renderSlide(index) {
    if (!activeImages.length) return;
    currentIndex = (index + activeImages.length) % activeImages.length;
    const item = activeImages[currentIndex];

    if (activeImages.length <= 1) {
      if (prevBtn) prevBtn.style.display = "none";
      if (nextBtn) nextBtn.style.display = "none";
      if (counterEl) counterEl.style.display = "none";
      if (thumbsBar) thumbsBar.style.display = "none";
    } else {
      if (prevBtn) prevBtn.style.display = "flex";
      if (nextBtn) nextBtn.style.display = "flex";
      if (counterEl) counterEl.style.display = "inline-block";
      if (thumbsBar) thumbsBar.style.display = "flex";
    }

    if (imgEl) {
      imgEl.classList.add("is-sliding");
      const tempImg = new Image();
      tempImg.onload = () => {
        imgEl.src = item.src;
        imgEl.alt = item.alt || "Mermaid Restaurant Photo";
        setTimeout(() => {
          imgEl.classList.remove("is-sliding");
        }, 50);
      };
      tempImg.src = item.src;
    }

    if (titleEl) {
      titleEl.innerText = groupTitle;
    }

    if (captionEl) {
      captionEl.innerText = item.alt || "Mermaid Restaurant";
    }

    if (counterEl) {
      counterEl.innerText = `${currentIndex + 1} / ${activeImages.length}`;
    }

    if (thumbsBar) {
      const dots = thumbsBar.querySelectorAll(".photo-thumb-dot");
      dots.forEach((dot, idx) => {
        if (idx === currentIndex) {
          dot.classList.add("is-active");
          dot.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        } else {
          dot.classList.remove("is-active");
        }
      });
    }
  }

  function buildThumbnails() {
    if (!thumbsBar) return;
    thumbsBar.innerHTML = "";
    if (activeImages.length <= 1) return;

    activeImages.forEach((item, idx) => {
      const dot = document.createElement("div");
      dot.className = `photo-thumb-dot ${idx === currentIndex ? "is-active" : ""}`;
      dot.setAttribute("title", item.alt || `Photo ${idx + 1}`);
      dot.innerHTML = `<img src="${item.src}" alt="${item.alt || ""}" />`;
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        renderSlide(idx);
      });
      thumbsBar.appendChild(dot);
    });
  }

  function openPopup(images, startIndex = 0, title = "Dining Gallery") {
    if (!images || !images.length) return;
    activeImages = images;
    groupTitle = title;
    buildThumbnails();
    renderSlide(startIndex);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lucide.createIcons();
  }

  function closePopup() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (imgEl) {
      imgEl.src = "";
    }
  }

  function nextSlide() {
    renderSlide(currentIndex + 1);
  }

  function prevSlide() {
    renderSlide(currentIndex - 1);
  }

  if (closeBtn) closeBtn.addEventListener("click", closePopup);
  if (backdrop) backdrop.addEventListener("click", closePopup);
  modal.addEventListener("click", (e) => {
    if (!e.target.closest(".photo-popup-container")) {
      closePopup();
    }
  });
  if (nextBtn) nextBtn.addEventListener("click", (e) => { e.stopPropagation(); nextSlide(); });
  if (prevBtn) prevBtn.addEventListener("click", (e) => { e.stopPropagation(); prevSlide(); });

  window.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") closePopup();
    else if (e.key === "ArrowRight") nextSlide();
    else if (e.key === "ArrowLeft") prevSlide();
  });

  modal.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  modal.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const distance = touchStartX - touchEndX;
    if (Math.abs(distance) > 40) {
      distance > 0 ? nextSlide() : prevSlide();
    }
  }, { passive: true });

  // Attach to Atmosphere Cards
  const atmosphereCards = document.querySelectorAll(".atmosphere-card");
  if (atmosphereCards.length) {
    const atmosphereImages = Array.from(atmosphereCards).map((card) => {
      const img = card.querySelector("img");
      return {
        src: img ? img.getAttribute("src") : "",
        alt: img ? img.getAttribute("alt") : "",
      };
    }).filter((img) => img.src);

    atmosphereCards.forEach((card, index) => {
      card.addEventListener("click", () => openPopup(atmosphereImages, index, "Island Ambiance"));
    });
  }

  // Attach to Menu Item Photos
  const mediaCards = document.querySelectorAll(".menu-item-media");
  if (mediaCards.length) {
    const menuImages = Array.from(mediaCards).map((card) => {
      const img = card.querySelector("img");
      return {
        src: img ? img.getAttribute("src") : "",
        alt: img ? img.getAttribute("alt") : "",
      };
    }).filter((img) => img.src);

    mediaCards.forEach((card, index) => {
      card.addEventListener("click", () => openPopup(menuImages, index, "Culinary Menu"));
    });
  }
})();
