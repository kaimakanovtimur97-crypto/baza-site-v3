(() => {
  'use strict';

  const doc = document;
  const body = doc.body;

  if (!body) return;

  const disposers = [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopNavigation = window.matchMedia('(min-width: 1020px)');
  const videoViewport = window.matchMedia('(min-width: 700px)');
  const scrollLocks = new Set();
  const initialBodyOverflow = body.style.overflow;
  const initialBodyPaddingRight = body.style.paddingRight;

  const lockScroll = (owner, shouldLock) => {
    if (shouldLock) scrollLocks.add(owner);
    else scrollLocks.delete(owner);

    if (scrollLocks.size) {
      const scrollbarGap = Math.max(0, window.innerWidth - doc.documentElement.clientWidth);
      body.style.overflow = 'hidden';
      body.style.paddingRight = scrollbarGap ? `${scrollbarGap}px` : initialBodyPaddingRight;
      return;
    }

    body.style.overflow = initialBodyOverflow;
    body.style.paddingRight = initialBodyPaddingRight;
  };

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
    const hoverRules = [];
    const focusRules = [];

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
          const rule = `.${className}:${pseudoClass}{${properties.join(';')}}`;
          if (pseudoClass === 'hover') hoverRules.push(rule);
          else focusRules.push(rule);
        }

        element.removeAttribute(attributeName);
      });
    });

    if (!hoverRules.length && !focusRules.length) return;

    const style = doc.createElement('style');
    style.dataset.interactionStyles = '';
    style.textContent = [
      focusRules.join('\n'),
      hoverRules.length
        ? `@media (hover:hover) and (pointer:fine){${hoverRules.join('\n')}}`
        : '',
    ].filter(Boolean).join('\n');
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

    lockScroll('drawer', open);
    if (open) {
      const firstLink = drawer.querySelector('[data-drawer-link]');
      if (firstLink) {
        firstLink.focus({ preventScroll: true });
        window.setTimeout(() => {
          if (burger.getAttribute('aria-expanded') === 'true') firstLink.focus();
        }, 0);
      }
    } else if (restoreFocus) {
      burger.focus();
    }
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
    on(burger, 'click', () => {
      const shouldOpen = burger.getAttribute('aria-expanded') !== 'true';
      setDrawer(shouldOpen, !shouldOpen);
    });
  }

  doc.querySelectorAll('[data-drawer-link]').forEach((link) => {
    on(link, 'click', () => setDrawer(false, !link.hasAttribute('data-cta')));
  });

  if (drawer) {
    on(drawer, 'keydown', (event) => {
      if (event.key !== 'Tab' || burger?.getAttribute('aria-expanded') !== 'true') return;

      const focusable = Array.from(drawer.querySelectorAll('a[href], button:not([disabled])'))
        .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  on(body, 'pointermove', (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
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

  const modal = doc.querySelector('[data-modal]');
  const modalTitle = modal && modal.querySelector('[data-modal-title]');
  const modalDescription = modal && modal.querySelector('[data-modal-desc]');
  const modalCopy = {
    meeting: {
      title: 'Записаться на встречу',
      description: 'На бесплатной ознакомительной встрече разберём процессы компании и выберем задачу с наибольшим потенциальным эффектом. Напишите или позвоните удобным способом.',
    },
    task: {
      title: 'Рассчитать по моему ТЗ',
      description: 'Опишите задачу или пришлите ТЗ удобным способом. Разберём источники данных, логику и исключения и вернёмся с расчётом, коммерческим предложением и понятным первым этапом.',
    },
  };
  let modalOpener = null;

  const closeModal = () => {
    if (!modal) return;

    if (modal.open) {
      try {
        modal.close();
      } catch (error) {
        modal.removeAttribute('open');
      }
    }

    lockScroll('dialog', false);
    const elementToRestore = modalOpener;
    modalOpener = null;
    if (elementToRestore && doc.contains(elementToRestore)) elementToRestore.focus();
  };

  const openModal = (context, opener) => {
    if (!modal) return;

    const copy = modalCopy[context] || modalCopy.meeting;
    if (modalTitle) modalTitle.textContent = copy.title;
    if (modalDescription) modalDescription.textContent = copy.description;
    modal.dataset.context = context in modalCopy ? context : 'meeting';
    modalOpener = opener && opener.closest('[data-drawer]') && burger
      ? burger
      : opener || null;
    setDrawer(false);

    if (typeof modal.showModal !== 'function') {
      window.location.hash = '#contact';
      return;
    }

    if (modal.open) return;

    lockScroll('dialog', true);
    try {
      modal.showModal();
    } catch (error) {
      lockScroll('dialog', false);
      window.location.hash = '#contact';
      return;
    }
    const closeButton = modal.querySelector('[data-modal-close]');
    if (closeButton) closeButton.focus();

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: 'ai_landing_dialog_open',
        ai_context: modal.dataset.context,
      });
    }

    const metrikaId = Number(window.AI_LANDING_METRIKA_ID);
    if (Number.isFinite(metrikaId) && typeof window.ym === 'function') {
      window.ym(metrikaId, 'reachGoal', `dialog_open_${modal.dataset.context}`);
    }
  };

  on(body, 'click', (event) => {
    const trigger = event.target.closest && event.target.closest('[data-cta]');
    if (!trigger || !modal) return;

    event.preventDefault();
    openModal(trigger.dataset.cta, trigger);
  });

  if (modal) {
    modal.querySelectorAll('[data-modal-close]').forEach((button) => {
      on(button, 'click', closeModal);
    });
    on(modal, 'click', (event) => {
      if (event.target === modal) closeModal();
    });
    on(modal, 'cancel', (event) => {
      event.preventDefault();
      closeModal();
    });
    on(modal, 'close', () => {
      lockScroll('dialog', false);
      if (modalOpener && doc.contains(modalOpener)) modalOpener.focus();
      modalOpener = null;
    });
  }

  on(doc, 'keydown', (event) => {
    if (event.key !== 'Escape') return;

    if (modal && modal.open) {
      event.preventDefault();
      closeModal();
      return;
    }

    if (burger && burger.getAttribute('aria-expanded') === 'true') {
      setDrawer(false, true);
    }
  });

  const casesTrack = doc.querySelector('[data-cases-track]');
  const casesRegion = doc.querySelector('[data-cases-region]');

  if (casesTrack && casesRegion) {
    const allSlides = Array.from(casesTrack.querySelectorAll('[data-case-slide]'));
    const previousButton = doc.querySelector('[data-case-prev]');
    const nextButton = doc.querySelector('[data-case-next]');
    const currentElement = doc.querySelector('[data-case-current]');
    const totalElement = doc.querySelector('[data-case-total]');
    const dotsContainer = doc.querySelector('[data-case-dots]');
    const filters = Array.from(doc.querySelectorAll('[data-case-filter]'));
    let visibleSlides = allSlides.slice();
    let currentIndex = 0;
    let dots = [];
    let carouselFrame = 0;

    allSlides.forEach((slide, index) => {
      if (!slide.id) slide.id = `baza-case-slide-${index + 1}`;
    });

    if (dotsContainer) dotsContainer.setAttribute('role', 'group');

    const syncCarouselMotion = () => {
      casesTrack.style.scrollBehavior = reduceMotion.matches ? 'auto' : 'smooth';
    };

    const paintDots = () => {
      dots.forEach((dot, index) => {
        const isActive = index === currentIndex;
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
        const marker = dot.querySelector('span');
        if (marker) {
          marker.style.width = isActive ? '26px' : '10px';
          marker.style.background = isActive ? 'var(--accd)' : 'rgba(25,25,25,.24)';
        }
      });
    };

    const paintCarousel = () => {
      if (currentElement) currentElement.textContent = String(currentIndex + 1);
      if (totalElement) totalElement.textContent = String(visibleSlides.length);

      if (previousButton) {
        previousButton.disabled = currentIndex <= 0;
        previousButton.style.opacity = previousButton.disabled ? '.35' : '1';
      }
      if (nextButton) {
        nextButton.disabled = currentIndex >= visibleSlides.length - 1;
        nextButton.style.opacity = nextButton.disabled ? '.35' : '1';
      }

      visibleSlides.forEach((slide, index) => {
        const isActive = index === currentIndex;
        slide.setAttribute('aria-hidden', String(!isActive));
        if ('inert' in slide) slide.inert = !isActive;
      });

      paintDots();
    };

    const goToCase = (nextIndex, shouldScroll = true) => {
      currentIndex = Math.max(0, Math.min(visibleSlides.length - 1, nextIndex));
      const slide = visibleSlides[currentIndex];

      if (slide && shouldScroll) {
        casesTrack.scrollTo({
          left: slide.offsetLeft - casesTrack.offsetLeft,
          behavior: reduceMotion.matches ? 'auto' : 'smooth',
        });
      }

      paintCarousel();
    };

    const buildDots = () => {
      if (!dotsContainer) return;

      dotsContainer.textContent = '';
      dots = visibleSlides.map((slide, index) => {
        const button = doc.createElement('button');
        const marker = doc.createElement('span');
        button.type = 'button';
        button.setAttribute('aria-label', `Показать кейс ${index + 1} из ${visibleSlides.length}`);
        button.setAttribute('aria-controls', slide.id);
        button.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:999px;cursor:pointer';
        marker.setAttribute('aria-hidden', 'true');
        marker.style.cssText = 'display:block;width:10px;height:10px;border-radius:999px;background:rgba(25,25,25,.24);transition:width .35s var(--ease),background .3s';
        button.append(marker);
        on(button, 'click', () => goToCase(index));
        dotsContainer.append(button);
        return button;
      });

      paintDots();
    };

    const applyFilter = (filterValue) => {
      allSlides.forEach((slide) => {
        const shouldShow = filterValue === 'all' || slide.dataset.niche === filterValue;
        slide.hidden = !shouldShow;
        slide.setAttribute('aria-hidden', String(!shouldShow));
      });

      visibleSlides = allSlides.filter((slide) => !slide.hidden);
      currentIndex = 0;

      visibleSlides.forEach((slide, index) => {
        const position = slide.querySelector('[data-case-position]');
        const suffix = position?.dataset.caseSuffix || '';
        const label = `Слайд ${index + 1} из ${visibleSlides.length}${suffix}`;
        slide.setAttribute('aria-label', label);
        if (position) position.textContent = label;
      });

      filters.forEach((filter) => {
        const isActive = filter.dataset.caseFilter === filterValue;
        filter.setAttribute('aria-pressed', String(isActive));
        filter.style.background = isActive ? 'var(--night2)' : 'transparent';
        filter.style.color = isActive ? '#fff' : 'var(--ink)';
        filter.style.borderColor = isActive ? 'transparent' : 'rgba(25,25,25,.18)';
      });

      buildDots();
      casesTrack.scrollTo({ left: 0, behavior: 'auto' });
      paintCarousel();
    };

    filters.forEach((filter) => {
      on(filter, 'click', () => applyFilter(filter.dataset.caseFilter));
    });
    if (previousButton) on(previousButton, 'click', () => goToCase(currentIndex - 1));
    if (nextButton) on(nextButton, 'click', () => goToCase(currentIndex + 1));

    on(casesRegion, 'keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToCase(currentIndex + 1);
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToCase(currentIndex - 1);
      }
    });

    on(casesTrack, 'scroll', () => {
      if (carouselFrame) return;

      carouselFrame = window.requestAnimationFrame(() => {
        carouselFrame = 0;
        const scrollPosition = casesTrack.scrollLeft;
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        visibleSlides.forEach((slide, index) => {
          const distance = Math.abs(slide.offsetLeft - casesTrack.offsetLeft - scrollPosition);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });

        if (nearestIndex !== currentIndex) {
          currentIndex = nearestIndex;
          paintCarousel();
        }
      });
    }, { passive: true });

    let dragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let dragDistance = 0;

    on(casesTrack, 'pointerdown', (event) => {
      if (event.pointerType === 'touch' || event.button !== 0) return;
      dragging = true;
      dragDistance = 0;
      dragStartX = event.clientX;
      dragStartScroll = casesTrack.scrollLeft;
      casesTrack.style.scrollBehavior = 'auto';
      casesTrack.style.cursor = 'grabbing';
      casesTrack.style.userSelect = 'none';
      casesTrack.setPointerCapture(event.pointerId);
    });

    on(casesTrack, 'pointermove', (event) => {
      if (!dragging) return;
      const delta = event.clientX - dragStartX;
      dragDistance = Math.abs(delta);
      if (dragDistance > 4) {
        event.preventDefault();
        casesTrack.scrollLeft = dragStartScroll - delta;
      }
    });

    const finishDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      casesTrack.style.cursor = '';
      casesTrack.style.userSelect = '';
      syncCarouselMotion();
      if (casesTrack.hasPointerCapture(event.pointerId)) casesTrack.releasePointerCapture(event.pointerId);

      if (dragDistance > 4) {
        const scrollPosition = casesTrack.scrollLeft;
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        visibleSlides.forEach((slide, index) => {
          const distance = Math.abs(slide.offsetLeft - casesTrack.offsetLeft - scrollPosition);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });

        goToCase(nearestIndex);
      }
    };

    on(casesTrack, 'pointerup', finishDrag);
    on(casesTrack, 'pointercancel', finishDrag);
    on(window, 'resize', () => goToCase(currentIndex, true), { passive: true });
    syncCarouselMotion();
    onMediaChange(reduceMotion, syncCarouselMotion);
    buildDots();
    paintCarousel();
  }

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
    const dialog = target.closest('[data-modal]');
    const context = dialog ? dialog.dataset.context : '';
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: 'ai_landing_click',
        ai_goal: goal,
        ...(context ? { ai_context: context } : {}),
      });
    }

    const metrikaId = Number(window.AI_LANDING_METRIKA_ID);
    if (Number.isFinite(metrikaId) && typeof window.ym === 'function') {
      window.ym(metrikaId, 'reachGoal', context ? `${goal}_${context}` : goal);
    }
  });

})();
