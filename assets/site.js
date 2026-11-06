/* Витрина Светланы Герасюк: появление блоков, фильтры, переключатель устройств,
   квиз «Подберём сайт», окно сообщения в Telegram / MAX. Без библиотек. */
(() => {
  const TG = "FotiniyaKulakova";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- появление при прокрутке ---------- */
  const rv = $$(".rv");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rv.forEach((el) => io.observe(el));
  } else rv.forEach((el) => el.classList.add("in"));

  /* ---------- шапка и плавающая кнопка ---------- */
  const top = $("#top"), dock = $("#dock"), hero = $(".hero"), contact = $("#contact");
  let heroOut = false, contactIn = false;
  const setDock = () => {
    const on = heroOut && !contactIn;
    dock.classList.toggle("is-on", on);
    dock.setAttribute("aria-hidden", on ? "false" : "true");
    $$("a,button", dock).forEach((b) => (b.tabIndex = on ? 0 : -1));
  };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => { heroOut = !e.isIntersecting; setDock(); }, { threshold: 0.15 }).observe(hero);
    new IntersectionObserver(([e]) => { contactIn = e.isIntersecting; setDock(); }, { threshold: 0.2 }).observe(contact);
  }
  const onScroll = () => top.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- фильтр работ ---------- */
  const fbtns = $$("[data-filter]");
  fbtns.forEach((b) => b.addEventListener("click", () => {
    const f = b.dataset.filter;
    fbtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $$("#works [data-group]").forEach((card) => {
      const show = f === "all" || card.dataset.group === f;
      card.classList.toggle("is-hidden", !show);
      if (show) card.classList.add("in");
    });
  }));

  // последняя карточка в нечётном ряду растягивается на всю ширину
  const wide = () => {
    const all = $$(".works .work"), vis = all.filter((c) => !c.classList.contains("is-hidden"));
    all.forEach((c) => c.classList.toggle("is-wide", false));
    if (vis.length % 2 === 1) vis[vis.length - 1].classList.add("is-wide");
  };
  wide(); fbtns.forEach((b) => b.addEventListener("click", wide));

  /* ---------- компьютер / телефон ---------- */
  $$(".stage").forEach((stage) => {
    const btns = $$(".seg button", stage);
    btns.forEach((b) => b.addEventListener("click", () => {
      stage.dataset.view = b.dataset.view;
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    }));
  });

  /* ---------- окно сообщения ---------- */
  const dlg = $("#msg"), txt = $("#msg-text"), tg = $("#msg-tg"), mx = $("#msg-max"), ok = $("#msg-ok");
  const MSG = {
    general: "Здравствуйте! Хочу обсудить сайт для своего бизнеса.\nКоротко о нас: ",
    like: (t) => `Здравствуйте! Мне понравился сайт «${t}». Хочу обсудить похожий для своего бизнеса.`,
    plan: (p) => `Здравствуйте! Интересует тариф «${p}». Хочу обсудить сайт для своего бизнеса.\nКоротко о нас: `,
  };
  const sync = () => { tg.href = `https://t.me/${TG}?text=${encodeURIComponent(txt.value)}`; };
  const copy = async () => {
    try { await navigator.clipboard.writeText(txt.value); return true; }
    catch { txt.select(); try { return document.execCommand("copy"); } catch { return false; } }
  };
  let lastFocus = null;
  function openMsg(text, title, sub) {
    lastFocus = document.activeElement;
    txt.value = text; ok.textContent = "";
    $("#msg-h").textContent = title || "Обсудим ваш проект";
    $("#msg-sub").textContent = sub || "Сообщение уже готово - можно дополнить его и отправить в удобный мессенджер.";
    sync();
    if (typeof dlg.showModal === "function") { dlg.showModal(); }
    else { window.open(tg.href, "_blank", "noopener"); return; }
    setTimeout(() => { txt.focus(); txt.setSelectionRange(txt.value.length, txt.value.length); }, 30);
  }
  window.openMsg = openMsg;
  txt.addEventListener("input", sync);
  tg.addEventListener("click", () => { copy().then((c) => { if (c) ok.textContent = "Текст скопирован. Если он не подставился в Telegram, вставьте его в чат."; }); });
  mx.addEventListener("click", () => { copy().then((c) => { ok.textContent = c ? "Текст скопирован - вставьте его в чат MAX." : "Скопируйте текст вручную и вставьте его в чат MAX."; }); });
  $("#msg-copy").addEventListener("click", async () => { ok.textContent = (await copy()) ? "Текст скопирован." : "Не получилось скопировать - выделите текст вручную."; });
  $$("[data-close]", dlg).forEach((b) => b.addEventListener("click", () => dlg.close()));
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => { if (lastFocus && lastFocus.focus) lastFocus.focus(); });

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-msg],[data-like],[data-plan]");
    if (!b) return;
    if (b.dataset.like) openMsg(MSG.like(b.dataset.like), "Хочу похожий сайт", "Название проекта уже в сообщении. Можно добавить пару слов о вашем бизнесе.");
    else if (b.dataset.plan) openMsg(MSG.plan(b.dataset.plan), "Обсудим тариф");
    else openMsg(MSG.general);
  });

  /* ---------- квиз ---------- */
  const form = $("#quizForm"), sets = $$("fieldset", form), back = $("#quizBack"), res = $("#quizResult"), bars = $$(".quiz__progress i");
  let step = 0;
  const show = (n) => {
    step = n;
    sets.forEach((f, i) => (f.hidden = i !== n));
    back.hidden = n === 0;
    const nb = $("#quizNext"); if (nb) { nb.disabled = !val(sets[n].querySelector("input").name); nb.textContent = n === sets.length - 1 ? "Показать результат" : "Далее"; }
    bars.forEach((b, i) => b.classList.toggle("on", i <= n));
  };
  const val = (name) => (form.elements[name] && form.elements[name].value) || "";
  const PLANS = {
    start: { name: "Старт", style: "Лайт", price: "от 10 000 ₽", why: "Аккуратный одностраничный сайт до 5 блоков: кто вы, услуги и цены, контакты и кнопки мессенджеров. Хороший вариант, чтобы клиент быстро понял, чем вы занимаетесь, и написал вам." },
    std: { name: "Стандарт", style: "Продающий", price: "от 15 000 ₽", why: "Сайт до 10 блоков с одной интерактивной функцией: формой записи с выбором услуги, дня и времени или формой расчёта. Заявка уходит вам в мессенджер готовым текстом." },
    full: { name: "Под ключ", style: "Кино", price: "от 25 000 ₽", why: "Выразительный сайт со сценами при прокрутке и галереей работ - когда важно, чтобы клиент оценил уровень ваших проектов с первого экрана." },
  };
  const EX = {
    "Красота и уход": ["w-studio42", "Студия 42"],
    "Ремонт, строительство, интерьер": ["w-potolki", "Про Потолки"],
    "Автоуслуги": ["w-bw", "Black & White"],
    "Ателье, мастерская, производство": ["w-shtory", "Пошив штор"],
  };
  const EX_SHOW = { "Ремонт, строительство, интерьер": ["w-interior", "Больше, чем дом"] };
  const MAT = {
    "Есть фото и тексты": "Готовые материалы ускорят работу: срок считается с момента, когда они у меня.",
    "Есть фото, текстов нет": "Тексты помогу составить по вашим ответам на несколько вопросов.",
    "Пока почти ничего нет": "Начнём с короткого разговора: помогу собрать тексты и подберу изображения для оформления. Срок обсудим с учётом этого.",
  };
  function pick(biz, goal) {
    if (goal === "Собирать заявки и записи") return "std";
    if (goal === "Показывать работы или товары") return biz === "Ремонт, строительство, интерьер" ? "full" : "std";
    return "start";
  }
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function result() {
    const biz = val("biz"), goal = val("goal"), mat = val("mat");
    const key = pick(biz, goal), p = PLANS[key];
    const ex = (goal === "Показывать работы или товары" && EX_SHOW[biz]) || EX[biz];
    form.hidden = true; $(".quiz__progress").hidden = true;
    res.hidden = false;
    res.innerHTML = `
      <div class="quiz__step">Подходящий формат</div>
      <h3>«${p.name}» - стиль «${p.style}»</h3>
      <span class="price">ориентир: ${p.price}</span>
      <p>${p.why}</p>
      <p>${MAT[mat] || ""}</p>
      ${ex ? `<p>Похожий пример: <a class="inline" href="#${ex[0]}">${esc(ex[1])}</a>.</p>` : ""}
      <ul class="quiz__answers">
        <li>Сфера: <b>${esc(biz)}</b></li>
        <li>Задача сайта: <b>${esc(goal)}</b></li>
        <li>Материалы: <b>${esc(mat)}</b></li>
      </ul>
      <div class="btns">
        <button class="btn btn--accent" type="button" id="quizSend">Получить предложение <span class="arr" aria-hidden="true">→</span></button>
        <button class="btn btn--line-light" type="button" id="quizAgain">Пройти заново</button>
      </div>
      <p class="quiz__note">Это ориентир, а не окончательная цена. Точную стоимость и срок назову после короткого обсуждения задачи.</p>`;
    res.focus();
    $("#quizSend").addEventListener("click", () => openMsg(
      `Здравствуйте! Мои ответы в подборе сайта:\n- Сфера: ${biz}\n- Задача сайта: ${goal}\n- Материалы: ${mat}\nПодходящий формат по подбору: «${p.name}» (${p.price}). Хочу получить предложение.`,
      "Получить предложение", "Ваши ответы уже в сообщении. Можно добавить пару слов о бизнесе и отправить."));
    $("#quizAgain").addEventListener("click", () => {
      form.reset(); form.hidden = false; $(".quiz__progress").hidden = false; res.hidden = true; show(0);
      const first = $("input", sets[0]); if (first) first.focus();
    });
  }
  const next = $("#quizNext");
  let byPointer = false;
  form.addEventListener("pointerdown", () => { byPointer = true; });
  form.addEventListener("keydown", () => { byPointer = false; });
  const advance = () => {
    if (!val(sets[step].querySelector("input").name)) return;
    if (step < sets.length - 1) { show(step + 1); } else result();
  };
  form.addEventListener("change", (e) => {
    if (e.target.type !== "radio") return;
    next.disabled = false;
    // мышью и пальцем - сразу дальше; с клавиатуры - кнопкой «Далее» или Enter
    if (byPointer) setTimeout(advance, 260);
  });
  form.addEventListener("submit", (e) => { e.preventDefault(); advance(); });
  next.addEventListener("click", advance);
  back.addEventListener("click", () => show(Math.max(0, step - 1)));
})();
