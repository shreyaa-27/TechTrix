const select = (selector, scope = document) => scope.querySelector(selector);
const selectAll = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const navLinks = select(".nav-links");
const menuToggle = select(".menu-toggle");
const backToTop = select(".back-to-top");
const animateElements = selectAll("[data-animate]");
const particleCanvas = select("#particle-canvas");
const ctx = particleCanvas.getContext("2d");

const links = selectAll(".nav-links a");

const setActiveLink = () => {
  const scrollPos = window.scrollY;
  const offset = window.innerHeight * 0.25;

  links.forEach((link) => {
    const target = select(link.getAttribute("href"));
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const top = rect.top + window.scrollY - offset;
    const bottom = top + rect.height;
    if (scrollPos >= top && scrollPos < bottom) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
};

const toggleMenu = () => {
  menuToggle.classList.toggle("active");
  navLinks.classList.toggle("open");
};

menuToggle?.addEventListener("click", toggleMenu);

links.forEach((link) =>
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.classList.remove("active");
  })
);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animated");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.2,
  }
);

animateElements.forEach((el) => observer.observe(el));

const parallaxElements = selectAll("[data-parallax]");

const applyParallax = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const scrollY = window.scrollY;
  const windowHeight = window.innerHeight;
  const isMobile = window.innerWidth < 768;

  parallaxElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const elementTop = rect.top + scrollY;
    const elementCenter = elementTop + rect.height / 2;
    const viewportCenter = scrollY + windowHeight / 2;
    const distance = viewportCenter - elementCenter;
    let speed = parseFloat(element.getAttribute("data-parallax")) || 0.2;
    
    if (isMobile) {
      speed *= 0.5;
    }
    
    const offset = distance * speed;
    const clampedOffset = Math.max(-100, Math.min(100, offset));

    element.style.transform = `translate3d(0, ${clampedOffset}px, 0)`;
  });
};

const handleScroll = () => {
  if (window.scrollY > window.innerHeight * 0.5) {
    backToTop.classList.add("visible");
  } else {
    backToTop.classList.remove("visible");
  }
  setActiveLink();
  applyParallax();
};

let ticking = false;
const optimizedScroll = () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      handleScroll();
      ticking = false;
    });
    ticking = true;
  }
};

window.addEventListener("scroll", optimizedScroll, { passive: true });

backToTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const resizeCanvas = () => {
  dpr = Math.min(window.devicePixelRatio || 1, 1.8);
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  particleCanvas.width = canvasWidth * dpr;
  particleCanvas.height = canvasHeight * dpr;
  particleCanvas.style.width = `${canvasWidth}px`;
  particleCanvas.style.height = `${canvasHeight}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
};

const PARTICLE_COUNT = 55;
const particles = [];
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
let dpr = 1;

const pointer = {
  x: 0,
  y: 0,
  active: false,
};

const updatePointer = (x, y) => {
  pointer.x = x;
  pointer.y = y;
  pointer.active = true;
};

window.addEventListener("mousemove", (event) => {
  updatePointer(event.clientX, event.clientY);
});

window.addEventListener("mouseleave", () => {
  pointer.active = false;
});

window.addEventListener(
  "touchstart",
  (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    updatePointer(touch.clientX, touch.clientY);
  },
  { passive: true }
);

window.addEventListener(
  "touchmove",
  (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    updatePointer(touch.clientX, touch.clientY);
  },
  { passive: true }
);

window.addEventListener(
  "touchend",
  () => {
    pointer.active = false;
  },
  { passive: true }
);

const createParticle = () => ({
  x: Math.random() * canvasWidth,
  y: Math.random() * canvasHeight,
  radius: Math.random() * 1.4 + 0.6,
  alpha: Math.random() * 0.4 + 0.2,
  speedX: (Math.random() - 0.5) * 0.25,
  speedY: (Math.random() - 0.5) * 0.25,
  glow: Math.random() * 0.6 + 0.4,
  depth: Math.random() * 0.6 + 0.6,
});

const initParticles = () => {
  particles.length = 0;
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    particles.push(createParticle());
  }
};

const drawParticles = () => {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  for (let i = 0; i < particles.length; i += 1) {
    const particle = particles[i];

    particle.x += particle.speedX * particle.depth;
    particle.y += particle.speedY * particle.depth;

    const margin = 20;
    if (particle.x < -margin) particle.x = canvasWidth + margin;
    if (particle.x > canvasWidth + margin) particle.x = -margin;
    if (particle.y < -margin) particle.y = canvasHeight + margin;
    if (particle.y > canvasHeight + margin) particle.y = -margin;

    ctx.beginPath();
    ctx.fillStyle = `rgba(66, 229, 255, ${particle.alpha})`;
    ctx.shadowColor = `rgba(66, 229, 255, ${particle.glow})`;
    ctx.shadowBlur = 14;
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const CONNECTION_DISTANCE = 120;
  const MAX_CONNECTIONS = 4;

  for (let i = 0; i < particles.length; i += 1) {
    let connections = 0;
    for (let j = i + 1; j < particles.length && connections < MAX_CONNECTIONS; j += 1) {
      const p1 = particles[i];
      const p2 = particles[j];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < CONNECTION_DISTANCE) {
        const opacity = (1 - distance / CONNECTION_DISTANCE) * 0.22;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(66, 229, 255, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        connections += 1;
      }
    }
  }

  if (pointer.active) {
    particles.forEach((particle) => {
      const dx = pointer.x - particle.x;
      const dy = pointer.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const influenceRadius = 160;

      if (distance < influenceRadius) {
        const strength = (1 - distance / influenceRadius) * 0.32;
        particle.x -= dx * 0.0025 * particle.depth;
        particle.y -= dy * 0.0025 * particle.depth;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(66, 229, 255, ${strength})`;
        ctx.lineWidth = 1.2;
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(pointer.x, pointer.y);
        ctx.stroke();
      }
    });

    const pointerGradient = ctx.createRadialGradient(
      pointer.x,
      pointer.y,
      0,
      pointer.x,
      pointer.y,
      60
    );
    pointerGradient.addColorStop(0, "rgba(66, 229, 255, 0.25)");
    pointerGradient.addColorStop(1, "rgba(66, 229, 255, 0)");
    ctx.beginPath();
    ctx.fillStyle = pointerGradient;
    ctx.arc(pointer.x, pointer.y, 50, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(drawParticles);
};

const init = () => {
  resizeCanvas();
  initParticles();
  drawParticles();
  handleScroll();
  setActiveLink();
  applyParallax();
};

window.addEventListener("resize", () => {
  resizeCanvas();
  initParticles();
});

init();

