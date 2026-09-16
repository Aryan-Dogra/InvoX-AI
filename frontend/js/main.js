// =========================================================
// InvoX AI — Landing Page Behavior
// No frameworks, just small focused pieces of DOM logic.
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  setupMobileNav();
  setupActiveNavHighlight();
});

/**
 * Mobile nav: toggles the nav links panel open/closed on small screens
 * and closes it again once a link is clicked.
 */
function setupMobileNav() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");

  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/**
 * Highlights the nav link for the section currently in view,
 * so "Features" / "How It Works" light up as the user scrolls.
 */
function setupActiveNavHighlight() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav__link[href^='#']");

  if (!sections.length || !navLinks.length || !("IntersectionObserver" in window)) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          const matches = link.getAttribute("href") === `#${id}`;
          link.classList.toggle("is-active", matches);
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
}