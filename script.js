/* =========================================================
   ООО «МираМед» — lightweight interactions
   ========================================================= */
(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const header = $(".site-header");
  const burger = $("#burger");
  const mobileMenu = $("#mobile-menu");
  const toTop = $("#to-top");

  function setMenu(open) {
    if (!burger || !mobileMenu) return;
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    mobileMenu.toggleAttribute("hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (burger && mobileMenu) {
    burger.addEventListener("click", () => setMenu(mobileMenu.hasAttribute("hidden")));
    $$("#mobile-menu a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1180) setMenu(false);
    });
  }

  function updateHeader() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 10);
    if (toTop) toTop.toggleAttribute("hidden", window.scrollY < 680);
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  /* Anchor scrolling with sticky header offset */
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      const offset = header ? header.offsetHeight - 2 : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
      history.replaceState(null, "", href);
    });
  });

  /* Reveal on scroll */
  const revealItems = $$(".reveal");
  function revealFallback() {
    const height = window.innerHeight || document.documentElement.clientHeight;
    revealItems.forEach((item) => {
      if (item.classList.contains("in")) return;
      const rect = item.getBoundingClientRect();
      if (rect.top < height * 0.9 && rect.bottom > 0) item.classList.add("in");
    });
  }

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  window.addEventListener("load", revealFallback);
  window.addEventListener("scroll", revealFallback, { passive: true });
  revealFallback();

  /* Count-up metrics */
  function setCounterValue(el, value) {
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    el.textContent = `${prefix}${Math.round(value)}${suffix}`;
  }

  function animateCounter(el) {
    const target = Number(el.dataset.target || 0);
    if (!target) return;
    if (prefersReducedMotion) {
      setCounterValue(el, target);
      return;
    }

    const start = performance.now();
    const duration = 1300;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounterValue(el, target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  const counters = $$(".count-up");
  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.45 });

    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }

  /* Draw SVG paths when their panels enter the viewport */
  $$(".draw-path").forEach((path) => {
    if (typeof path.getTotalLength !== "function") return;
    const length = Math.ceil(path.getTotalLength());
    path.style.setProperty("--path-length", length);
  });

  const drawPanels = $$(".pk-panel, .process-rail, .command-center");
  if ("IntersectionObserver" in window) {
    const drawObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.32 });

    drawPanels.forEach((panel) => drawObserver.observe(panel));
  } else {
    drawPanels.forEach((panel) => panel.classList.add("is-visible"));
  }

  /* Highlight workflow nodes and process cards */
  const stagedItems = $$(".workflow-node, .process-card");
  if ("IntersectionObserver" in window) {
    const stageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-active", entry.isIntersecting);
      });
    }, { threshold: 0.55, rootMargin: "-8% 0px -18% 0px" });

    stagedItems.forEach((item) => stageObserver.observe(item));
  }

  /* Scroll spy */
  const navLinks = $$(".main-nav a");
  const navSections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && navSections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === id);
        });
      });
    }, { threshold: 0, rootMargin: "-42% 0px -52% 0px" });

    navSections.forEach((section) => spy.observe(section));
  }

  /* Gallery filtering and lightbox */
  const filterButtons = $$(".filter-btn");
  const galleryItems = $$("#gallery-grid .gallery-item");
  const lightbox = $("#lightbox");
  const lbImg = $("#lb-img");
  const lbCap = $("#lb-cap");
  const lbClose = $("#lb-close");
  const lbNext = $("#lb-next");
  const lbPrev = $("#lb-prev");
  let visibleItems = galleryItems.slice();
  let lightboxIndex = 0;

  function refreshVisibleItems() {
    visibleItems = galleryItems.filter((item) => !item.classList.contains("is-hidden"));
  }

  function applyFilter(filter) {
    galleryItems.forEach((item) => {
      const categories = (item.dataset.category || "").split(/\s+/);
      const shouldShow = filter === "all" || categories.includes(filter);
      item.classList.toggle("is-hidden", !shouldShow);
    });
    refreshVisibleItems();
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
      applyFilter(button.dataset.filter || "all");
    });
  });

  function openLightbox(index) {
    if (!lightbox || !lbImg || !lbCap || !visibleItems.length) return;
    lightboxIndex = (index + visibleItems.length) % visibleItems.length;
    const figure = visibleItems[lightboxIndex];
    const img = $("img", figure);
    const caption = figure.dataset.cap || img.alt || "";

    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = caption;
    lbCap.textContent = caption;
    lightbox.removeAttribute("hidden");
    lightbox.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => lightbox.classList.add("show"));
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("show");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    window.setTimeout(() => {
      lightbox.setAttribute("hidden", "");
      if (lbImg) lbImg.src = "";
    }, 220);
  }

  function showNext() {
    openLightbox(lightboxIndex + 1);
  }

  function showPrev() {
    openLightbox(lightboxIndex - 1);
  }

  galleryItems.forEach((figure) => {
    figure.setAttribute("tabindex", "0");
    figure.setAttribute("role", "button");
    figure.addEventListener("click", () => {
      refreshVisibleItems();
      openLightbox(visibleItems.indexOf(figure));
    });
    figure.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      refreshVisibleItems();
      openLightbox(visibleItems.indexOf(figure));
    });
  });

  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lbNext) lbNext.addEventListener("click", showNext);
  if (lbPrev) lbPrev.addEventListener("click", showPrev);
  if (lightbox) {
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (lightbox && !lightbox.hasAttribute("hidden")) closeLightbox();
      setMenu(false);
    }

    if (!lightbox || lightbox.hasAttribute("hidden")) return;
    if (event.key === "ArrowRight") showNext();
    if (event.key === "ArrowLeft") showPrev();
  });

  /* Video autoplay fallback */
  const heroVideo = $(".hero-media-bg video");
  if (heroVideo) {
    const play = heroVideo.play();
    if (play && typeof play.catch === "function") {
      play.catch(() => {
        heroVideo.removeAttribute("autoplay");
      });
    }
  }
})();
