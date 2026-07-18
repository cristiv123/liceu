(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("main-nav");
    if (!toggle || !nav) return;

    function closeNav() {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }

    function toggleNav() {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    }

    toggle.addEventListener("click", toggleNav);

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  });
})();
