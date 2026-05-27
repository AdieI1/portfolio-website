const navLinks = document.querySelectorAll(".nav-link[data-section]");
const sections = document.querySelectorAll("section[id]");

function setActiveNav(sectionId) {
    const activeSection = sectionId === "edit-projects" ? "projects" : sectionId;
    navLinks.forEach((link) => {
        link.classList.toggle("active", link.dataset.section === activeSection);
    });
}

document.querySelectorAll('.nav-link[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

document.querySelector('.explore-btn[href^="#"]')?.addEventListener("click", (e) => {
    const target = document.querySelector(e.currentTarget.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
});

function initNavbarScroll() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    function handleScroll() {
        const scrolled = window.scrollY > 40;
        navbar.classList.toggle("navbar--scrolled", scrolled);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
}

initNavbarScroll();

function initNavObserver() {
    const visible = new Map();

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    visible.set(entry.target.id, entry.intersectionRatio);
                } else {
                    visible.delete(entry.target.id);
                }
            });

            if (visible.size === 0) return;

            let bestId = "home";
            let bestRatio = -1;
            visible.forEach((ratio, id) => {
                if (ratio > bestRatio) {
                    bestRatio = ratio;
                    bestId = id;
                }
            });
            setActiveNav(bestId);
        },
        { threshold: [0, 0.15, 0.35, 0.55, 0.75], rootMargin: "-72px 0px -45% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
}

initNavObserver();

function loadImage(img) {
    const src = img.dataset.src;
    if (!src || img.src) return Promise.resolve();

    return new Promise((resolve) => {
        const onDone = () => {
            img.classList.add("is-loaded");
            img.removeAttribute("data-src");
            resolve();
        };

        img.addEventListener("load", onDone, { once: true });
        img.addEventListener("error", onDone, { once: true });
        img.src = src;

        if (img.complete) onDone();
    });
}

/* Parallax for sections using background images */
function initParallaxBackgrounds() {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const layers = [...document.querySelectorAll(".parallax-bg-layer")];

    if (!layers.length) return;

    let ticking = false;
    const strength = 0.12; // Adjusted for highly elegant, smooth parallax movement

    function update() {
        ticking = false;
        const vh = window.innerHeight || 800;

        for (const layer of layers) {
            const parent = layer.parentElement;
            if (!parent) continue;

            const r = parent.getBoundingClientRect();
            if (r.bottom < 0 || r.top > vh) continue;

            const parentMid = r.top + r.height / 2;
            const delta = (parentMid - vh / 2) * strength;
            layer.style.setProperty("--parallax-y", `${delta}px`);
        }
    }

    window.addEventListener(
        "scroll",
        () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        },
        { passive: true }
    );
    window.addEventListener("resize", update, { passive: true });
    update();
}

initParallaxBackgrounds();

/* Particle background helper */
function initParticlesCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    const section = canvas?.parentElement;
    if (!canvas || !section) return;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext("2d");
    const color = "#D050FF";
    const maxParticles = 42;
    let particles = [];
    let w = 0;
    let h = 0;
    let rafId = null;
    let running = false;

    function resize() {
        w = canvas.width = section.clientWidth;
        h = canvas.height = section.clientHeight;
    }

    function createParticles() {
        particles = [];
        for (let i = 0; i < maxParticles; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 2.6 + 0.8,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                alpha: Math.random() * 0.4 + 0.45,
                glow: Math.random() > 0.65,
            });
        }
    }

    function draw() {
        if (!running) return;
        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = w;
            else if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            else if (p.y > h) p.y = 0;

            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();

            if (p.glow) {
                ctx.globalAlpha = p.alpha * 0.35;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.globalAlpha = 1;
        rafId = requestAnimationFrame(draw);
    }

    function start() {
        if (running) return;
        running = true;
        resize();
        createParticles();
        draw();
    }

    function stop() {
        running = false;
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        ctx.clearRect(0, 0, w, h);
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) start();
                else stop();
            });
        },
        { threshold: 0.05, rootMargin: "60px" }
    );

    observer.observe(section);

    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (running) {
                resize();
                createParticles();
            }
        }, 200);
    });
}

/* Art marquee — preload images only; loop is pure CSS, always running */
function initArtProjects() {
    const artBlock = document.querySelector(".art-projects");
    if (!artBlock) return;

    let imagesStarted = false;

    async function loadArtImages() {
        if (imagesStarted) return;
        imagesStarted = true;

        const imgs = [...artBlock.querySelectorAll("img[data-src]")];
        for (let i = 0; i < imgs.length; i += 3) {
            await Promise.all(imgs.slice(i, i + 3).map(loadImage));
        }
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) loadArtImages();
            });
        },
        { rootMargin: "200px 0px", threshold: 0.05 }
    );

    observer.observe(artBlock);
}

