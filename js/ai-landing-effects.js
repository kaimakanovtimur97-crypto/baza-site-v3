(() => {
  'use strict';

  const doc = document;
  const body = doc.body;

  if (!body) return;

  const disposers = [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopNavigation = window.matchMedia('(min-width: 1020px)');
  const videoViewport = window.matchMedia('(min-width: 700px)');

  const on = (target, eventName, handler, options) => {
    target.addEventListener(eventName, handler, options);
    disposers.push(() => target.removeEventListener(eventName, handler, options));
  };

  const onMediaChange = (mediaQuery, handler) => {
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handler);
      disposers.push(() => mediaQuery.removeEventListener('change', handler));
      return;
    }

    mediaQuery.addListener(handler);
    disposers.push(() => mediaQuery.removeListener(handler));
  };

  const installInteractionStyles = () => {
    const stateAttributes = [
      ['data-hover-style', 'hover'],
      ['data-focus-style', 'focus-visible'],
    ];
    const rules = [];

    stateAttributes.forEach(([attributeName, pseudoClass]) => {
      doc.querySelectorAll(`[${attributeName}]`).forEach((element, index) => {
        const className = `baza-${pseudoClass.replace('-', '')}-${index}`;
        const declaration = doc.createElement('span').style;
        declaration.cssText = element.getAttribute(attributeName) || '';
        const properties = [];

        for (let propertyIndex = 0; propertyIndex < declaration.length; propertyIndex += 1) {
          const propertyName = declaration.item(propertyIndex);
          const propertyValue = declaration.getPropertyValue(propertyName);
          if (propertyValue) properties.push(`${propertyName}:${propertyValue}!important`);
        }

        if (properties.length) {
          element.classList.add(className);
          rules.push(`.${className}:${pseudoClass}{${properties.join(';')}}`);
        }

        element.removeAttribute(attributeName);
      });
    });

    if (!rules.length) return;

    const style = doc.createElement('style');
    style.dataset.interactionStyles = '';
    style.textContent = rules.join('\n');
    doc.head.append(style);
  };

  const setFixedTokens = () => {
    body.style.setProperty('--acc', '#336fff');
    body.style.setProperty('--rv', '26px');
    body.style.setProperty('--rt', '780ms');
    body.style.setProperty('--mq', '34s');
  };

  installInteractionStyles();
  setFixedTokens();

  const revealItems = Array.from(doc.querySelectorAll('[data-reveal]'));
  const reveal = (element) => element.style.setProperty('--r', '1');

  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealItems.forEach(reveal);
  } else {
    revealItems.forEach((element) => {
      const bounds = element.getBoundingClientRect();
      element.style.setProperty('--r', bounds.top > window.innerHeight * 0.85 ? '0' : '1');
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach((element) => revealObserver.observe(element));
    disposers.push(() => revealObserver.disconnect());
  }

  let pendingRevealItems = revealItems;
  const progress = doc.querySelector('[data-progress]');
  const header = doc.querySelector('[data-header]');
  const timeline = doc.querySelector('[data-timeline]');
  const mobileCta = doc.querySelector('[data-mcta]');
  const hero = doc.querySelector('[data-hero]');
  const contact = doc.querySelector('#contact');
  let animationFrame = 0;

  const renderScrollState = () => {
    animationFrame = 0;

    if (pendingRevealItems.length) {
      pendingRevealItems = pendingRevealItems.filter((element) => {
        if (element.style.getPropertyValue('--r') === '1') return false;
        const bounds = element.getBoundingClientRect();
        if (bounds.top < window.innerHeight * 0.94 && bounds.bottom > -40) {
          reveal(element);
          return false;
        }
        return true;
      });
    }

    const root = doc.documentElement;
    const maximumScroll = Math.max(1, root.scrollHeight - window.innerHeight);
    const scrollPosition = window.scrollY;

    if (progress) {
      progress.style.setProperty('--sp', String(Math.min(1, scrollPosition / maximumScroll)));
    }

    if (header) {
      header.style.setProperty('--hb', scrollPosition > 24 ? '1' : '0');
    }

    if (timeline) {
      const bounds = timeline.getBoundingClientRect();
      const progressValue = (window.innerHeight * 0.62 - bounds.top) / Math.max(1, bounds.height);
      timeline.style.setProperty('--tp', String(Math.max(0, Math.min(1, progressValue))));
    }

    if (mobileCta) {
      const heroBounds = hero ? hero.getBoundingClientRect() : null;
      const heroIsPast = heroBounds ? heroBounds.height > 0 && heroBounds.bottom < 80 : false;
      const contactIsVisible = contact
        ? contact.getBoundingClientRect().top < window.innerHeight - 60
        : false;
      const shouldShow = heroIsPast && !contactIsVisible;

      mobileCta.style.setProperty('--mo', shouldShow ? '1' : '0');
      mobileCta.style.setProperty('--mv', shouldShow ? 'visible' : 'hidden');
      mobileCta.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    }
  };

  const scheduleScrollRender = () => {
    if (!animationFrame) animationFrame = window.requestAnimationFrame(renderScrollState);
  };

  on(window, 'scroll', scheduleScrollRender, { passive: true });
  on(window, 'resize', scheduleScrollRender, { passive: true });
  on(window, 'load', renderScrollState);
  renderScrollState();
  window.requestAnimationFrame(() => window.requestAnimationFrame(renderScrollState));

  const settleTimer = window.setTimeout(renderScrollState, 600);
  disposers.push(() => window.clearTimeout(settleTimer));

  const drawer = doc.querySelector('[data-drawer]');
  const burger = doc.querySelector('[data-burger]');

  const setDrawer = (open, restoreFocus = false) => {
    if (!drawer || !burger) return;

    drawer.style.setProperty('--dr', open ? '1' : '0');
    drawer.style.setProperty('--drv', open ? 'visible' : 'hidden');
    drawer.setAttribute('aria-hidden', String(!open));
    if ('inert' in drawer) drawer.inert = !open;

    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');

    const bars = burger.querySelectorAll('span');
    if (bars.length === 3) {
      bars[0].style.transform = open ? 'translateY(7px) rotate(45deg)' : '';
      bars[1].style.opacity = open ? '0' : '1';
      bars[2].style.transform = open ? 'translateY(-7px) rotate(-45deg)' : '';
    }

    body.style.overflow = open ? 'hidden' : '';
    if (!open && restoreFocus) burger.focus();
  };

  const syncNavigation = () => {
    body.style.setProperty('--navd', desktopNavigation.matches ? 'flex' : 'none');
    body.style.setProperty('--burgd', desktopNavigation.matches ? 'none' : 'flex');
    if (desktopNavigation.matches) setDrawer(false);
  };

  syncNavigation();
  onMediaChange(desktopNavigation, syncNavigation);

  if (drawer) {
    drawer.setAttribute('aria-hidden', 'true');
    if ('inert' in drawer) drawer.inert = true;
  }

  if (burger) {
    on(burger, 'click', () => setDrawer(burger.getAttribute('aria-expanded') !== 'true'));
  }

  doc.querySelectorAll('[data-drawer-link]').forEach((link) => {
    on(link, 'click', () => setDrawer(false));
  });

  on(doc, 'keydown', (event) => {
    if (event.key === 'Escape' && burger && burger.getAttribute('aria-expanded') === 'true') {
      setDrawer(false, true);
    }
  });

  on(body, 'pointermove', (event) => {
    const card = event.target.closest && event.target.closest('[data-spot]');
    if (!card) return;

    const bounds = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${(((event.clientX - bounds.left) / bounds.width) * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(((event.clientY - bounds.top) / bounds.height) * 100).toFixed(1)}%`);
    card.style.setProperty('--ho', '1');
  }, { passive: true });

  on(body, 'pointerout', (event) => {
    const card = event.target.closest && event.target.closest('[data-spot]');
    if (card && !card.contains(event.relatedTarget)) card.style.setProperty('--ho', '0');
  }, true);

  on(body, 'pointerover', (event) => {
    const button = event.target.closest && event.target.closest('[data-sheen]');
    if (!button || button.contains(event.relatedTarget)) return;

    const bar = button.querySelector('[data-sheen-bar]');
    if (!bar) return;

    bar.style.animation = 'none';
    void bar.offsetWidth;
    bar.style.animation = 'bazaSheen 1.1s var(--ease)';
  }, true);

  const faqItems = Array.from(doc.querySelectorAll('[data-faq-item]'));

  const setFaqOpen = (item, open) => {
    const button = item.querySelector('[data-faq-btn]');
    const panel = item.querySelector('[data-faq-panel]');
    const icon = item.querySelector('[data-faq-icon]');

    if (panel) {
      panel.style.gridTemplateRows = open ? '1fr' : '0fr';
      panel.setAttribute('aria-hidden', String(!open));
    }
    if (icon) icon.style.transform = open ? 'rotate(135deg)' : 'rotate(0deg)';
    if (button) button.setAttribute('aria-expanded', String(open));
    item.style.setProperty('--fo', open ? '1' : '0');
  };

  faqItems.forEach((item, index) => {
    const button = item.querySelector('[data-faq-btn]');
    const panel = item.querySelector('[data-faq-panel]');

    if (!button || !panel) return;

    const buttonId = button.id || `baza-faq-button-${index + 1}`;
    const panelId = panel.id || `baza-faq-panel-${index + 1}`;
    button.id = buttonId;
    button.setAttribute('aria-controls', panelId);
    panel.id = panelId;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', buttonId);
    panel.setAttribute('aria-hidden', 'true');

    on(button, 'click', () => {
      const shouldOpen = button.getAttribute('aria-expanded') !== 'true';
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) setFaqOpen(otherItem, false);
      });
      setFaqOpen(item, shouldOpen);
    });
  });

  const heroVideo = doc.querySelector('[data-hero-video]');

  if (heroVideo) {
    let videoIsInView = true;

    const stopVideo = () => {
      heroVideo.pause();
      heroVideo.removeAttribute('src');
      heroVideo.load();
    };

    const updateVideo = () => {
      const saveData = Boolean(navigator.connection && navigator.connection.saveData);

      if (!videoViewport.matches || reduceMotion.matches || saveData) {
        stopVideo();
        return;
      }

      if (!videoIsInView || doc.hidden) {
        heroVideo.pause();
        return;
      }

      if (!heroVideo.getAttribute('src')) {
        heroVideo.muted = true;
        heroVideo.playsInline = true;
        heroVideo.src = heroVideo.dataset.src;
        heroVideo.load();
      }

      const playback = heroVideo.play();
      if (playback && typeof playback.catch === 'function') playback.catch(() => {});
    };

    const requestIdle = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 140));
    requestIdle(updateVideo);
    onMediaChange(videoViewport, updateVideo);
    onMediaChange(reduceMotion, updateVideo);
    on(doc, 'visibilitychange', () => {
      if (doc.hidden) heroVideo.pause();
      else updateVideo();
    });

    if ('IntersectionObserver' in window && hero) {
      const videoObserver = new IntersectionObserver(([entry]) => {
        videoIsInView = entry.isIntersecting;
        updateVideo();
      }, { threshold: 0.05 });

      videoObserver.observe(hero);
      disposers.push(() => videoObserver.disconnect());
    }
  }

  on(body, 'click', (event) => {
    const target = event.target.closest && event.target.closest('[data-goal]');
    if (!target) return;

    const goal = target.dataset.goal;
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: 'ai_landing_click', ai_goal: goal });
    }

    const metrikaId = Number(window.AI_LANDING_METRIKA_ID);
    if (Number.isFinite(metrikaId) && typeof window.ym === 'function') {
      window.ym(metrikaId, 'reachGoal', goal);
    }
  });

})();
