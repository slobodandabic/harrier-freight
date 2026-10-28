/* Harrier Freight Lines — concept site interactions */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile menu ---------- */
  const toggle = $(".nav__toggle");
  const menu = $("#mobileMenu");
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    menu.hidden = open;
  });
  $$("a", menu).forEach(a => a.addEventListener("click", () => {
    toggle.setAttribute("aria-expanded", "false");
    menu.hidden = true;
  }));

  /* ---------- Dispatch board: Chicago clock + live-ish updates ---------- */
  const clock = $("#boardClock");
  const tick = () => {
    const t = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago", hour: "2-digit", minute: "2-digit", hour12: false
    }).format(new Date());
    clock.textContent = `${t} CT`;
  };
  tick(); setInterval(tick, 15000);

  const lanesPool = [
    ["CHI → DET", "VAN"], ["CHI → STL", "REEFER"], ["CHI → MSP", "FLAT"], ["CHI → IND", "VAN"],
    ["CHI → CMH", "REEFER"], ["CHI → MKE", "VAN"], ["CHI → KC", "FLAT"], ["CHI → BNA", "REEFER"],
    ["CHI → PIT", "VAN"], ["CHI → ATL", "REEFER"], ["CHI → DAL", "TEAM"], ["JOLIET RAMP → CHI", "DRAY"]
  ];
  const statuses = [["ON TIME", "ok"], ["ON TIME", "ok"], ["LOADING", "load"], ["DELIVERED", "ok"], ["IN TRANSIT", "ok"]];
  const rows = $$("#boardRows li");
  const trucksOut = $("#trucksOut");
  if (!reduceMotion) {
    setInterval(() => {
      const row = rows[Math.floor(Math.random() * rows.length)];
      const [lane, eq] = lanesPool[Math.floor(Math.random() * lanesPool.length)];
      const [st, cls] = statuses[Math.floor(Math.random() * statuses.length)];
      row.innerHTML = `<span class="lane">${lane}</span><span class="eq">${eq}</span><span class="st st--${cls}">${st}</span>`;
      row.classList.add("flash");
      setTimeout(() => row.classList.remove("flash"), 700);
      trucksOut.textContent = 112 + Math.floor(Math.random() * 10);
    }, 2600);
  }

  /* ---------- Stats count-up ---------- */
  const counters = $$("[data-count]");
  const runCount = el => {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    if (reduceMotion) { el.textContent = end.toFixed(dec); return; }
    const start = performance.now(), dur = 1300;
    const step = now => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (end * eased).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Reveal on scroll ---------- */
  $$(".svc, .pay__card, .review, .section__head, .lane-card, .map, .wizard, .apply, .perks li, .ccard")
    .forEach(el => el.classList.add("reveal"));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      if (e.target.matches("[data-count]")) runCount(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  $$(".reveal").forEach(el => io.observe(el));
  counters.forEach(el => io.observe(el));

  /* ---------- Lane map ---------- */
  const HUB = { x: 440, y: 205 };
  const cities = [
    { id: "MKE", name: "Milwaukee, WI",   x: 425, y: 128, mi: 92,  transit: "Same day", loads: "45+", lx: -8,  ly: -14, anchor: "end" },
    { id: "MSP", name: "Minneapolis, MN", x: 270, y: 70,  mi: 409, transit: "1 day",    loads: "25+", lx: 0,   ly: -16, anchor: "middle" },
    { id: "DET", name: "Detroit, MI",     x: 570, y: 160, mi: 283, transit: "Same day", loads: "60+", lx: 14,  ly: -10, anchor: "start" },
    { id: "PIT", name: "Pittsburgh, PA",  x: 700, y: 235, mi: 461, transit: "1 day",    loads: "15+", lx: 0,   ly: -16, anchor: "middle" },
    { id: "CMH", name: "Columbus, OH",    x: 600, y: 268, mi: 355, transit: "1 day",    loads: "35+", lx: 14,  ly: 18,  anchor: "start" },
    { id: "IND", name: "Indianapolis, IN",x: 485, y: 285, mi: 183, transit: "Same day", loads: "50+", lx: 14,  ly: 18,  anchor: "start" },
    { id: "STL", name: "St. Louis, MO",   x: 360, y: 320, mi: 297, transit: "Same day", loads: "40+", lx: -14, ly: 6,   anchor: "end" },
    { id: "KC",  name: "Kansas City, MO", x: 205, y: 300, mi: 510, transit: "1 day",    loads: "20+", lx: 0,   ly: -16, anchor: "middle" },
    { id: "BNA", name: "Nashville, TN",   x: 500, y: 400, mi: 473, transit: "1 day",    loads: "20+", lx: 14,  ly: 6,   anchor: "start" },
    { id: "ATL", name: "Atlanta, GA",     x: 590, y: 478, mi: 716, transit: "2 days",   loads: "10+", lx: 14,  ly: 6,   anchor: "start" },
    { id: "DAL", name: "Dallas, TX",      x: 130, y: 470, mi: 925, transit: "2 days · 1 team", loads: "10+", lx: 14, ly: 6, anchor: "start" }
  ];
  const NS = "http://www.w3.org/2000/svg";
  const linesG = $("#laneLines"), nodesG = $("#laneNodes");
  const card = { city: $("#lcCity"), mi: $("#lcMiles"), tr: $("#lcTransit"), ld: $("#lcLoads") };

  cities.forEach(c => {
    const mx = (HUB.x + c.x) / 2, my = (HUB.y + c.y) / 2 - 18;
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", `M${HUB.x},${HUB.y} Q${mx},${my} ${c.x},${c.y}`);
    path.setAttribute("class", "lane-line");
    path.dataset.id = c.id;
    linesG.appendChild(path);

    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "node");
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", `${c.name}: ${c.transit}, ${c.mi} miles`);
    g.dataset.id = c.id;
    g.innerHTML = `<circle class="hit" cx="${c.x}" cy="${c.y}" r="24"/><circle class="dotc" cx="${c.x}" cy="${c.y}" r="8"/><text x="${c.x + c.lx}" y="${c.y + c.ly}" text-anchor="${c.anchor}">${c.id}</text>`;
    nodesG.appendChild(g);

    const activate = () => select(c.id);
    g.addEventListener("click", activate);
    g.addEventListener("mouseenter", activate);
    g.addEventListener("focus", activate);
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); } });
  });

  function select(id) {
    const c = cities.find(x => x.id === id);
    $$(".lane-line", linesG).forEach(p => p.classList.toggle("is-on", p.dataset.id === id));
    $$(".node", nodesG).forEach(n => n.classList.toggle("is-on", n.dataset.id === id));
    card.city.textContent = c.name.toUpperCase();
    card.mi.textContent = `${c.mi} mi`;
    card.tr.textContent = c.transit;
    card.ld.textContent = c.loads;
  }
  select("DET");

  /* ---------- Quote wizard ---------- */
  const form = $("#quoteForm");
  const steps = $$(".step", form);
  const dots = $$(".wizard__steps li", form);
  const bar = $(".wizard__bar i", form);
  const btnPrev = $("[data-prev]", form), btnNext = $("[data-next]", form), btnSubmit = $("[data-submit]", form);
  let current = 1;

  // Pickup date: default tomorrow, no past dates
  const dateInput = form.elements.date;
  const toISO = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const today = new Date();
  dateInput.min = toISO(today);
  dateInput.value = toISO(new Date(today.getTime() + 86400000));

  const val = name => (form.elements[name]?.value || "").trim();
  const mark = (name, bad) => form.elements[name]?.classList.toggle("is-bad", bad);
  const showErr = (key, on) => $(`[data-err="${key}"]`, form).classList.toggle("is-on", on);

  const validators = {
    1: () => {
      const ok = !!form.querySelector('input[name="equipment"]:checked');
      showErr("equipment", !ok); return ok;
    },
    2: () => {
      const bad = ["origin", "destination", "date"].filter(n => !val(n));
      ["origin", "destination", "date"].forEach(n => mark(n, bad.includes(n)));
      showErr("route", bad.length > 0); return bad.length === 0;
    },
    3: () => {
      const w = Number(val("weight"));
      const badC = !val("commodity"), badW = !(w > 0 && w <= 48000);
      mark("commodity", badC); mark("weight", badW);
      showErr("load", badC || badW); return !(badC || badW);
    },
    4: () => {
      const badN = !val("name");
      const badE = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val("email"));
      const badP = val("phone").replace(/\D/g, "").length < 10;
      mark("name", badN); mark("email", badE); mark("phone", badP);
      showErr("contact", badN || badE || badP); return !(badN || badE || badP);
    }
  };

  function go(n) {
    current = n;
    steps.forEach(s => s.classList.toggle("is-active", Number(s.dataset.step) === n));
    dots.forEach((d, i) => {
      d.classList.toggle("is-active", i + 1 === n);
      d.classList.toggle("is-done", i + 1 < n);
    });
    bar.style.width = `${n * 25}%`;
    btnPrev.hidden = n === 1;
    btnNext.hidden = n === 4;
    btnSubmit.hidden = n !== 4;
    if (n === 4) buildSummary();
    const first = steps[n - 1].querySelector("input, select");
    if (first && window.innerWidth > 640) first.focus({ preventScroll: true });
  }

  function buildSummary() {
    const extras = $$('input[name="extras"]:checked', form).map(i => i.value);
    const eq = form.querySelector('input[name="equipment"]:checked')?.value || "";
    const date = new Date(val("date") + "T12:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const w = Number(val("weight")).toLocaleString("en-US");
    const esc = s => s.replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
    $("#quoteSummary").innerHTML =
      `<b>${esc(eq)}</b> · ${esc(val("origin"))} → ${esc(val("destination"))}<br>` +
      `Pickup ${date} · ${esc(val("frequency"))}<br>` +
      `${esc(val("commodity"))} · ${w} lb${val("pallets") ? ` · ${esc(val("pallets"))} pcs` : ""}${val("temp") ? ` · ${esc(val("temp"))}` : ""}` +
      `${extras.length ? `<br>Extras: ${esc(extras.join(", "))}` : ""}`;
  }

  btnNext.addEventListener("click", () => { if (validators[current]()) go(current + 1); });
  btnPrev.addEventListener("click", () => go(current - 1));
  // Selecting a trailer moves on automatically
  $$('input[name="equipment"]', form).forEach(r => r.addEventListener("change", () => {
    showErr("equipment", false);
    setTimeout(() => current === 1 && go(2), 220);
  }));
  // Enter key advances instead of submitting early
  form.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.tagName === "INPUT" && current < 4) {
      e.preventDefault(); btnNext.click();
    }
  });
  form.addEventListener("input", e => e.target.classList.remove("is-bad"));

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!validators[4]()) return;
    $("#quoteRef").textContent = "HFL-" + String(Math.floor(10000 + Math.random() * 89999));
    $("#quotePhone").textContent = val("phone");
    steps.forEach(s => s.classList.remove("is-active"));
    form.classList.add("is-done");
    $("#quoteDone").hidden = false;
    form.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  });

  $("#quoteAgain").addEventListener("click", () => {
    form.reset();
    dateInput.value = toISO(new Date(Date.now() + 86400000));
    $("#quoteDone").hidden = true;
    form.classList.remove("is-done");
    go(1);
  });

  /* ---------- Driver application ---------- */
  const apply = $("#applyForm");
  apply.addEventListener("input", e => e.target.classList.remove("is-bad"));
  apply.addEventListener("submit", e => {
    e.preventDefault();
    const f = apply.elements;
    const checks = {
      name: !!f.name.value.trim(),
      phone: f.phone.value.replace(/\D/g, "").length >= 10,
      zip: /^\d{5}$/.test(f.zip.value.trim()),
      experience: !!f.experience.value
    };
    Object.entries(checks).forEach(([k, ok]) => f[k].classList.toggle("is-bad", !ok));
    const ok = Object.values(checks).every(Boolean);
    $('[data-err="apply"]', apply).classList.toggle("is-on", !ok);
    if (!ok) return;
    $(".apply__ok", apply).hidden = false;
    apply.querySelector('button[type="submit"]').disabled = true;
    apply.querySelector('button[type="submit"]').textContent = "Application sent ✓";
  });
})();