initArtProjects();

/* IT dev carousel */
function initDevCarousel() {
    const block = document.getElementById("dev-projects");
    if (!block) return;

    const track = block.querySelector(".dev-carousel-track");
    const cards = [...block.querySelectorAll(".dev-card")];
    const dots = [...block.querySelectorAll(".dev-dot")];
    const prevBtn = block.querySelector(".dev-carousel-arrow--prev");
    const nextBtn = block.querySelector(".dev-carousel-arrow--next");
    if (!track || !cards.length) return;

    let index = 0;
    let imagesLoaded = false;

    function goTo(nextIndex) {
        index = (nextIndex + cards.length) % cards.length;
        track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;

        dots.forEach((dot, i) => {
            const active = i === index;
            dot.classList.toggle("is-active", active);
            dot.setAttribute("aria-selected", active ? "true" : "false");
        });
    }

    async function loadDevImages() {
        if (imagesLoaded) return;
        imagesLoaded = true;
        const imgs = [...block.querySelectorAll(".dev-card-media img[data-src]")];
        for (const img of imgs) {
            await loadImage(img);
            await new Promise((r) => setTimeout(r, 24));
        }
    }

    prevBtn?.addEventListener("click", () => goTo(index - 1));
    nextBtn?.addEventListener("click", () => goTo(index + 1));

    dots.forEach((dot) => {
        dot.addEventListener("click", () => {
            const slide = Number(dot.dataset.slide);
            if (!Number.isNaN(slide)) goTo(slide);
        });
    });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) loadDevImages();
            });
        },
        { rootMargin: "200px 0px", threshold: 0.05 }
    );

    observer.observe(block);
    goTo(0);
}

initDevCarousel();

/* Graphic/editing projects grid lazy-load */
function initEditProjects() {
    const block = document.getElementById("edit-projects");
    if (!block) return;

    let started = false;

    async function loadEditImages() {
        if (started) return;
        started = true;
        const imgs = [...block.querySelectorAll("img[data-src]")];
        for (let i = 0; i < imgs.length; i += 2) {
            await Promise.all(imgs.slice(i, i + 2).map(loadImage));
            await new Promise((r) => setTimeout(r, 16));
        }
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) loadEditImages();
            });
        },
        { rootMargin: "240px 0px", threshold: 0.05 }
    );

    observer.observe(block);
}

initEditProjects();

initParticlesCanvas("skillsParticles");
initParticlesCanvas("editParticles");
initParticlesCanvas("contactParticles");

/* Certificate Lightbox Modal Interactivity */
function initCertLightbox() {
    const certCards = document.querySelectorAll(".cert-card");
    const lightbox = document.getElementById("cert-lightbox");
    if (!certCards.length || !lightbox) return;

    const lightboxImg = lightbox.querySelector("#lightbox-img");
    const lightboxTitle = lightbox.querySelector("#lightbox-title");
    const lightboxYear = lightbox.querySelector("#lightbox-year");
    const closeBtn = lightbox.querySelector(".lightbox-close");
    const prevBtn = lightbox.querySelector(".lightbox-prev");
    const nextBtn = lightbox.querySelector(".lightbox-next");

    let currentIndex = 0;

    const certData = [...certCards].map((card) => {
        const img = card.querySelector("img");
        const title = card.querySelector(".cert-title")?.textContent || "";
        const year = card.querySelector(".cert-year")?.textContent || "";
        return {
            src: img ? img.getAttribute("src") : "",
            alt: img ? img.getAttribute("alt") : "",
            title,
            year
        };
    });

    function showLightbox(index) {
        currentIndex = (index + certData.length) % certData.length;
        const data = certData[currentIndex];
        
        lightboxImg.src = data.src;
        lightboxImg.alt = data.alt;
        lightboxTitle.textContent = data.title;
        lightboxYear.textContent = data.year;

        lightbox.classList.add("is-active");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden"; // Disable scroll
    }

    function closeLightbox() {
        lightbox.classList.remove("is-active");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = ""; // Enable scroll
    }

    certCards.forEach((card, idx) => {
        card.addEventListener("click", () => {
            showLightbox(idx);
        });
    });

    closeBtn?.addEventListener("click", closeLightbox);
    prevBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        showLightbox(currentIndex - 1);
    });
    nextBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        showLightbox(currentIndex + 1);
    });

    // Close on background overlay click
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard controls
    document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("is-active")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") showLightbox(currentIndex - 1);
        if (e.key === "ArrowRight") showLightbox(currentIndex + 1);
    });
}

initCertLightbox();
