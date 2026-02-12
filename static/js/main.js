document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.querySelector(".navbar");
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    const navAnchors = Array.from(document.querySelectorAll(".nav-links a"));
    const backButton = document.querySelector("#back-btn");
    const progressBar = document.querySelector(".scroll-progress span");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (backButton) {
        const onHomePage = window.location.pathname === "/";
        if (onHomePage) {
            backButton.style.display = "none";
        } else {
            backButton.addEventListener("click", () => {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = "/";
                }
            });
        }
    }

    document.querySelectorAll("[data-bg]").forEach((element) => {
        const background = element.getAttribute("data-bg");
        if (background) {
            element.style.backgroundImage = `url(${background})`;
        }
    });

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("open");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
        });

        navLinks.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });

        document.addEventListener("click", (event) => {
            if (!navLinks.classList.contains("open")) {
                return;
            }
            if (navLinks.contains(event.target) || menuToggle.contains(event.target)) {
                return;
            }
            navLinks.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 760) {
                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
            }
        });
    }

    if (navAnchors.length) {
        const setActiveNav = (activeId = "") => {
            navAnchors.forEach((link) => {
                const targetId = (link.getAttribute("href") || "").split("#")[1] || "";
                const isHomeLink = !targetId && link.pathname === window.location.pathname;
                const isActive = activeId ? targetId === activeId : isHomeLink;

                link.classList.toggle("active", isActive);
                if (isActive) {
                    link.setAttribute("aria-current", "page");
                } else {
                    link.removeAttribute("aria-current");
                }
            });
        };

        const sectionTargets = navAnchors
            .map((link) => (link.getAttribute("href") || "").split("#")[1] || "")
            .filter(Boolean)
            .map((id) => document.getElementById(id))
            .filter(Boolean);

        if (sectionTargets.length && "IntersectionObserver" in window) {
            const sectionObserver = new IntersectionObserver(
                (entries) => {
                    const visibleSections = entries
                        .filter((entry) => entry.isIntersecting)
                        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

                    if (visibleSections.length) {
                        setActiveNav(visibleSections[0].target.id);
                    } else if (window.scrollY < 120) {
                        setActiveNav("");
                    }
                },
                { rootMargin: "-45% 0px -45% 0px", threshold: [0.1, 0.25, 0.5] }
            );

            sectionTargets.forEach((section) => sectionObserver.observe(section));
        }

        setActiveNav(window.scrollY < 120 ? "" : window.location.hash.replace("#", ""));
    }

    const slides = Array.from(document.querySelectorAll(".slide"));
    const nextButton = document.querySelector(".slider-btn.next");
    const prevButton = document.querySelector(".slider-btn.prev");
    const dotButtons = Array.from(document.querySelectorAll(".hero-dot"));

    if (slides.length > 1 && !prefersReducedMotion) {
        let current = 0;
        let timerId = null;

        const updateDots = () => {
            dotButtons.forEach((button, index) => {
                button.classList.toggle("active", index === current);
            });
        };

        const showSlide = (index) => {
            slides[current].classList.remove("active");
            current = (index + slides.length) % slides.length;
            slides[current].classList.add("active");
            updateDots();
        };

        const nextSlide = () => showSlide(current + 1);
        const prevSlide = () => showSlide(current - 1);

        const startSlider = () => {
            timerId = window.setInterval(nextSlide, 6000);
        };

        const stopSlider = () => {
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
            }
        };

        const resetSlider = () => {
            stopSlider();
            startSlider();
        };

        nextButton?.addEventListener("click", () => {
            nextSlide();
            resetSlider();
        });

        prevButton?.addEventListener("click", () => {
            prevSlide();
            resetSlider();
        });

        dotButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const index = Number(button.dataset.slide || 0);
                showSlide(index);
                resetSlider();
            });
        });

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                stopSlider();
            } else {
                startSlider();
            }
        });

        startSlider();
    }

    const fadeElements = document.querySelectorAll(".fade-up");
    if (fadeElements.length && !prefersReducedMotion) {
        const fadeObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.16 }
        );

        fadeElements.forEach((element) => fadeObserver.observe(element));
    } else {
        dotButtons.forEach((button, index) => {
            button.classList.toggle("active", index === 0);
        });
        fadeElements.forEach((element) => element.classList.add("visible"));
    }

    const counters = document.querySelectorAll(".counter");
    if (counters.length) {
        const animateCounter = (counter) => {
            const target = Number(counter.getAttribute("data-target") || 0);
            const duration = prefersReducedMotion ? 1 : 1400;
            const start = performance.now();

            const update = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const value = Math.floor(progress * target);
                counter.textContent = `${value}`;

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    counter.textContent = `${target}+`;
                }
            };

            requestAnimationFrame(update);
        };

        const counterObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.45 }
        );

        counters.forEach((counter) => counterObserver.observe(counter));
    }

    if (navbar || progressBar) {
        let lastY = window.scrollY;
        let ticking = false;

        const handleScroll = () => {
            const currentY = window.scrollY;
            const movingDown = currentY > lastY;
            const maxScrollable = document.documentElement.scrollHeight - window.innerHeight;
            const progress = maxScrollable > 0 ? currentY / maxScrollable : 0;

            navbar?.classList.toggle("scrolled", currentY > 20);
            navbar?.classList.toggle("hide", movingDown && currentY > 120);
            if (progressBar) {
                progressBar.style.transform = `scaleX(${progress})`;
            }

            lastY = currentY;
            ticking = false;
        };

        window.addEventListener(
            "scroll",
            () => {
                if (ticking || prefersReducedMotion) {
                    return;
                }
                ticking = true;
                requestAnimationFrame(handleScroll);
            },
            { passive: true }
        );

        handleScroll();
    }
});
