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

  // ---- Event counts (only when GoatCounter is configured) -------------------
  function track(name) {
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "event/" + name, title: name, event: true }); } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-track]");
    if (a) track(a.getAttribute("data-track"));
  });

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
    { id: 1, name: "House Lager", size: "12 oz", price: 7, color: "#D9A441", row: "A1" },
    { id: 2, name: "Pilsner", size: "16 oz", price: 8, color: "#B9C6CF", row: "A3" },
    { id: 3, name: "Hazy IPA", size: "16 oz", price: 9, color: "#3E8E6A", row: "B2" },
    { id: 4, name: "Lime Seltzer", size: "12 oz", price: 8, color: "#9CC84B", row: "C2" },
    { id: 5, name: "Vodka Soda", size: "12 oz", price: 9, color: "#7FB7E6", row: "C4" },
    { id: 6, name: "Sparkling Water", size: "12 oz", price: 3, color: "#E8EDF1", row: "E1", na: true }
  ];
  var SCENARIOS = [
    { k: "normal", label: "Normal sale", note: "A guest buys two drinks with nothing going wrong." },
    { k: "idfail", label: "ID won't read", note: "The first scan fails, the way a worn or bent license might." },
    { k: "declined", label: "Card declined", note: "The first card is declined. Nothing is charged." },
    { k: "soldout", label: "Sold out", note: "Lime Seltzer is sold out. Every other drink keeps selling." },
    { k: "jam", label: "Can doesn't arrive", note: "A row jams mid-sale. The machine tries another row with the same drink." }
  ];
  var MAX_ITEMS = 2;
  var ICON_CHECK = '<span class="check"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>';
  var ICON_WARN = '<span class="check warn"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v6M12 17h.01"/></svg></span>';

  $$("[data-kiosk-host]").forEach(function (host) {
    host.innerHTML = '<div class="device" data-kiosk-demo><div class="device-top"><span>DrinkDock</span><span class="cam" aria-hidden="true"></span>' +
      '<button class="help-btn" type="button">Help</button></div><div class="screen" aria-live="polite"></div></div>' +
      '<div class="demo-steps" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
      '<div class="scenarios"><p class="sc-label">Try a problem</p><div class="sc-chips" role="group" aria-label="Demo scenario"></div><p class="sc-note"></p></div>' +
      '<p class="demo-caption">Interactive demo of the guest screen. It doesn&rsquo;t read IDs, use a camera or take payments.</p>';
  });

  $$("[data-kiosk-demo]").forEach(function (dev) {
    var wrap = dev.parentNode, screen = $(".screen", dev);
    var steps = $$(".demo-steps i", wrap);
    var chips = $(".sc-chips", wrap), note = $(".sc-note", wrap);
    var cart = {}, scenario = "normal", tries = {}, timers = [], current = null;

    function later(fn, ms) { timers.push(setTimeout(fn, reduceMotion ? Math.min(ms, 300) : ms)); }
    function clearLater() { timers.forEach(clearTimeout); timers = []; }
    function items() { return DRINKS.filter(function (d) { return cart[d.id]; }).map(function (d) { return { d: d, q: cart[d.id] }; }); }
    function count() { return items().reduce(function (s, x) { return s + x.q; }, 0); }
    function total() { return items().reduce(function (s, x) { return s + x.q * x.d.price; }, 0); }
    function alcohol() { return items().filter(function (x) { return !x.d.na; }).reduce(function (s, x) { return s + x.q; }, 0); }
    function names(sep) { return items().map(function (x) { return x.q > 1 ? x.q + " " + x.d.name + "s" : x.d.name; }).join(sep || " + "); }
    function setStep(n) { steps.forEach(function (s, i) { s.classList.toggle("on", i <= n); }); }
    function soldOut(d) { return scenario === "soldout" && d.id === 4; }

    function show(html, step, name) {
      var old = $(".scr.on", screen);
      var el = document.createElement("div");
      el.className = "scr"; el.innerHTML = html;
      screen.appendChild(el);
      requestAnimationFrame(function () { el.classList.add("on"); if (old) { old.classList.remove("on"); setTimeout(function () { old.remove(); }, 250); } });
      setStep(step); current = name;
      return el;
    }

    function menu(notice) {
      var el = show('<div class="scr-head"><b>Tap a drink</b><span>Limit ' + MAX_ITEMS + ' with alcohol</span></div>' +
        (notice ? '<p class="scr-note">' + notice + '</p>' : '') + '<div class="drinks"></div>' +
        '<div class="scr-foot"><button class="scr-btn" type="button" data-go></button><p class="scr-hint"></p>' +
        '<button class="scr-link" type="button" data-idinfo>What happens to my ID?</button></div>', 0, "menu");
      var grid = $(".drinks", el), go = $("[data-go]", el), hint = $(".scr-hint", el);
      function paint(msg) {
        $$(".drink-wrap", grid).forEach(function (w, j) {
          var d = DRINKS[j], q = cart[d.id] || 0, b = $(".drink", w);
          b.setAttribute("aria-pressed", String(q > 0));
          $(".qty", w).textContent = q ? "×" + q : "";
          $(".minus", w).hidden = !q;
          b.setAttribute("aria-label", d.name + ", " + money(d.price) + (soldOut(d) ? ", sold out" : q ? ", " + q + " in order. Tap to add another." : ". Tap to add."));
        });
        var n = count();
        go.disabled = !n;
        go.textContent = n ? "Continue, " + money(total(), true) : "Choose a drink";
        hint.textContent = msg || (alcohol() >= MAX_ITEMS ? "That's two drinks with alcohol, the limit for one scan." : alcohol() || !n ? "You'll scan your ID after you choose." : "No ID needed for this order.");
        hint.classList.toggle("warn", !!msg);
      }
      DRINKS.forEach(function (d) {
        var w = document.createElement("div"); w.className = "drink-wrap";
        var out = soldOut(d);
        w.innerHTML = '<button type="button" class="drink"' + (out ? " disabled" : "") + '>' + can(d.color) +
          '<span><span class="dn">' + d.name + '</span><br><span class="dp">' + d.size + ", " + money(d.price) + "</span>" +
          (out ? '<br><span class="out">Sold out</span>' : d.na ? '<br><span class="na">No ID needed</span>' : "") + '</span><span class="qty"></span></button>' +
          '<button type="button" class="minus" aria-label="Remove one ' + d.name + '" hidden>−</button>';
        $(".drink", w).addEventListener("click", function () {
          if (!d.na && alcohol() >= MAX_ITEMS) { paint("Two drinks with alcohol per scan. Remove one to swap it."); return; }
          if (count() >= 4) { paint("Four drinks per order at most."); return; }
          cart[d.id] = (cart[d.id] || 0) + 1; paint();
        });
        $(".minus", w).addEventListener("click", function () { cart[d.id] -= 1; if (cart[d.id] <= 0) delete cart[d.id]; paint(); });
        grid.appendChild(w);
      });
      go.addEventListener("click", function () { alcohol() ? scan() : pay(); });
      $("[data-idinfo]", el).addEventListener("click", idInfo);
      paint();
    }

    function idInfo() {
      var el = show('<div class="scr-body"><h3>What happens to your ID</h3>' +
        '<p>You scan the back of your ID, then the front. The back&rsquo;s barcode shows your age and that the ID hasn&rsquo;t expired. The camera then checks that you match the photo on the front, on the machine itself.</p>' +
        '<p>The machine keeps the result, the time, the ID&rsquo;s expiration date, and a one-way code made from your ID number so the two-drink limit works. The code is deleted when the venue closes. No photos or images are stored, and nothing is sold or shared.</p></div>' +
        '<div class="scr-foot"><button class="scr-btn" type="button">Back to the menu</button></div>', 0, "idinfo");
      $(".scr-btn", el).addEventListener("click", function () { menu(); });
    }

    function scan() {
      var el = show('<div class="scr-center"><h3>Scan your ID</h3><p>Hold the back of your license under the light. You&rsquo;ll flip it next.</p>' +
        '<div class="scan-well"><div class="scan-card"><span class="ph"></span><span class="ln"><i></i><i style="width:70%"></i><i style="width:85%"></i><i style="width:50%"></i></span></div><span class="scan-beam"></span></div></div>' +
        '<div class="scr-foot"><button class="scr-btn" type="button">Simulate a scan</button><button class="scr-btn ghost" type="button">Back to the menu</button></div>', 1, "scan");
      var btns = $$(".scr-btn", el);
      btns[1].addEventListener("click", function () { clearLater(); menu(); });
      btns[0].addEventListener("click", function () {
        btns[0].disabled = true; btns[0].textContent = "Reading ID";
        $(".scan-well", el).classList.add("scanning");
        later(function () {
          tries.id = (tries.id || 0) + 1;
          if (scenario === "idfail" && tries.id === 1) return idFail();
          $(".scr-foot", el).style.visibility = "hidden";
          $(".scr-center", el).innerHTML = '<h3>Now the front</h3><p>Flip your ID and hold the photo side under the light.</p><div class="scan-well scanning"><div class="scan-card front"><span class="ph"></span><span class="ln"><i></i><i style="width:70%"></i><i style="width:85%"></i></span></div><span class="scan-beam"></span></div>';
          later(function () {
            $(".scr-center", el).innerHTML = '<span class="cam-ring" aria-hidden="true"></span><h3>Look at the camera</h3><p>Checking you match the ID photo.</p>';
            later(function () {
              $(".scr-center", el).innerHTML = ICON_CHECK + '<h3>ID verified</h3><p>21 or older and matches the photo. ' + alcohol() + ' of ' + MAX_ITEMS + ' drinks with alcohol on this scan.</p>';
              later(pay, 1100);
            }, 1100);
          }, 1300);
        }, 1200);
      });
    }

    function idFail() {
      var el = show('<div class="scr-center">' + ICON_WARN + '<h3>We couldn&rsquo;t read that ID</h3><p>Flatten it and hold the back under the light. Your order is saved.</p></div>' +
        '<div class="scr-foot"><button class="scr-btn" type="button">Try again</button><button class="scr-btn ghost" type="button">Get help from staff</button></div>', 1, "idfail");
      var b = $$(".scr-btn", el);
      b[0].addEventListener("click", scan);
      b[1].addEventListener("click", help);
    }

    function pay() {
      var el = show('<div class="scr-center"><p>' + names() + '</p><div class="total">' + money(total(), true) + '</div>' +
        '<div class="tap-zone"><svg viewBox="0 0 48 48" fill="none" stroke-width="3" stroke-linecap="round"><path d="M17 14c3 3 3 17 0 20M24 9c5 5 5 25 0 30M31 4c7 7 7 33 0 40"/></svg></div>' +
        '<p>Tap your card or phone. You&rsquo;re charged when your drinks reach the port.</p></div>' +
        '<div class="scr-foot"><button class="scr-btn" type="button">Simulate a tap</button><button class="scr-btn ghost" type="button">Cancel order</button></div>', 2, "pay");
      var btns = $$(".scr-btn", el);
      btns[1].addEventListener("click", function () { clearLater(); cart = {}; menu("Order cancelled. Nothing was charged."); });
      btns[0].addEventListener("click", function () {
        btns[0].disabled = true; btns[0].textContent = "Processing";
        el.classList.add("tapping");
        later(function () {
          tries.pay = (tries.pay || 0) + 1;
          if (scenario === "declined" && tries.pay === 1) return declined();
          dispense();
        }, 1100);
      });
    }

    function declined() {
      var el = show('<div class="scr-center">' + ICON_WARN + '<h3>Card declined</h3><p>Nothing was charged. Try another card or phone.</p></div>' +
        '<div class="scr-foot"><button class="scr-btn" type="button">Try another card</button><button class="scr-btn ghost" type="button">Cancel order</button></div>', 2, "declined");
      var b = $$(".scr-btn", el);
      b[0].addEventListener("click", pay);
      b[1].addEventListener("click", function () { cart = {}; menu("Order cancelled. Nothing was charged."); });
    }

    function cansHtml() {
      var list = []; items().forEach(function (x) { for (var i = 0; i < x.q; i++) list.push(x.d); });
      return list.map(function (d, i) { return can(d.color).replace("<svg", '<svg class="can" style="left:' + (list.length > 1 ? (i ? 64 : 36) : 50) + '%"'); }).join("");
    }

    function dispense() {
      var jam = scenario === "jam" && !tries.jam;
      var el = show('<div class="scr-center"><p>Payment authorized</p><h3>Dispensing</h3>' +
        '<div class="door">' + cansHtml() + '</div><p class="disp-msg">Your drinks are on the way down to the pickup port.</p></div>', 3, "dispense");
      var door = $(".door", el);
      if (jam) {
        tries.jam = 1;
        later(function () {
          $(".disp-msg", el).innerHTML = '<b class="amber">Row ' + items()[0].d.row + ' jammed.</b> That can didn&rsquo;t reach the port, so it isn&rsquo;t charged. Trying row D' + items()[0].d.row.slice(1) + ', which has the same drink.';
          later(function () { door.classList.add("open"); later(done, 1900); }, 1800);
        }, 1400);
      } else {
        requestAnimationFrame(function () { door.classList.add("open"); });
        later(done, 1900);
      }
    }

    function done() {
      var el = show('<div class="scr-center">' + ICON_CHECK + '<h3>Enjoy your night</h3><p>Take your ' + names(" and ") + ' from the port below. Charged ' + money(total(), true) + '.</p></div>' +
        '<div class="scr-foot"><button class="scr-btn" type="button">Start over</button></div>', 4, "done");
      $(".scr-btn", el).addEventListener("click", reset);
      track("demo-complete-" + scenario);
    }

    function help() {
      var back = current;
      var el = show('<div class="scr-center"><span class="beacon" aria-hidden="true"></span><h3>Help is on the way</h3><p>The light on top of the machine is flashing amber, and the bar tablet shows this machine. Your order is saved.</p></div>' +
        '<div class="scr-foot"><button class="scr-btn" type="button">Back to my order</button></div>', 0, "help");
      $(".scr-btn", el).addEventListener("click", function () { back === "pay" || back === "declined" ? pay() : back === "scan" || back === "idfail" ? scan() : menu(); });
    }
    $(".help-btn", dev).addEventListener("click", function () { if (current !== "help" && current !== "dispense") { clearLater(); help(); } });

    function reset() { clearLater(); cart = {}; tries = {}; menu(); }

    SCENARIOS.forEach(function (sc) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = sc.label; b.setAttribute("aria-pressed", String(sc.k === scenario));
      b.addEventListener("click", function () {
        scenario = sc.k; note.textContent = sc.note;
        $$("button", chips).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        reset();
      });
      chips.appendChild(b);
    });
    note.textContent = SCENARIOS[0].note;
    reset();
  });

  // ---- Revenue opportunity calculator --------------------------------------
  $$("[data-calc]").forEach(function (root) {
    var inputs = {}; $$("input[type=range]", root).forEach(function (i) { inputs[i.name] = i; });
    var costIn = $("input[name=cost]", root), costRows = $("[data-costrows]", root);
    var COGS = 0.30, FEES = 0.03, SECS = 40, CAP = 190;
    function paint(i) { var p = (i.value - i.min) / (i.max - i.min) * 100; i.style.setProperty("--p", p + "%"); }
    function set(k, v) { $$('[data-out="' + k + '"], [data-r="' + k + '"]', root).forEach(function (e) { e.textContent = v; }); }
    function calc() {
      var n = +inputs.nights.value, pr = +inputs.price.value, c = +inputs.cans.value, mv = +inputs.move.value / 100, w = +inputs.walk.value, sh = +inputs.share.value / 100;
      var nightsMo = n * 52 / 12;
      var moved = Math.round(c * mv), kept = Math.round(w * sh), mdrinks = moved + kept;
      var month = kept * pr * nightsMo, cogs = month * COGS, fees = month * FEES, contrib = month - cogs - fees;
      set("nights", String(n)); set("price", money(pr, true)); set("cans", String(c)); set("move", Math.round(mv * 100) + "%");
      set("walk", String(w)); set("share", Math.round(sh * 100) + "%");
      $('[data-r="nights"]', root).textContent = Math.abs(nightsMo - Math.round(nightsMo)) < 0.05 ? String(Math.round(nightsMo)) : nightsMo.toFixed(1);
      set("moved", String(moved)); set("kept", String(kept)); set("mdrinks", String(mdrinks)); set("msales", money(mdrinks * pr, true)); set("mmonth", money(Math.round(mdrinks * pr * nightsMo)));
      set("month", money(Math.round(month))); set("cogs", "-" + money(Math.round(cogs))); set("fees", "-" + money(Math.round(fees))); set("contrib", money(Math.round(contrib)));
      var cost = costIn && costIn.value !== "" ? Math.max(0, +costIn.value) : null;
      if (costRows) costRows.hidden = cost === null;
      if (cost !== null) {
        var net = contrib - cost, perDrink = pr * (1 - COGS - FEES) * nightsMo;
        set("cost", "-" + money(Math.round(cost)));
        set("net", (net < 0 ? "-" : "") + money(Math.abs(Math.round(net))));
        var be = perDrink > 0 ? Math.ceil(cost / perDrink) : 0;
        set("be", be.toLocaleString("en-US") + " new drink" + (be === 1 ? "" : "s"));
      }
      var mins = Math.round(moved * SECS / 60);
      set("restock", Math.max(1, Math.round(mdrinks * 6 / 60)) + " min");
      set("time", mins >= 60 ? (mins / 60).toFixed(1) + " hr" : mins + " min");
      var capEl = $('[data-r="cap"]', root);
      var beN = cost !== null && pr > 0 ? Math.ceil(cost / (pr * (1 - COGS - FEES) * nightsMo)) : 0;
      if (capEl && cost !== null && moved + beN > CAP) { capEl.hidden = false; capEl.textContent = "Break-even needs more drinks a night than one DrinkDock One holds (190 cans) once moved orders are counted. Check the cost you entered, or plan for a mid-shift restock."; } else
      if (capEl) { capEl.hidden = mdrinks <= CAP; capEl.textContent = mdrinks > CAP ? "At " + mdrinks + " machine sales a night you would need a mid-shift restock or a Duo. A DrinkDock One holds up to 190 cans. At its 20-second design target, one guest station tops out around 180 sales an hour, before gaps between guests." : ""; }
      Object.keys(inputs).forEach(function (k) { paint(inputs[k]); });
    }
    Object.keys(inputs).forEach(function (k) { inputs[k].addEventListener("input", calc); });
    if (costIn) costIn.addEventListener("input", calc);
    calc();
  });

  // ---- Manager demo (deterministic sample night) ---------------------------
  $$("[data-app-demo]").forEach(function (app) {
    var M = {
      main: { sales: 1184, drinks: 148, secs: 19, declined: 6, hours: [10, 16, 22, 31, 40, 29],
        stock: [["A1", "House Lager", 6, 8], ["A3", "Pilsner", 7, 8], ["B2", "Hazy IPA", 5, 8], ["C2", "Lime Seltzer", 2, 8], ["C4", "Vodka Soda", 4, 8], ["E1", "Sparkling Water", 8, 8]],
        feed: [
          { t: "11:40 PM", sale: true, text: "2 Hazy IPAs", amt: 18, id: "7C1E", target: true },
          { t: "11:39 PM", sale: true, text: "Lime Seltzer", amt: 8, id: "A90B" },
          { t: "11:38 PM", text: "ID declined: expired" },
          { t: "11:36 PM", sale: true, text: "House Lager + Sparkling Water", amt: 10, id: "3D55" },
          { t: "11:34 PM", text: "Help pressed at the machine: ID wouldn't read. Alex helped at the bar.", staff: true },
          { t: "11:33 PM", text: "Lime Seltzer low (2 left). Text sent to Sam." }
        ], lowAt: "11:33 PM" },
      lobby: { sales: 512, drinks: 64, secs: 21, declined: 1, hours: [6, 9, 12, 15, 13, 9],
        stock: [["A1", "House Lager", 5, 6], ["A2", "Lime Seltzer", 4, 6], ["B1", "Pilsner", 3, 6], ["B2", "Ros\u00e9 Spritz", 4, 6], ["C1", "Sparkling Water", 6, 6]],
        feed: [
          { t: "11:37 PM", sale: true, text: "Ros\u00e9 Spritz", amt: 9, id: "B2F0" },
          { t: "11:31 PM", sale: true, text: "2 Pilsners", amt: 16, id: "91AC" },
          { t: "11:22 PM", sale: true, text: "Lime Seltzer", amt: 8, id: "44D7" }
        ], lowAt: "" }
    };
    var LABELS = ["6p", "7p", "8p", "9p", "10p", "11p"];
    var cur = "main", minute = 41, open = null;
    var select = $("#kiosk-select", app), pauseBtn = $(".pause-btn", app), dot = $(".status-dot", app);
    var texts = $("[data-k=texts]", app), last = $("[data-k=last]", app);
    var tasks = $("[data-app-tasks]");
    function k(n) { return $("[data-k=" + n + "]", app); }
    function now() { var t = 23 * 60 + minute++, h = Math.floor(t / 60) % 24, mm = t % 60; return (h % 12 || 12) + ":" + String(mm).padStart(2, "0") + (h >= 12 ? " PM" : " AM"); }
    function done(task) { if (tasks) { var li = $('[data-task="' + task + '"]', tasks); if (li && !li.classList.contains("done")) { li.classList.add("done"); track("manager-" + task); } } }
    function log(text) { M[cur].feed.unshift({ t: now(), text: text, staff: true }); }

    function render() {
      var m = M[cur], max = Math.max.apply(null, m.hours);
      k("sales").textContent = money(m.sales);
      k("drinks").textContent = m.drinks;
      k("secs").textContent = m.secs + "s";
      k("declined").textContent = m.declined;
      k("bars").innerHTML = m.hours.map(function (h, i) { return '<div class="' + (i === m.hours.length - 1 ? "now" : h === max ? "hi" : "") + '" style="height:' + Math.round(h / max * 100) + '%" title="' + h + ' drinks"></div>'; }).join("");
      k("barlabels").innerHTML = LABELS.map(function (l, i) { return "<span>" + (i === LABELS.length - 1 ? "11p so far" : l) + "</span>"; }).join("");
      k("inv").innerHTML = m.stock.map(function (s, i) {
        var low = s[2] <= 2;
        return '<li class="' + (low ? "low" : "") + '"><span><span class="row-id">' + s[0] + '</span> ' + s[1] + '</span><span class="qty num">' + s[2] + " of " + s[3] + '</span>' +
          (low ? '<button type="button" class="mini-btn" data-restock="' + i + '">Mark restocked</button>' : "") +
          '<span class="lvl"><i style="width:' + Math.round(s[2] / s[3] * 100) + '%"></i></span></li>';
      }).join("");
      var lows = m.stock.filter(function (s) { return s[2] <= 2; });
      k("alert").textContent = lows.length ? lows[0][1] + " is down to " + lows[0][2] + ". " + (texts.getAttribute("aria-checked") === "true" ? "Text sent to Sam at " + m.lowAt + "." : "Low-stock texts are off.") : "All rows are above their restock threshold.";
      k("feed").innerHTML = m.feed.slice(0, 7).map(function (f, i) {
        var body = '<span><b>' + f.t + '</b> ' + f.text + (f.blocked ? ' <em class="tag">ID blocked</em>' : "") + '</span><span class="num">' + (f.amt ? money(f.amt, true) : "") + '</span>';
        if (!f.sale) return '<li class="' + (f.staff ? "staff" : "") + '">' + body + "</li>";
        var detail = open === f ? '<div class="sale-detail"><p>ID check: valid, 21 or older, matched to the photo. Limit code ' + f.id + ' (one-way, deleted at close).</p>' +
          (f.blocked ? '<p class="ok">This ID can&rsquo;t buy from any machine here until close.</p>' :
            '<div class="btn-pair"><button type="button" class="mini-btn danger" data-block="' + i + '">Block this ID until close</button><button type="button" class="mini-btn" data-reset="' + i + '">Reset 20-minute wait</button></div>') + "</div>" : "";
        return '<li class="sale' + (open === f ? " open" : "") + '"><button type="button" class="sale-btn" data-sale="' + i + '" aria-expanded="' + (open === f) + '">' + body + "</button>" + detail + "</li>";
      }).join("");
      var p = !!m.paused;
      pauseBtn.setAttribute("aria-pressed", String(p));
      pauseBtn.textContent = p ? "Resume sales" : "Pause machine now";
      dot.classList.toggle("paused", p);
      $("span", dot).textContent = p ? "Paused by staff" : "Selling";
      k("guest").textContent = p ? "Sales paused. Please order at the bar." : "Tap a drink";
    }

    app.addEventListener("click", function (e) {
      var t = e.target.closest("button"); if (!t || !app.contains(t)) return;
      var m = M[cur];
      if (t.hasAttribute("data-sale")) { var f = m.feed[+t.getAttribute("data-sale")]; open = open === f ? null : f; render(); return; }
      if (t.hasAttribute("data-block")) {
        var fb = m.feed[+t.getAttribute("data-block")]; fb.blocked = true;
        log("ID from the " + fb.t + " sale blocked until close, by you");
        if (fb.target) done("block");
        render(); return;
      }
      if (t.hasAttribute("data-reset")) { var fr = m.feed[+t.getAttribute("data-reset")]; log("20-minute wait reset for the ID from the " + fr.t + " sale"); open = null; render(); return; }
      if (t.hasAttribute("data-restock")) {
        var s = m.stock[+t.getAttribute("data-restock")], added = s[3] - s[2]; s[2] = s[3];
        log("Row " + s[0] + " restocked with " + added + " " + s[1] + ", by you");
        if (s[1] === "Lime Seltzer" && cur === "main") done("restock");
        render(); return;
      }
    });
    pauseBtn.addEventListener("click", function () {
      var m = M[cur]; m.paused = !m.paused;
      log(m.paused ? "Machine paused from the bar tablet" : "Sales resumed");
      if (m.paused && cur === "main") done("pause");
      render();
    });
    texts.addEventListener("click", function () { texts.setAttribute("aria-checked", String(texts.getAttribute("aria-checked") !== "true")); render(); });
    last.addEventListener("change", function () { log("Last sale changed to " + last.value); render(); });
    select.addEventListener("change", function () { cur = select.value; open = null; render(); });
    render();
  });

  // ---- Print buttons ----
  $$("[data-print]").forEach(function (b) {
    b.addEventListener("click", function () {
      var src = b.closest(".tally"), root = document.createElement("div");
      root.className = "print-root"; root.appendChild(src.cloneNode(true));
      document.body.appendChild(root); document.body.classList.add("print-sheet");
      function clean() { document.body.classList.remove("print-sheet"); root.remove(); window.removeEventListener("afterprint", clean); }
      window.addEventListener("afterprint", clean);
      window.print();
      setTimeout(clean, 1000);
    });
  });
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = $(b.getAttribute("data-copy")); if (!t) return;
      var text = t.innerText.trim(), label = b.textContent;
      function done() { b.textContent = "Copied"; setTimeout(function () { b.textContent = label; }, 1600); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { selectText(t); });
      else selectText(t);
    });
  });
  function selectText(el) { var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }

  // ---- Lead forms (contact page and the short form on the home page) --------
  var TOPIC_ALIAS = { demo: "fit", fit: "fit", pricing: "pricing", event: "event", brand: "brand" };
  var TYPES = { bar: "Bar or pub", hotel: "Hotel", venue: "Stadium or arena", event: "Event or catering" };
  function applyTopic(key) {
    $$("[data-topic-show]").forEach(function (el) { el.hidden = el.getAttribute("data-topic-show").split(" ").indexOf(key) < 0; });
    $$("[data-req]").forEach(function (f) {
      var box = f.closest("[data-topic-show]");
      f.required = !box || !box.hidden;
      if (!f.required) { f.removeAttribute("aria-invalid"); var m = f.parentNode.querySelector(".field-msg"); if (m) m.remove(); }
    });
    $$("[data-label-" + key + "]").forEach(function (b) { b.textContent = b.getAttribute("data-label-" + key); });
  }
  $$("[data-lead-form]").forEach(function (form) {
    function setHidden(n, v) { var f = $("[name=" + n + "]", form); if (f) f.value = v; }
    setHidden("_source", store("dd_src") || "direct");
    setHidden("_landing", store("dd_landing") || "");
    setHidden("_page", location.pathname.split("/").pop() || "index.html");
    setHidden("venue_type", TYPES[params.get("type")] || "");
    var radios = $$("input[name=topic][type=radio]", form);
    if (radios.length) {
      var key = TOPIC_ALIAS[params.get("topic")] || (params.get("type") === "event" ? "event" : "fit");
      radios.forEach(function (r) {
        if (r.getAttribute("data-key") === key) r.checked = true;
        r.addEventListener("change", function () { if (r.checked) applyTopic(r.getAttribute("data-key")); });
      });
      applyTopic(key);
    }
    var started = false;
    form.addEventListener("input", function () { if (!started) { started = true; track("form-start"); } });
    var err = $(".form-error", form), btn = $("button[type=submit]", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err.classList.remove("show");
      var bad = [];
      $$("[required]", form).forEach(function (f) {
        var box = f.parentNode, ok = f.checkValidity();
        f.setAttribute("aria-invalid", String(!ok));
        var msg = $(".field-msg", box);
        if (!ok) {
          if (!msg) { msg = document.createElement("p"); msg.className = "field-msg"; box.appendChild(msg); }
          msg.textContent = f.type === "email" && f.value ? "Enter an email address like name@venue.com." : f.tagName === "SELECT" ? "Choose one." : "Required.";
          bad.push(f);
        } else if (msg) msg.remove();
      });
      if (bad.length) { bad[0].focus(); return; }
      var data = {};
      new FormData(form).forEach(function (v, k) {
        var el = form.elements[k];
        if (el && el.closest && el.closest("[data-topic-show]") && el.closest("[data-topic-show]").hidden) return;
        if (v !== "") data[k] = data[k] ? data[k] + ", " + v : v;
      });
      if (data._honey) return;
      delete data._honey;
      data._subject = (data.topic || "Inquiry") + ": " + (data.venue || "new contact");
      data._template = "table";
      data._captcha = "false";
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = "Sending…";
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
      fetch("https://formsubmit.co/ajax/" + LEAD_EMAIL, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data), signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) { return r.json(); }).then(function (res) {
        clearTimeout(timer);
        if (res && (res.success === true || res.success === "true")) { track("form-sent"); location.href = "thanks.html"; }
        else throw new Error("not ok");
      }).catch(function () {
        clearTimeout(timer);
        btn.disabled = false; btn.textContent = label;
        var body = Object.keys(data).filter(function (k) { return k[0] !== "_" || k === "_source"; }).map(function (k) { return k + ": " + data[k]; }).join("\n");
        $("a", err).href = "mailto:" + LEAD_EMAIL + "?subject=" + encodeURIComponent(data._subject) + "&body=" + encodeURIComponent(body);
        err.classList.add("show");
        track("form-failed");
      });
    });
  });
})();
