(() => {
  const menuButton = document.querySelector('[data-menu-button]');
  const menu = document.querySelector('[data-menu]');

  const setMenu = (open) => {
    if (!menuButton || !menu) return;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.classList.toggle('is-open', open);
  };

  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenu(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenu(false);
    });

    document.addEventListener('click', (event) => {
      if (!menu.classList.contains('is-open')) return;
      if (menu.contains(event.target) || menuButton.contains(event.target)) return;
      setMenu(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1020) setMenu(false);
    });
  }

  const video = document.querySelector('[data-hero-video]');
  const hero = document.querySelector('.ai-hero');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopVideo = window.matchMedia('(min-width: 700px)');
  let heroInView = true;

  const stopVideo = () => {
    if (!video) return;
    video.pause();
    video.classList.remove('is-playing');
    video.removeAttribute('src');
    video.load();
  };

  const updateVideo = () => {
    if (!video) return;
    const saveData = Boolean(navigator.connection && navigator.connection.saveData);
    const canPlay = desktopVideo.matches && !reducedMotion.matches && !saveData;

    if (!canPlay) {
      stopVideo();
      return;
    }

    if (!heroInView || document.hidden) {
      video.pause();
      return;
    }

    if (!video.getAttribute('src')) {
      video.muted = true;
      video.playsInline = true;
      video.src = video.dataset.src;
      video.load();
    }

    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        // The poster remains visible when autoplay is blocked.
      });
    }
  };

  if (video) {
    video.addEventListener('playing', () => video.classList.add('is-playing'));
    video.addEventListener('pause', () => video.classList.remove('is-playing'));

    const scheduleVideo = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 120));
    scheduleVideo(updateVideo);
    reducedMotion.addEventListener?.('change', updateVideo);
    desktopVideo.addEventListener?.('change', updateVideo);

    if ('IntersectionObserver' in window && hero) {
      const heroObserver = new IntersectionObserver(([entry]) => {
        heroInView = entry.isIntersecting;
        updateVideo();
      }, { threshold: 0.05 });

      heroObserver.observe(hero);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        video.pause();
        return;
      }
      updateVideo();
    });
  }

  const revealItems = Array.from(document.querySelectorAll('.ai-reveal'));
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const faqItems = Array.from(document.querySelectorAll('.ai-faq details'));
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  const mobileAction = document.querySelector('.ai-mobile-action');
  const contact = document.querySelector('#contact');
  if (mobileAction && contact && 'IntersectionObserver' in window) {
    let actionHeroInView = Boolean(hero);
    let contactInView = false;
    const syncMobileAction = () => {
      mobileAction.classList.toggle('is-hidden', actionHeroInView || contactInView);
    };
    const actionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === hero) actionHeroInView = entry.isIntersecting;
        if (entry.target === contact) contactInView = entry.isIntersecting;
      });
      syncMobileAction();
    }, { threshold: 0.12 });
    syncMobileAction();
    if (hero) actionObserver.observe(hero);
    actionObserver.observe(contact);
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-goal]');
    if (!target) return;

    const goal = target.dataset.goal;
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: 'ai_landing_click', ai_goal: goal });
    }

    const counterId = Number(window.AI_LANDING_METRIKA_ID);
    if (Number.isFinite(counterId) && typeof window.ym === 'function') {
      window.ym(counterId, 'reachGoal', goal);
    }
  });
})();
