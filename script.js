document.documentElement.classList.add("js");

const revealElements = document.querySelectorAll("[data-reveal]");
const parallaxElements = document.querySelectorAll("[data-parallax]");
const counters = document.querySelectorAll("[data-counter]");
const sectionLinks = document.querySelectorAll("[data-section-link]");
const sections = document.querySelectorAll("[data-section]");
const scrollMeter = document.getElementById("scroll-meter");
const scrollLabel = document.getElementById("scroll-label");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 90}ms`;
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const updateActiveSection = () => {
  const checkpoint = window.innerHeight * 0.38;
  let activeId = sections[0]?.getAttribute("data-section");

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();

    if (rect.top <= checkpoint && rect.bottom >= checkpoint) {
      activeId = section.getAttribute("data-section");
    }
  });

  sectionLinks.forEach((link) => {
    link.classList.toggle(
      "active",
      link.getAttribute("data-section-link") === activeId
    );
  });
};

const animateCounter = (element) => {
  const target = Number(element.dataset.counter);
  const duration = 1300;
  const start = performance.now();

  const tick = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(target * eased);

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  },
  {
    threshold: 0.55,
  }
);

counters.forEach((counter) => counterObserver.observe(counter));

let ticking = false;

const updateScrollUi = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  const percent = Math.round(progress * 100);

  updateActiveSection();

  if (scrollMeter) {
    scrollMeter.style.width = `${percent}%`;
  }

  if (scrollLabel) {
    scrollLabel.textContent = `${percent}%`;
  }

  if (!prefersReducedMotion) {
    parallaxElements.forEach((element) => {
      const speed = Number(element.dataset.speed || 0.14);
      const rect = element.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
      const translateY = centerOffset * speed * -0.18;
      element.style.transform = `translate3d(0, ${translateY}px, 0)`;
    });
  }

  ticking = false;
};

const requestTick = () => {
  if (ticking) {
    return;
  }

  ticking = true;
  requestAnimationFrame(updateScrollUi);
};

updateScrollUi();
window.addEventListener("scroll", requestTick, { passive: true });
window.addEventListener("resize", requestTick);
