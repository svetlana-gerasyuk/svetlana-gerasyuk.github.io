// Доработки витрины поверх шаблона: фильтры по нишам, «Показать ещё», бейдж «Новый»,
// палитры сайтов, блок преимуществ, финальный призыв, поочерёдное появление и параллакс.
(() => {
  const D = JSON.parse(document.getElementById('data').textContent);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cases = D.cases || [];
  const cards = [...document.querySelectorAll('#cases .case')];
  const dots = (colors) => `<span class="swatches" aria-hidden="true">${colors.map((c) => `<i style="background:${esc(c)}"></i>`).join('')}</span>`;

  // карточки: группа, бейдж «Новый», тёмная тема, палитра сайта, стрелка
  cards.forEach((card, i) => {
    const c = cases[i]; if (!c) return;
    card.dataset.group = c.group || '';
    if (c.theme) card.classList.add(c.theme);
    if (c.isNew) card.querySelector('.meta')?.insertAdjacentHTML('afterbegin', '<span class="badge new">Новый</span>');
    if (c.colors?.length) card.querySelector('h3')?.insertAdjacentHTML('afterend', `<div class="case-colors">${dots(c.colors)}<span>Палитра этого сайта</span></div>`);
    const open = card.querySelector('.open'); if (open) open.innerHTML = 'Открыть сайт <span>→</span>';
  });

  // фильтры и «Показать ещё»
  const LIMIT = 6;
  const groups = ['Красота', 'Дом и ремонт', 'Авто', 'Услуги'].filter((g) => cases.some((c) => c.group === g));
  const box = $('cases');
  let current = 'Все', expanded = false;
  if (groups.length > 1) {
    const nav = document.createElement('div');
    nav.className = 'filters'; nav.setAttribute('role', 'group'); nav.setAttribute('aria-label', 'Фильтр по нишам');
    nav.innerHTML = ['Все', ...groups].map((g) => `<button type="button" data-g="${esc(g)}" aria-pressed="${g === 'Все'}">${esc(g)}<small>${g === 'Все' ? cases.length : cases.filter((c) => c.group === g).length}</small></button>`).join('');
    box.before(nav);
    nav.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      current = b.dataset.g;
      nav.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      layout(true);
    });
  }
  const colored = cases.filter((c) => c.colors?.length);
  if (colored.length > 2) box.insertAdjacentHTML('beforebegin', `<p class="colors-note">${dots(colored.slice(0, 5).map((c) => c.colors[2] || c.colors[0]))}Каждый сайт – в цветах своего бизнеса</p>`);
  const more = document.createElement('div');
  more.className = 'more';
  more.innerHTML = '<button type="button" class="btn btn-ghost"></button>';
  box.after(more);
  more.querySelector('button').addEventListener('click', () => { expanded = true; layout(false); });

  function layout(scroll) {
    const pool = cards.filter((_, i) => current === 'Все' || cases[i]?.group === current);
    const shown = current === 'Все' && !expanded ? pool.slice(0, LIMIT) : pool;
    cards.forEach((card) => card.classList.add('is-hidden'));
    shown.forEach((card, k) => {
      card.classList.remove('is-hidden');
      card.classList.toggle('flip', k % 2 === 1);
      card.classList.toggle('no-line', k === 0);
    });
    const rest = pool.length - shown.length;
    more.hidden = rest <= 0;
    more.querySelector('button').textContent = `Показать ещё ${rest} ${rest % 10 === 1 && rest % 100 !== 11 ? 'работу' : [2, 3, 4].includes(rest % 10) && ![12, 13, 14].includes(rest % 100) ? 'работы' : 'работ'}`;
    if (scroll) box.previousElementSibling?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'nearest' });
  }
  layout(false);

  // преимущества – перед услугами
  const icon = {
    fast: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    niche: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
    mobile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>',
    lead: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>'
  };
  const perks = [
    ['fast', 'Быстро', 'Демо вашего сайта готово до первого разговора – смотрите результат, а не обещания.'],
    ['niche', 'Под вашу нишу', 'Тексты, фото и цвета под ваш бизнес и ваших клиентов, а не общий шаблон.'],
    ['mobile', 'Адаптивно', 'Сайт одинаково удобен на телефоне и на компьютере.'],
    ['lead', 'С заявкой', 'Кнопка ведёт в мессенджер или на звонок – клиент пишет вам сразу.']
  ];
  const sec = document.createElement('section');
  sec.className = 'block'; sec.id = 'perks';
  sec.innerHTML = `<div class="block-head reveal in"><div><div class="eyebrow">Преимущества</div><h2>Почему со мной удобно</h2></div></div>
    <ul class="perks">${perks.map(([k, t, p]) => `<li class="stagger"><span class="ico">${icon[k]}</span><h3>${t}</h3><p>${p}</p></li>`).join('')}</ul>`;
  $('services')?.before(sec);

  // финальный призыв
  const fin = $('finalTitle');
  if (fin) {
    fin.textContent = 'Соберу демо вашего сайта до разговора';
    const p = fin.nextElementSibling;
    if (p?.tagName === 'P') p.textContent = 'Вы сначала смотрите результат, потом решаете. Нажмите на мессенджер – сообщение уже набрано, останется отправить.';
  }

  // поочерёдное появление: преимущества, услуги, шаги
  document.querySelectorAll('#price li, #steps li').forEach((li) => li.classList.add('stagger'));
  document.querySelectorAll('.perks, #price, #steps').forEach((list) => {
    list.classList.remove('reveal');
    [...list.querySelectorAll('.stagger')].forEach((li, k) => li.style.setProperty('--d', `${k * 90}ms`));
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .2 });
  document.querySelectorAll('.stagger').forEach((el) => io.observe(el));

  if (calm) return;

  // параллакс: веер телефонов следует за мышью и чуть отстаёт при прокрутке; телефоны в карточках плывут
  const fan = $('fan');
  let mx = 0, my = 0, ticking = false;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) addEventListener('mousemove', (e) => { mx = (e.clientX / innerWidth - .5) * 2; my = (e.clientY / innerHeight - .5) * 2; tick(); }, { passive: true });
  addEventListener('scroll', tick, { passive: true });
  function tick() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  function frame() {
    ticking = false;
    if (fan && scrollY < innerHeight * 1.2) fan.style.transform = `translate3d(${mx * -10}px, ${scrollY * .12 + my * -8}px, 0) rotate(${mx * -.6}deg)`;
    document.querySelectorAll('#cases .case:not(.is-hidden) .devices .phone').forEach((ph) => {
      const r = ph.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const t = (r.top + r.height / 2) / innerHeight - .5;
      ph.style.setProperty('--py', `${(t * -36).toFixed(1)}px`);
    });
  }
  frame();
})();
