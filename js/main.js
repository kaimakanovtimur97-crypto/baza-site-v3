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

// ---------- Grid Beam: световой блик по сетке блоб-арта ----------
document.querySelectorAll('.blob-art').forEach(art => {
  const beam = document.createElement('i');
  beam.className = 'ba-beam';
  art.appendChild(beam);
});

// ---------- Count-up: анимация чисел в статистике при появлении ----------
(function () {
  const nums = document.querySelectorAll('.stat-card__num, .about-stat__num');
  if (!nums.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = t => 1 - Math.pow(1 - t, 3);

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      io.unobserve(el);
      const raw = el.textContent.trim();
      const m = raw.match(/\d+/);
      if (!m || reduce) return;                 // без числа или reduced-motion — оставляем как есть
      const target = parseInt(m[0], 10);
      const prefix = raw.slice(0, m.index);
      const suffix = raw.slice(m.index + m[0].length);
      const dur = 1400;
      const t0 = performance.now();
      el.textContent = prefix + '0' + suffix;
      function tick(now) {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = prefix + Math.round(ease(p) * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = raw;              // возвращаем точный исходный текст
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.4 });

  nums.forEach(el => io.observe(el));
})();

// ---------- Плитки футера (сетка «клетки» как в макете v2) ----------
(function () {
  const holder = document.getElementById('ftiles');
  if (!holder) return;
  const tiles = [
    [166.6,107],[166.6,214],[25,214],[166.6,321],[166.6,428],[166.6,535],
    [449.7,0],[449.7,214],[449.7,321],[449.7,428],[449.7,535],
    [732.9,0],[732.9,107],[732.9,321],[732.9,428],[732.9,535],
    [308.2,0],[308.2,107],[308.2,214],[308.2,321],[308.2,428],[308.2,535],
    [591.3,0],[591.3,107],[591.3,214],[591.3,321],[591.3,428],[591.3,535],
    [874.5,107],[874.5,214],[1015.6,214],[874.5,321],[874.5,428],[874.5,535]
  ];
  tiles.forEach(([x, y]) => {
    const d = document.createElement('div');
    d.className = 'tile';
    d.style.left = (x + 25) + 'px';
    d.style.top = (y + 107) + 'px';
    holder.appendChild(d);
  });
})();

// ---------- Hero-арт: плитки (клетки) как в макете Figma ----------
(function () {
  document.querySelectorAll('.hero__art .blob-art__grid').forEach(g => {
    const W = 651, H = 492, tw = 100, th = 74, gx = 8, gy = 8;
    const cols = Math.ceil(W / (tw + gx)), rows = Math.ceil(H / (th + gy));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const d = document.createElement('div');
        d.className = 'tile';
        d.style.left = (c * (tw + gx)) + 'px';
        d.style.top = (r * (th + gy)) + 'px';
        d.style.width = tw + 'px';
        d.style.height = th + 'px';
        g.appendChild(d);
      }
    }
  });
})();
