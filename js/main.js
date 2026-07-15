// ===== БАЗА — интерактив =====

// ---------- Появление при скролле ----------
(function () {
  const targets = document.querySelectorAll(
    '.h-xl, .hero__sub, .hero__actions, .stat-card, .problem-card, .service-card, ' +
    '.svc-card, .review-card, .case-note, .case-slide__main, .step, .offer-card, ' +
    '.acc-item, .industries__list li, .lead__card, .services__sub, .qa-card, ' +
    '.filter-bar, .contact-card, .about-fact, .steps-num li, .when-card, .page-hero__content > *'
  );
  targets.forEach(el => el.classList.add('reveal'));

  // лёгкий каскад внутри общих родителей
  const groups = new Map();
  targets.forEach(el => {
    const p = el.parentElement;
    if (!groups.has(p)) groups.set(p, 0);
    el.style.setProperty('--rd', Math.min(groups.get(p) * 0.08, 0.45) + 's');
    groups.set(p, groups.get(p) + 1);
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(el => io.observe(el));
})();

// ---------- Аккордеоны (общие: FAQ, детальные страницы) ----------
document.querySelectorAll('.acc-item').forEach(item => {
  const head = item.querySelector('.acc-head');
  const body = item.querySelector('.acc-body');
  if (!head || !body) return;
  if (item.classList.contains('open')) body.style.maxHeight = body.scrollHeight + 'px';
  head.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    // закрыть соседей в этом же списке
    item.parentElement.querySelectorAll('.acc-item.open').forEach(o => {
      if (o !== item) { o.classList.remove('open'); o.querySelector('.acc-body').style.maxHeight = 0; }
    });
    item.classList.toggle('open', !isOpen);
    body.style.maxHeight = isOpen ? 0 : body.scrollHeight + 'px';
  });
});

// ---------- Аккордеон отраслей ----------
document.querySelectorAll('.industries__list li').forEach(li => {
  const head = li.querySelector('.ind-head');
  const body = li.querySelector('.ind-body');
  if (!head || !body) return;
  head.addEventListener('click', () => {
    const isOpen = li.classList.contains('open');
    li.parentElement.querySelectorAll('li.open').forEach(o => {
      if (o !== li) { o.classList.remove('open'); o.querySelector('.ind-body').style.maxHeight = 0; }
    });
    li.classList.toggle('open', !isOpen);
    body.style.maxHeight = isOpen ? 0 : body.scrollHeight + 'px';
  });
});

// ---------- Слайдеры ----------
function initSlider(name, trackSel, getStep, getMaxIndex) {
  const nav = document.querySelector(`.slider-nav[data-slider="${name}"]`);
  const track = document.querySelector(trackSel);
  if (!nav || !track) return;
  const prev = nav.querySelector('.slider-nav__btn--prev');
  const next = nav.querySelector('.slider-nav__btn--next');
  let index = 0;
  function update() {
    track.style.transform = `translateX(-${index * getStep()}px)`;
    prev.disabled = index === 0;
    next.disabled = index >= getMaxIndex();
  }
  prev.addEventListener('click', () => { if (index > 0) { index--; update(); } });
  next.addEventListener('click', () => { if (index < getMaxIndex()) { index++; update(); } });
  window.addEventListener('resize', () => { index = Math.min(index, getMaxIndex()); update(); });
  update();
}

initSlider('cases', '.cases__track',
  () => document.getElementById('casesViewport').offsetWidth + 80,
  () => document.querySelectorAll('.case-slide').length - 1
);
initSlider('reviews', '.reviews__track',
  () => document.querySelector('.review-card').offsetWidth + 24,
  () => {
    const total = document.querySelectorAll('.review-card').length;
    const perView = window.innerWidth > 1100 ? 2 : 1;
    return Math.max(0, total - perView);
  }
);
// универсальные ленты карточек (страницы «О нас» и детальные)
document.querySelectorAll('[data-strip]').forEach(strip => {
  const name = strip.dataset.strip;
  initSlider(name, `[data-strip="${name}"] .strip__track`,
    () => strip.querySelector('.strip__track > *').offsetWidth + 24,
    () => {
      const total = strip.querySelectorAll('.strip__track > *').length;
      const perView = Math.max(1, Math.floor(strip.offsetWidth / (strip.querySelector('.strip__track > *').offsetWidth + 24)));
      return Math.max(0, total - perView);
    }
  );
});

// ---------- Фильтр кейсов ----------
(function () {
  const bar = document.querySelector('.filter-bar');
  if (!bar) return;
  bar.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      bar.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      document.querySelectorAll('.kcase').forEach(card => {
        const show = f === 'all' || card.dataset.cat === f;
        card.style.display = show ? '' : 'none';
        if (show) { card.classList.remove('in'); requestAnimationFrame(() => card.classList.add('in')); }
      });
    });
  });
})();

// ---------- Мобильное меню ----------
const burger = document.querySelector('.header__burger');
const nav = document.querySelector('.header__nav');
if (burger) {
  burger.addEventListener('click', () => nav.classList.toggle('open'));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
}

// ---------- Маска телефона ----------
document.querySelectorAll('input[type="tel"]').forEach(phone => {
  phone.addEventListener('input', () => {
    let d = phone.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (!d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    let out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ') ' + d.slice(4, 7);
    if (d.length >= 7) out += '-' + d.slice(7, 9);
    if (d.length >= 9) out += '-' + d.slice(9, 11);
    phone.value = out;
  });
});

// ---------- Отправка форм (send.php на хостинге) ----------
document.querySelectorAll('form.lead-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const btn = form.querySelector('[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Отправляем…';
    btn.disabled = true;
    try {
      const res = await fetch('send.php', { method: 'POST', body: new FormData(form) });
      const ok = res.ok;
      btn.textContent = ok ? 'Заявка отправлена ✓' : 'Ошибка отправки';
      if (ok) form.reset();
    } catch (err) {
      btn.textContent = 'Ошибка сети';
    }
    setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 4000);
  });
});

// ---------- Подсветка активного пункта меню ----------
(function () {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header__nav a').forEach(a => {
    const href = a.getAttribute('href').split('#')[0];
    if (href && href === page) a.classList.add('active');
  });
})();
