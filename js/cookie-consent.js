(() => {
  'use strict';

  const COUNTER_ID = 112287829;
  const STORAGE_KEY = 'baza_cookie_consent_v1';
  const CONSENT_ANALYTICS = 'analytics';
  const CONSENT_NECESSARY = 'necessary';

  // The AI landing uses this value for its existing reachGoal events.
  window.AI_LANDING_METRIKA_ID = COUNTER_ID;

  const readConsent = () => {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (_error) {
      return null;
    }
  };

  const saveConsent = (value) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (_error) {
      // The choice still applies to the current page when storage is unavailable.
    }
  };

  const enableMetrika = () => {
    if (window.__bazaMetrikaEnabled) return;
    window.__bazaMetrikaEnabled = true;

    ((m, e, t, r, i, k, a) => {
      m[i] = m[i] || function metrikaQueue() {
        (m[i].a = m[i].a || []).push(arguments);
      };
      m[i].l = 1 * new Date();

      for (let j = 0; j < document.scripts.length; j += 1) {
        if (document.scripts[j].src === r) return;
      }

      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = true;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, 'script', `https://mc.yandex.ru/metrika/tag.js?id=${COUNTER_ID}`, 'ym');

    window.dataLayer = window.dataLayer || [];
    window.ym(COUNTER_ID, 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      referrer: document.referrer,
      url: window.location.href,
      accurateTrackBounce: true,
      trackLinks: true,
    });
  };

  const hideBanner = (banner) => {
    banner.hidden = true;
    banner.remove();
  };

  const showBanner = () => {
    if (document.querySelector('[data-cookie-consent]')) return;

    const banner = document.createElement('section');
    banner.className = 'cookie-consent';
    banner.dataset.cookieConsent = '';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-labelledby', 'cookie-consent-title');
    banner.setAttribute('aria-describedby', 'cookie-consent-description');
    banner.innerHTML = `
      <div class="cookie-consent__content">
        <p class="cookie-consent__title" id="cookie-consent-title">Мы используем cookie</p>
        <p class="cookie-consent__text" id="cookie-consent-description">Необходимые cookie помогают сайту работать. С вашего разрешения Яндекс Метрика будет собирать статистику посещений и взаимодействий, чтобы мы могли улучшать сайт.</p>
      </div>
      <div class="cookie-consent__actions">
        <button class="cookie-consent__button cookie-consent__button--primary" type="button" data-cookie-accept>Разрешить аналитику</button>
        <button class="cookie-consent__button" type="button" data-cookie-necessary>Только необходимые</button>
      </div>
    `;

    banner.querySelector('[data-cookie-accept]').addEventListener('click', () => {
      saveConsent(CONSENT_ANALYTICS);
      enableMetrika();
      hideBanner(banner);
    });

    banner.querySelector('[data-cookie-necessary]').addEventListener('click', () => {
      saveConsent(CONSENT_NECESSARY);
      hideBanner(banner);
    });

    document.body.prepend(banner);
  };

  const consent = readConsent();
  if (consent === CONSENT_ANALYTICS) {
    enableMetrika();
    return;
  }

  if (consent !== CONSENT_NECESSARY) {
    showBanner();
  }
})();
