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

// --- FAQ Accordion ---
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
  const btn = item.querySelector(".faq-question");
  const answer = item.querySelector(".faq-answer");

  if (!btn || !answer) return;

  // Wrap the <p> inside a zero-height container for the grid trick
  const p = answer.querySelector("p");
  if (p) {
    const inner = document.createElement("div");
    inner.style.overflow = "hidden";
    p.parentNode.insertBefore(inner, p);
    inner.appendChild(p);
  }

  btn.addEventListener("click", () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";

    // Close all others
    faqItems.forEach((other) => {
      if (other === item) return;
      const otherBtn = other.querySelector(".faq-question");
      const otherAnswer = other.querySelector(".faq-answer");
      if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
      if (otherAnswer) otherAnswer.classList.remove("is-open");
    });

    btn.setAttribute("aria-expanded", String(!isOpen));
    answer.classList.toggle("is-open", !isOpen);
  });
});

// --- Integração do Formulário com Google Sheets ---
const leadForm = document.getElementById("leadForm");
const submitBtn = document.getElementById("submitBtn");

if (leadForm) {
  leadForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Impede a página de recarregar

    // IMPORTANTE: Cole aqui a URL gerada pelo Google Apps Script
    const googleAppUrl = "COLE_SUA_URL_DO_GOOGLE_SCRIPT_AQUI";

    // Mostra estado de carregamento
    const btnText = submitBtn.querySelector(".btn-text");
    const btnLoading = submitBtn.querySelector(".btn-loading");

    btnText.style.display = "none";
    btnLoading.style.display = "inline-block";
    submitBtn.disabled = true;

    try {
      const formData = new FormData(leadForm);
      
      // Enviando os dados via POST. O mode: 'no-cors' evita erro de 
      // bloqueio de requisições do Google (CORS) e força o envio.
      await fetch(googleAppUrl, {
        method: "POST",
        mode: "no-cors",
        body: formData,
      });

      alert("Obrigado! Recebemos suas informações e entraremos em contato em breve.");
      leadForm.reset();
    } catch (error) {
      console.error("Erro no envio:", error);
      alert("Houve um erro de conexão. Por favor, tente novamente.");
    } finally {
      // Restaura o botão
      btnText.style.display = "inline-block";
      btnLoading.style.display = "none";
      submitBtn.disabled = false;
    }
  });
}
