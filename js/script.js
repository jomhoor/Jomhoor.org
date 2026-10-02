/* ========================================
   Republic — Interactive Scripts
   ======================================== */

/* Apply stored theme immediately — before any DOMContentLoaded listener fires */
(function(){
  try {
    var t = localStorage.getItem('republic-theme');
    if (t) document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();

document.addEventListener('DOMContentLoaded', () => {
  // ——— Navigation Scroll Effect ———
  const nav = document.getElementById('nav') || document.querySelector('.nav');
  let lastScroll = 0;

  if (nav) {
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      if (currentScroll > 50) {
        nav.classList.add('nav--scrolled');
      } else {
        nav.classList.remove('nav--scrolled');
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  // ——— Mobile Navigation Toggle ———
  const navToggle = document.getElementById('navToggle') || nav?.querySelector('.nav__toggle');
  const navLinks = document.getElementById('navLinks') || nav?.querySelector('.nav__links');
  const desktopNav = window.matchMedia('(min-width: 1200px)');

  const setMenuOpen = (open, { restoreFocus = false } = {}) => {
    if (!navToggle || !navLinks) return;
    navToggle.classList.toggle('nav__toggle--open', open);
    navLinks.classList.toggle('nav__links--open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('nav-open', open);
    if (open) navLinks.querySelector('a')?.focus({ preventScroll: true });
    else if (restoreFocus) navToggle.focus();
  };

  if (navToggle && navLinks) {
    if (!navLinks.id) navLinks.id = 'navLinks';
    navToggle.setAttribute('aria-controls', navLinks.id);
    navToggle.setAttribute('aria-expanded', 'false');

    navToggle.addEventListener('click', () => {
      setMenuOpen(!navLinks.classList.contains('nav__links--open'));
    });

    // Close on any link (sections, docs, language switch)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setMenuOpen(false));
    });

    // Close when tapping the panel's empty area
    navLinks.addEventListener('click', (e) => {
      if (e.target === navLinks) setMenuOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('nav__links--open')) {
        setMenuOpen(false, { restoreFocus: true });
      }
    });

    desktopNav.addEventListener('change', (e) => {
      if (e.matches) setMenuOpen(false);
    });
  }

  // ——— Highlight the menu link of the section in view ———
  const sectionLinks = navLinks
    ? [...navLinks.querySelectorAll('.nav__link[href^="#"]')]
        .map(link => ({ link, section: document.querySelector(link.getAttribute('href')) }))
        .filter(({ section }) => section)
    : [];

  if (sectionLinks.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(({ link, section }) => {
          const active = section === entry.target;
          link.classList.toggle('nav__link--active', active);
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sectionLinks.forEach(({ section }) => spy.observe(section));
  }

  // ——— Theme Toggle (Light / Dark) ———
  const themeToggle = document.getElementById('themeToggle');

  if (themeToggle) {
    const toggleTheme = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('republic-theme', next); } catch {}
    };
    themeToggle.setAttribute('tabindex', '0');
    themeToggle.addEventListener('click', toggleTheme);
    themeToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') toggleTheme(e);
    });
  }

  // ——— Scroll Animations (Intersection Observer) ———
  const animatedElements = document.querySelectorAll('[data-animate]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px',
    }
  );

  animatedElements.forEach((el, index) => {
    // Stagger delay for sibling elements
    el.style.transitionDelay = `${index % 5 * 0.1}s`;
    observer.observe(el);
  });

  // ——— Smooth Scroll for Anchor Links ———
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navHeight = nav ? nav.offsetHeight : 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ——— Copy Wallet Addresses on Click ———
  document.querySelectorAll('.wallet-address__value').forEach(el => {
    el.addEventListener('click', async () => {
      const text = el.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        const original = el.textContent;
        el.textContent = '✓ Copied!';
        el.style.color = '#5B9DF5';
        setTimeout(() => {
          el.textContent = original;
          el.style.color = '';
        }, 2000);
      } catch {
        // Fallback for older browsers
        const range = document.createRange();
        range.selectNode(el);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
      }
    });
  });

  // ——— Active Nav Link Highlighting ———
  const sections = document.querySelectorAll('section[id]');
  
  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 100;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      const link = nav?.querySelector(`a[href="#${id}"]`);

      if (link) {
        if (scrollPos >= top && scrollPos < top + height) {
          link.classList.add('nav__link--active');
        } else {
          link.classList.remove('nav__link--active');
        }
      }
    });
  }, { passive: true });

  // ——— Identity Carousel ———
  const carousel = document.querySelector('.id-carousel');
  if (carousel) {
    const slides = carousel.querySelectorAll('.id-carousel__slide');
    const dots = carousel.querySelectorAll('.id-carousel__dot');
    const labels = carousel.querySelectorAll('.id-carousel__label');
    let currentSlide = 0;
    let autoTimer = null;

    function goToSlide(index) {
      slides[currentSlide].classList.remove('id-carousel__slide--active');
      dots[currentSlide].classList.remove('id-carousel__dot--active');
      labels[currentSlide].classList.remove('id-carousel__label--active');

      currentSlide = index;

      slides[currentSlide].classList.add('id-carousel__slide--active');
      dots[currentSlide].classList.add('id-carousel__dot--active');
      labels[currentSlide].classList.add('id-carousel__label--active');
    }

    function nextSlide() {
      goToSlide((currentSlide + 1) % slides.length);
    }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(nextSlide, 6000);
    }

    function stopAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    // Click handlers for dots and labels
    [...dots, ...labels].forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.goto, 10);
        if (idx !== currentSlide) {
          goToSlide(idx);
          startAuto(); // reset timer on manual navigation
        }
      });
    });

    // Pause auto on hover, resume on leave
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);

    startAuto();
  }
});
