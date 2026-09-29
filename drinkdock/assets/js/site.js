/* DrinkDock site script. No framework, no build step. */
(function () {
  "use strict";

  // ---- Config -------------------------------------------------------------
  var LEAD_EMAIL = "drinkdockhq@gmail.com"; // demo requests are emailed here via FormSubmit
  var GOATCOUNTER = ""; // optional: your GoatCounter code, e.g. "drinkdock" for drinkdock.goatcounter.com

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function money(n, cents) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }); }

  // ---- Analytics (optional) and first-touch source --------------------------
  if (GOATCOUNTER) {
    var gc = document.createElement("script");
    gc.async = true; gc.src = "https://gc.zgo.at/count.js";
    gc.setAttribute("data-goatcounter", "https://" + GOATCOUNTER + ".goatcounter.com/count");
    document.head.appendChild(gc);
  }
  var params = new URLSearchParams(location.search);
  var src = params.get("src") || params.get("utm_source") || params.get("ref");
  var camp = params.get("utm_campaign") || params.get("c");
  if (src && !store("dd_src")) {
    store("dd_src", src + (camp ? " / " + camp : ""));
    store("dd_landing", location.pathname.split("/").pop() || "index.html");
    store("dd_first_seen", new Date().toISOString());
  }

  // ---- Headline variant (randomized once per visitor) ----------------------
  var variant = params.get("v");
  if (variant !== "a" && variant !== "b") variant = store("dd_variant");
  if (variant !== "a" && variant !== "b") variant = Math.random() < 0.5 ? "a" : "b";
  store("dd_variant", variant);
  $$("[data-variant-text]").forEach(function (el) { el.hidden = el.getAttribute("data-variant-text") !== variant; });

  // ---- Header -------------------------------------------------------------
  var header = $(".site-header");
  function onScroll() { if (header) header.classList.toggle("scrolled", window.scrollY > 4); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  var menuBtn = $(".menu-btn"), mnav = $("#mobile-nav");
  if (menuBtn && mnav) {
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      mnav.classList.toggle("open", !open);
      menuBtn.lastChild.textContent = open ? "Menu" : "Close";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mnav.classList.contains("open")) { mnav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.focus(); }
    });
  }

  // ---- Solutions dropdown -------------------------------------------------
  $$(".nav-drop").forEach(function (d) {
    var b = $(".nav-drop-btn", d);
    function set(open) { d.classList.toggle("open", open); b.setAttribute("aria-expanded", String(open)); }
    b.addEventListener("click", function (e) { e.stopPropagation(); set(!d.classList.contains("open")); });
    document.addEventListener("click", function (e) { if (!d.contains(e.target)) set(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && d.classList.contains("open")) { set(false); b.focus(); } });
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      var t; d.addEventListener("mouseenter", function () { clearTimeout(t); set(true); });
      d.addEventListener("mouseleave", function () { t = setTimeout(function () { set(false); }, 180); });
    }
  });

  // ---- Contact email everywhere --------------------------------------------
  $$(".contact-email").forEach(function (a) { a.href = "mailto:" + LEAD_EMAIL; a.textContent = LEAD_EMAIL; });

  // ---- Image slots: show a labeled placeholder until the file exists ---------
  $$(".media img").forEach(function (img) {
    function miss() { img.closest(".media").classList.add("missing"); }
    if (img.complete && img.naturalWidth === 0) miss();
    img.addEventListener("error", miss);
  });

  // Optional loop videos: remove if the file isn't there, so the still image shows.
  $$("video[data-optional]").forEach(function (v) {
    var srcEl = $("source", v);
    function drop() { v.remove(); }
    if (srcEl) srcEl.addEventListener("error", drop);
    v.addEventListener("error", drop);
    if (reduceMotion) { v.removeAttribute("autoplay"); v.pause && v.pause(); }
  });

  // ---- Can icon -----------------------------------------------------------
  function can(color) {
    return '<svg viewBox="0 0 22 40" aria-hidden="true"><rect x="5" y="0.5" width="12" height="3" rx="1.5" fill="#9aa4ae"/>' +
      '<rect x="1" y="3" width="20" height="36" rx="4" fill="' + color + '"/>' +
      '<rect x="1" y="9" width="20" height="2" fill="rgba(255,255,255,.35)"/><rect x="1" y="30" width="20" height="2" fill="rgba(0,0,0,.18)"/></svg>';
  }

  // ---- Kiosk screen demo --------------------------------------------------
  var DRINKS = [
    { id: 1, name: "House Lager", size: "12 oz", price: 7, color: "#D9A441", door: 1 },
    { id: 2, name: "Pilsner", size: "16 oz", price: 8, color: "#B9C6CF", door: 2 },
    { id: 3, name: "Hazy IPA", size: "16 oz", price: 9, color: "#3E8E6A", door: 3 },
    { id: 4, name: "Lime Seltzer", size: "12 oz", price: 8, color: "#9CC84B", door: 4 },
    { id: 5, name: "Vodka Soda", size: "12 oz", price: 9, color: "#7FB7E6", door: 5 },
    { id: 6, name: "Sparkling Water", size: "12 oz", price: 3, color: "#E8EDF1", door: 6, na: true }
  ];

  $$("[data-kiosk-demo]").forEach(function (dev) {
    var screen = $(".screen", dev), timerEl = $("[data-timer]", dev);
    var steps = $$(".demo-steps i", dev.parentNode);
    var sel = [], t0 = null, tick = null, timers = [];

    function later(fn, ms) { timers.push(setTimeout(fn, reduceMotion ? Math.min(ms, 300) : ms)); }
    function clearLater() { timers.forEach(clearTimeout); timers = []; }
    function elapsed() { return t0 ? Math.round((Date.now() - t0) / 1000) : 0; }
    function fmt(s) { return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
    function startClock() { if (t0) return; t0 = Date.now(); tick = setInterval(function () { timerEl.textContent = fmt(elapsed()); }, 250); }
    function stopClock() { clearInterval(tick); timerEl.textContent = fmt(elapsed()); }
    function total() { return sel.reduce(function (s, d) { return s + d.price; }, 0); }
    function needsId() { return sel.some(function (d) { return !d.na; }); }
    function setStep(n) { steps.forEach(function (s, i) { s.classList.toggle("on", i <= n); }); }

    function show(html, step) {
      var old = $(".scr.on", screen);
      var el = document.createElement("div");
      el.className = "scr"; el.innerHTML = html;
      screen.appendChild(el);
      requestAnimationFrame(function () { el.classList.add("on"); if (old) { old.classList.remove("on"); setTimeout(function () { old.remove(); }, 250); } });
      setStep(step);
      return el;
    }

    function menu() {
      var el = show('<div class="scr-head"><b>Tap a drink</b><span>Up to 2 per scan</span></div><div class="drinks"></div>' +
        '<div class="scr-foot"><button class="scr-btn" type="button" disabled>Choose a drink</button><p class="scr-hint">You&rsquo;ll scan your ID after you choose.</p></div>', 0);
      var grid = $(".drinks", el), btn = $(".scr-btn", el), hint = $(".scr-hint", el);
      DRINKS.forEach(function (d) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "drink"; b.setAttribute("aria-pressed", "false");
        b.innerHTML = can(d.color) + '<span><span class="dn">' + d.name + '</span><br><span class="dp">' + d.size + ", " + money(d.price) + "</span>" + (d.na ? '<br><span class="na">No ID needed</span>' : "") + "</span>";
        b.addEventListener("click", function () {
          startClock();
          var i = sel.indexOf(d);
          if (i >= 0) sel.splice(i, 1);
          else if (sel.length === 2) { hint.textContent = "Two drinks per scan. Tap one to swap it out."; hint.style.color = "var(--amber)"; return; }
          else sel.push(d);
          $$(".drink", grid).forEach(function (x, j) { x.setAttribute("aria-pressed", String(sel.indexOf(DRINKS[j]) >= 0)); });
          btn.disabled = !sel.length;
          btn.textContent = sel.length ? "Continue, " + money(total(), true) : "Choose a drink";
        });
        grid.appendChild(b);
      });
      btn.addEventListener("click", function () { needsId() ? scan() : pay(); });
    }

    function scan() {
      var el = show('<div class="scr-center"><h3>Scan your ID</h3><p>Hold the barcode on the back of your license under the light.</p>' +
        '<div class="scan-well"><div class="scan-card"><span class="ph"></span><span class="ln"><i></i><i style="width:70%"></i><i style="width:85%"></i><i style="width:50%"></i></span></div><span class="scan-beam"></span></div></div>' +
        '<div class="scr-foot"><button class="scr-btn" type="button">Simulate a scan</button><button class="scr-btn ghost" type="button">Back</button></div>', 1);
      var btns = $$(".scr-btn", el);
      btns[1].addEventListener("click", function () { clearLater(); menu(); });
      btns[0].addEventListener("click", function () {
        btns[0].disabled = true; btns[0].textContent = "Checking ID";
        $(".scan-well", el).classList.add("scanning");
        later(function () {
          $(".scr-center", el).innerHTML = '<span class="check"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
            '<h3>ID verified</h3><p>21 or older. ' + sel.filter(function (d) { return !d.na; }).length + " of 2 drinks on this scan.</p>";
          later(pay, 1000);
        }, 1300);
      });
    }

    function pay() {
      var names = sel.map(function (d) { return d.name; }).join(" + ");
      var el = show('<div class="scr-center"><p>' + names + '</p><div class="total">' + money(total(), true) + '</div>' +
        '<div class="tap-zone"><svg viewBox="0 0 48 48" fill="none" stroke-width="3" stroke-linecap="round"><path d="M17 14c3 3 3 17 0 20M24 9c5 5 5 25 0 30M31 4c7 7 7 33 0 40"/></svg></div>' +
        '<p>Tap your card or phone</p></div>' +
        '<div class="scr-foot"><button class="scr-btn" type="button">Simulate a tap</button><button class="scr-btn ghost" type="button">Cancel</button></div>', 2);
      var btns = $$(".scr-btn", el);
      btns[1].addEventListener("click", function () { clearLater(); menu(); });
      btns[0].addEventListener("click", function () {
        btns[0].disabled = true; btns[0].textContent = "Processing";
        el.classList.add("tapping");
        later(dispense, 1100);
      });
    }

    function dispense() {
      var el = show('<div class="scr-center"><p>Payment approved</p><h3>Dispensing</h3>' +
        '<div class="door">' + sel.map(function (d, i) { return can(d.color).replace("<svg", '<svg class="can" style="left:' + (sel.length > 1 ? (i ? 64 : 36) : 50) + '%"'); }).join("") + '</div><p>Take your ' + sel.map(function (d) { return d.name; }).join(" and ") + ' from the pickup port below.</p></div>', 3);
      requestAnimationFrame(function () { $(".door", el).classList.add("open"); });
      later(done, 1900);
    }

    function done() {
      stopClock();
      var s = elapsed();
      var el = show('<div class="scr-center"><span class="check"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
        '<h3>Enjoy your night</h3><p>Served in <span class="timer">' + fmt(s) + '</span>, no line.</p></div>' +
        '<div class="scr-foot"><button class="scr-btn" type="button">Start over</button></div>', 4);
      $(".scr-btn", el).addEventListener("click", reset);
    }

    function reset() { clearLater(); clearInterval(tick); t0 = null; sel = []; timerEl.textContent = "0:00"; menu(); }
    reset();
  });

  // ---- Tab calculator -----------------------------------------------------
  $$("[data-calc]").forEach(function (root) {
    var inputs = {}; $$("input[type=range]", root).forEach(function (i) { inputs[i.name] = i; });
    function paint(i) { var p = (i.value - i.min) / (i.max - i.min) * 100; i.style.setProperty("--p", p + "%"); }
    function set(k, v) { $$('[data-out="' + k + '"], [data-r="' + k + '"]', root).forEach(function (e) { e.textContent = v; }); }
    function calc() {
      var n = +inputs.nights.value, w = +inputs.walk.value, pr = +inputs.price.value, sh = +inputs.share.value / 100, c = +inputs.cans.value;
      var kept = Math.round(w * sh), night = kept * pr, year = night * n * 52, month = year / 12, mins = Math.round(c * 0.5 * 40 / 60);
      set("nights", String(n)); set("walk", String(w)); set("price", money(pr, true)); set("share", Math.round(sh * 100) + "%"); set("cans", String(c));
      $('[data-r="nights"]', root).textContent = (n * 52 / 12).toFixed(1);
      set("kept", String(kept)); set("night", money(night, true)); set("month", money(Math.round(month))); set("year", money(Math.round(year)));
      set("cogs", "-" + money(Math.round(month * 0.3))); set("gp", money(Math.round(month * 0.7)));
      var cap = $('[data-r="cap"]', root), perNight = kept + Math.round(c * 0.5);
      if (cap) { cap.hidden = perNight <= 190; cap.textContent = perNight > 190 ? "At " + perNight + " machine sales a night you would need a mid-shift restock or a Duo. A DrinkDock One holds up to 190 cans." : ""; }
      set("time", mins >= 60 ? (mins / 60).toFixed(1) + " hr" : mins + " min");
      Object.keys(inputs).forEach(function (k) { paint(inputs[k]); });
    }
    Object.keys(inputs).forEach(function (k) { inputs[k].addEventListener("input", calc); });
    calc();
  });

  // ---- Operator software demo ---------------------------------------------
  $$("[data-app-demo]").forEach(function (app) {
    var KIOSKS = {
      main: { name: "Main bar", sales: 1184, drinks: 148, secs: 17, declined: 6, hours: [2, 5, 9, 14, 21, 30, 26, 18], stock: [["House Lager", 6, 8], ["Lime Seltzer", 2, 8], ["Hazy IPA", 5, 8], ["Vodka Soda", 4, 8], ["Pilsner", 7, 8], ["Sparkling Water", 8, 8]] },
      roof: { name: "Rooftop", sales: 736, drinks: 91, secs: 19, declined: 2, hours: [6, 9, 13, 16, 15, 12, 8, 5], stock: [["House Lager", 5, 7], ["Lime Seltzer", 6, 7], ["Hazy IPA", 1, 7], ["Vodka Soda", 4, 7], ["Pilsner", 3, 7], ["Sparkling Water", 7, 7]] }
    };
    var LABELS = ["6p", "7p", "8p", "9p", "10p", "11p", "12a", "1a"];
    var select = $("select", app), cur = "main", paused = false, feedTimer = null;
    var t = new Date(); t.setHours(23, 42, 0, 0);

    function render() {
      var k = KIOSKS[cur], max = Math.max.apply(null, k.hours);
      $("[data-k=sales]", app).textContent = money(k.sales);
      $("[data-k=drinks]", app).textContent = k.drinks;
      $("[data-k=secs]", app).textContent = k.secs + "s";
      $("[data-k=declined]", app).textContent = k.declined;
      $("[data-k=bars]", app).innerHTML = k.hours.map(function (h) { return '<div class="' + (h === max ? "hi" : "") + '" style="height:' + Math.round(h / max * 100) + '%" title="' + h + ' drinks"></div>'; }).join("");
      $("[data-k=barlabels]", app).innerHTML = LABELS.map(function (l) { return "<span>" + l + "</span>"; }).join("");
      $("[data-k=inv]", app).innerHTML = k.stock.map(function (s) {
        var low = s[1] <= 2;
        return '<li class="' + (low ? "low" : "") + '"><span>' + s[0] + '</span><span class="qty num">' + (s[1] === 0 ? "Sold out, restock" : s[1] + " of " + s[2] + (low ? ", restock" : "")) + '</span><span class="lvl"><i style="width:' + Math.round(s[1] / s[2] * 100) + '%"></i></span></li>';
      }).join("");
      var low = k.stock.filter(function (s) { return s[1] <= 2; });
      $("[data-k=alert]", app).textContent = low.length ? low[0][0] + " is down to " + low[0][1] + ". Text sent to your barback at " + (cur === "main" ? "11:38 PM" : "11:21 PM") + "." : "All lanes stocked.";
    }
    function addFeed(text, amt) {
      var ul = $("[data-k=feed]", app);
      var li = document.createElement("li");
      t = new Date(t.getTime() + 1000 * (20 + Math.floor(Math.random() * 50)));
      var hh = t.getHours() % 12 || 12, mm = String(t.getMinutes()).padStart(2, "0");
      li.innerHTML = "<span><b>" + hh + ":" + mm + "</b> " + text + "</span><span class=\"num\">" + amt + "</span>";
      ul.insertBefore(li, ul.firstChild);
      while (ul.children.length > 6) ul.removeChild(ul.lastChild);
    }
    function randomSale(force) {
      if (KIOSKS[cur].paused && !force) return;
      var k = KIOSKS[cur];
      if (Math.random() < 0.12) { k.declined++; addFeed("ID declined, expired", "n/a"); render(); return; }
      var avail = DRINKS.slice(0, 5).filter(function (dd) { var ln = k.stock.filter(function (s) { return s[0] === dd.name; })[0]; return !ln || ln[1] > 0; });
      if (!avail.length) return;
      var d = avail[Math.floor(Math.random() * avail.length)];
      k.sales += d.price; k.drinks += 1;
      var lane = k.stock.filter(function (s) { return s[0] === d.name; })[0];
      if (lane) { lane[1] -= 1; if (lane[1] <= 0) { lane[1] = 0; } }
      if (!force && lane && lane[1] === 0) { setTimeout(function () { lane[1] = lane[2]; addFeed(d.name + " restocked by barback", ""); render(); }, 7000); }
      addFeed(d.name + ", approved", money(d.price, true));
      render();
    }
    var pauseBtn = $(".pause-btn", app), dot = $(".status-dot", app);
    function paintPause() {
      var p = !!KIOSKS[cur].paused;
      pauseBtn.setAttribute("aria-pressed", String(p));
      pauseBtn.textContent = p ? "Resume sales" : "Pause machine now";
      dot.classList.toggle("paused", p);
      $("span", dot).textContent = p ? "Paused by staff" : "Selling";
    }
    select.addEventListener("change", function () {
      cur = select.value; $("[data-k=feed]", app).innerHTML = "";
      for (var i = 0; i < 5; i++) randomSale(true);
      if (KIOSKS[cur].paused) addFeed("Machine paused from bar tablet", "");
      paintPause(); render();
    });
    pauseBtn.addEventListener("click", function () {
      KIOSKS[cur].paused = !KIOSKS[cur].paused;
      paintPause();
      addFeed(KIOSKS[cur].paused ? "Machine paused from bar tablet" : "Sales resumed", "");
    });
    $$(".toggle", app).forEach(function (tg) {
      tg.addEventListener("click", function () { tg.setAttribute("aria-checked", String(tg.getAttribute("aria-checked") !== "true")); });
    });
    for (var i = 0; i < 5; i++) randomSale(true);
    render();
    if (!reduceMotion) feedTimer = setInterval(randomSale, 3500);
  });

  // ---- Demo request form ----------------------------------------------------
  var form = $("#demo-form");
  if (form) {
    $("[name=_source]", form).value = store("dd_src") || "direct";
    $("[name=_landing]", form).value = store("dd_landing") || "";
    $("[name=_variant]", form).value = store("dd_variant") || "";
    $("[name=_referrer]", form).value = document.referrer || "";
    var TYPES = { bar: "Bar or pub", hotel: "Hotel", venue: "Stadium or arena", event: "Event or catering" };
    var PLANS = { lease: "Lease", purchase: "Purchase", event: "Event rental" };
    var pre = TYPES[params.get("type")];
    if (pre) { var r = $('input[name=venue_type][value="' + pre + '"]', form); if (r) r.checked = true; }
    var TOPICS = { pricing: "Request pricing", event: "Event rental date", demo: "Book a demo" };
    var topicKey = params.get("topic") || (params.get("type") === "event" ? "event" : "demo");
    if (TOPICS[topicKey]) {
      var rt = $('input[name=topic][value="' + TOPICS[topicKey] + '"]', form); if (rt) rt.checked = true;
      $$("[data-topic-h]").forEach(function (h) { h.hidden = h.getAttribute("data-topic-h") !== topicKey; });
    }
    var prePlan = PLANS[params.get("plan")] || (params.get("type") === "event" ? "Event rental" : "");
    if (prePlan) { var rp = $('input[name=plan][value="' + prePlan + '"]', form); if (rp) rp.checked = true; }
    var err = $(".form-error", form), btn = $("button[type=submit]", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err.classList.remove("show");
      var bad = [];
      $$("[required]", form).forEach(function (f) {
        var box = f.type === "radio" ? f.closest("fieldset") : f.parentNode;
        var ok = f.type === "radio" ? !!$('input[name="' + f.name + '"]:checked', form) : f.checkValidity();
        if (f.type === "radio") { if ($(".field-msg", box) && ok) $(".field-msg", box).remove(); }
        f.setAttribute("aria-invalid", String(!ok));
        var msg = $(".field-msg", box);
        if (!ok) {
          if (!msg) { msg = document.createElement("p"); msg.className = "field-msg"; box.appendChild(msg); }
          msg.textContent = f.type === "email" && f.value ? "Enter an email address like name@venue.com." : f.type === "radio" ? "Choose the closest match." : f.tagName === "SELECT" ? "Choose one." : "Required.";
          if (bad.indexOf(box) < 0) bad.push(box);
        } else if (msg && f.type !== "radio") msg.remove();
      });
      if (bad.length) { var first = $("[aria-invalid=true]", form); if (first) first.focus(); return; }
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = data[k] ? data[k] + ", " + v : v; });
      if (data._honey) return;
      data._subject = (data.topic || "Demo request") + ": " + (data.venue || "new venue");
      data._template = "table";
      data._captcha = "false";
      btn.disabled = true; btn.textContent = "Sending\u2026";
      fetch("https://formsubmit.co/ajax/" + LEAD_EMAIL, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data)
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res && (res.success === true || res.success === "true")) { location.href = "thanks.html"; }
        else throw new Error("not ok");
      }).catch(function () {
        btn.disabled = false; btn.textContent = "Send to DrinkDock";
        var body = Object.keys(data).filter(function (k) { return k[0] !== "_" || k === "_source"; }).map(function (k) { return k + ": " + data[k]; }).join("\n");
        $("a", err).href = "mailto:" + LEAD_EMAIL + "?subject=" + encodeURIComponent(data._subject) + "&body=" + encodeURIComponent(body);
        err.classList.add("show");
      });
    });
  }
})();
