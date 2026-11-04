/* Ancient Rome Review — routing and study modes.
   Quiz progress lives only until the page is closed. */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    learnI: 0,
    sheet: { i: 0, revealed: false },
    quiz: { round: null, i: 0, picks: {}, correct: 0, missed: [], phase: "ask" },
    map: {
      mode: "learn",
      selected: "rome",
      order: null,
      step: 0,
      locked: false,
      picked: null,
      score: 0,
      over: false,
      choices: null,
    },
    essayI: 0,
    listen: {
      i: 0,
      phase: "listen",
      qi: 0,
      picks: {},
      correct: 0,
      shown: false,
      choices: null,
      saved: [],
    },
  };

  let actions = { prev: null, next: null, primary: null };
  let lastPath = null;
  let toTop = false;
  let speaking = false;
  let speechGen = 0;

  function run(fn, top) {
    if (!fn) return;
    toTop = top || fn === actions.prev || fn === actions.next;
    try {
      fn();
    } finally {
      toTop = false;
    }
  }
  let swallowClick = false;

  function h(tag, attrs, kids) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((key) => {
        const value = attrs[key];
        if (key === "class") {
          node.className = value || "";
          return;
        }
        if (key === "disabled") {
          node.disabled = !!value;
          return;
        }
        if (key === "open") {
          node.open = !!value;
          return;
        }
        if (value == null || value === false) return;
        node.setAttribute(key, value === true ? "" : String(value));
      });
    }
    addKids(node, kids);
    return node;
  }

  function addKids(node, kids) {
    if (kids == null) return;
    const list = Array.isArray(kids) ? kids : [kids];
    list.forEach((kid) => {
      if (kid == null || kid === false) return;
      node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    });
  }

  function rich(text) {
    const frag = document.createDocumentFragment();
    const re = /\*\*(.+?)\*\*/g;
    let last = 0;
    let match;
    while ((match = re.exec(text))) {
      if (match.index > last) {
        frag.appendChild(document.createTextNode(text.slice(last, match.index)));
      }
      const strong = document.createElement("strong");
      strong.textContent = match[1];
      frag.appendChild(strong);
      last = match.index + match[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    return frag;
  }

  function para(text, className) {
    const p = document.createElement("p");
    if (className) p.className = className;
    p.appendChild(rich(text));
    return p;
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function say(message) {
    const live = $("live");
    live.textContent = "";
    window.setTimeout(() => {
      live.textContent = message;
    }, 30);
  }

  function chrome(title, meta) {
    $("top-title").textContent = title;
    $("top-meta").textContent = meta || "";
    const start = $("top-start");
    start.textContent = "";
    if (currentPath() !== "/") {
      start.appendChild(h("a", { class: "back", href: "#/" }, "Home"));
    }
  }

  function ensureDeskNav() {
    let nav = document.getElementById("desk-nav");
    if (nav) return nav;
    nav = h("nav", { id: "desk-nav", class: "desk-nav", "aria-label": "Study modes" });
    [
      ["/learn", "Crash Course"],
      ["/sheet", "Review Sheet"],
      ["/map", "Map"],
      ["/listen", "Listening"],
      ["/quiz", "Quiz"],
      ["/essays", "Essays"],
      ["/cram", "Cram Sheet"],
    ].forEach((mode) => {
      nav.appendChild(h("a", { href: "#" + mode[0], "data-path": mode[0] }, mode[1]));
    });
    document.querySelector(".topbar").appendChild(nav);
    return nav;
  }

  function syncNav(path) {
    const nav = ensureDeskNav();
    nav.querySelectorAll("a").forEach((link) => {
      const on = link.getAttribute("data-path") === path;
      link.classList.toggle("is-on", on);
      if (on) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function setBar(items) {
    const bar = $("bottombar");
    bar.textContent = "";
    if (!items || !items.length) {
      bar.hidden = true;
      document.body.classList.remove("has-bar");
      return;
    }
    bar.hidden = false;
    document.body.classList.add("has-bar");
    items.forEach((item) => {
      const button = h(
        "button",
        {
          type: "button",
          class: item.primary ? "bar-btn primary" : "bar-btn",
          disabled: !!item.disabled,
        },
        item.label
      );
      button.addEventListener("click", () => {
        if (!item.disabled) run(item.on, item.top);
      });
      bar.appendChild(button);
    });
  }

  function figure(src, alt, fallback) {
    const frame = h("div", { class: "art-frame" });
    if (!src) {
      frame.appendChild(h("div", { class: "art-missing" }, fallback || "Image"));
      return frame;
    }
    const img = h("img", { alt: alt || "" });
    const show = () => img.classList.add("is-ready");
    img.addEventListener("load", show);
    img.addEventListener("error", () => {
      img.remove();
      frame.appendChild(h("div", { class: "art-missing" }, fallback || "Image"));
    });
    img.src = src;
    if (img.complete && img.naturalWidth > 0) show();
    frame.appendChild(img);
    return frame;
  }

  function teachBox(connection, hook) {
    const box = h("div", { class: "teach" });
    if (connection) {
      const p = h("p");
      p.appendChild(h("span", { class: "label" }, "Connection"));
      p.appendChild(document.createTextNode(connection));
      box.appendChild(p);
    }
    if (hook) {
      const p = h("p", { class: "hook" });
      p.appendChild(h("span", { class: "label" }, "Memory hook"));
      p.appendChild(document.createTextNode(hook));
      box.appendChild(p);
    }
    return box;
  }

  function watchBox(text) {
    const watch = h("div", { class: "teach" });
    const watchP = h("p");
    watchP.appendChild(h("span", { class: "label" }, "Watch out"));
    watchP.appendChild(document.createTextNode(text));
    watch.appendChild(watchP);
    return watch;
  }

  function currentPath() {
    let raw = (location.hash || "").replace(/^#/, "");
    if (!raw || raw === "/") return "/";
    if (!raw.startsWith("/")) raw = "/" + raw;
    return raw.split("?")[0].replace(/\/+$/, "") || "/";
  }

  function pinPercent(place) {
    const bounds = STUDY.map.bounds;
    return {
      x: ((place.lon - bounds.left) / (bounds.right - bounds.left)) * 100,
      y: ((bounds.top - place.lat) / (bounds.top - bounds.bottom)) * 100,
    };
  }

  function placeById(id) {
    return STUDY.places.find((place) => place.id === id);
  }

  function listOf(tag, className, items) {
    const list = h(tag, { class: className });
    items.forEach((text) => list.appendChild(h("li", null, text)));
    return list;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function stopSpeech() {
    speechGen += 1;
    const synth = window.speechSynthesis;
    const shouldCancel = speaking || (synth && (synth.speaking || synth.pending));
    speaking = false;
    if (shouldCancel && synth) {
      try {
        synth.cancel();
      } catch (err) {
        return;
      }
    }
  }

  function englishVoice() {
    if (!window.speechSynthesis || !window.speechSynthesis.getVoices) return null;
    let voices = [];
    try {
      voices = window.speechSynthesis.getVoices() || [];
    } catch (err) {
      return null;
    }
    return (
      voices.find((voice) => /en-US/i.test(voice.lang)) ||
      voices.find((voice) => /^en/i.test(voice.lang)) ||
      null
    );
  }

  function speakPassage(text) {
    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance !== "function") return;
    stopSpeech();
    const gen = speechGen;
    let utter;
    try {
      utter = new SpeechSynthesisUtterance(text);
    } catch (err) {
      speaking = false;
      return;
    }
    utter.lang = "en-US";
    utter.rate = 0.9;
    const voice = englishVoice();
    if (voice) utter.voice = voice;
    const finish = () => {
      if (gen !== speechGen) return;
      speaking = false;
      const btn = document.getElementById("play-btn");
      if (btn && currentPath() === "/listen") btn.textContent = "Play";
    };
    utter.onend = finish;
    utter.onerror = finish;
    speaking = true;
    try {
      if (window.speechSynthesis.resume) window.speechSynthesis.resume();
      window.speechSynthesis.speak(utter);
    } catch (err) {
      speaking = false;
      const btn = document.getElementById("play-btn");
      if (btn) btn.textContent = "Play";
    }
  }

  function canSpeak() {
    return !!window.speechSynthesis && typeof SpeechSynthesisUtterance === "function";
  }

  /* ---------- views ---------- */

  function renderHome(view) {
    chrome("Ancient Rome Review", "");
    view.appendChild(
      para(
        "Ancient Rome test on Tuesday, November 10. Every question on the review sheet, with correct answers, plus the map, listening practice, and all five essays."
      )
    );
    view.appendChild(
      h("p", { class: "quiet" }, "20 minutes a day beats one long cram. The plan is below.")
    );

    const tiles = [
      ["#/learn", "Crash Course", "The whole story in 9 short cards."],
      ["#/sheet", "Review Sheet", "Questions 1–19 with correct answers."],
      ["#/map", "Map", "Rome, Carthage, Gaul, Greece, the Alps, and the sea."],
      ["#/listen", "Listening", "Hear a short passage, then answer."],
      ["#/quiz", "Quiz", "15 questions a round. Misses come back."],
      ["#/essays", "Essays", "All five, with a checklist and a sample."],
      ["#/cram", "Cram Sheet", "Every fact on one page, for test morning."],
    ];
    const grid = h("div", { class: "tiles" });
    tiles.forEach((tile, i) => {
      const link = h("a", { class: "tile", href: tile[0] });
      link.appendChild(h("strong", null, i + 1 + ". " + tile[1]));
      link.appendChild(h("span", null, tile[2]));
      grid.appendChild(link);
    });
    view.appendChild(grid);

    const days = h("ol", { class: "parts days" });
    STUDY.plan.days.forEach((day) => {
      const li = h("li");
      li.appendChild(h("span", { class: "part-name" }, day[0]));
      li.appendChild(document.createTextNode(" — " + day[1]));
      days.appendChild(li);
    });
    const list = h("ol", { class: "parts" });
    STUDY.plan.parts.forEach((part) => {
      const li = h("li");
      li.appendChild(h("span", { class: "part-name" }, part.n + ". " + part.name));
      li.appendChild(document.createTextNode(" — " + part.help));
      list.appendChild(li);
    });
    const planCol = h("section", { class: "home-col" });
    planCol.appendChild(h("h2", null, "Plan before Tuesday"));
    planCol.appendChild(days);
    const testCol = h("section", { class: "home-col" });
    testCol.appendChild(h("h2", null, "Test Tuesday: what's on it"));
    testCol.appendChild(list);
    view.appendChild(h("div", { class: "home-cols" }, [planCol, testCol]));
    const offline = h("div");
    view.appendChild(offline);
    if (window.StudyOffline) window.StudyOffline.mount(offline);
    view.appendChild(
      h(
        "p",
        { class: "quiet" },
        "Your progress is not saved. If you close the app, just start the round again."
      )
    );
    view.appendChild(
      h(
        "p",
        { class: "quiet" },
        "Add it to your home screen: Share, then Add to Home Screen (iPhone), or the browser menu, then Install app (Android/Chrome)."
      )
    );
    view.appendChild(h("a", { class: "credits-link", href: "../" }, "All study guides"));
    view.appendChild(
      h(
        "p",
        { class: "quiet" },
        "On a keyboard: arrow keys move, and the space bar flips or reveals."
      )
    );
  }

  function renderLearn(view) {
    const cards = STUDY.learn;
    const i = clamp(state.learnI, 0, cards.length - 1);
    state.learnI = i;
    const card = cards[i];
    chrome("Crash Course", i + 1 + " / " + cards.length);
    view.appendChild(h("p", { class: "quiet" }, "Read it once. The quizzes will make it stick."));
    const split = h("div", { class: card.image ? "learn-split has-figure" : "learn-split" });
    split.appendChild(h("h2", null, card.title));
    if (card.image) split.appendChild(figure(card.image, card.alt, card.title));
    const copy = h("div", { class: "learn-copy" });
    card.paragraphs.forEach((text) => copy.appendChild(para(text)));
    copy.appendChild(teachBox("", card.hook));
    split.appendChild(copy);
    view.appendChild(split);

    const go = (delta) => {
      state.learnI = clamp(state.learnI + delta, 0, cards.length - 1);
      render();
    };
    actions.prev = () => go(-1);
    actions.next = () => go(1);
    actions.primary = actions.next;
    setBar([
      { label: "Prev", disabled: i === 0, on: actions.prev },
      { label: "Next", primary: true, disabled: i === cards.length - 1, on: actions.next },
    ]);
  }

  function renderSheet(view) {
    const items = STUDY.sheet;
    state.sheet.i = clamp(state.sheet.i, 0, items.length - 1);
    const i = state.sheet.i;
    const item = items[i];
    chrome("Review Sheet", i + 1 + " / " + items.length);
    view.appendChild(h("p", { class: "quiet" }, "Question " + item.n + " of " + items.length));
    view.appendChild(h("p", { class: "prompt" }, item.q));

    if (!state.sheet.revealed) {
      view.appendChild(h("p", { class: "quiet" }, "Say or write your answer first."));
    } else {
      item.answer.forEach((text) => view.appendChild(para(text)));
      if (item.watch) view.appendChild(watchBox(item.watch));
      view.appendChild(teachBox("", item.hook));
    }

    const show = () => {
      state.sheet.revealed = true;
      say(item.answer.map((text) => text.replace(/\*\*/g, "")).join(" "));
      render();
    };
    const go = (delta) => {
      const next = i + delta;
      if (next < 0 || next >= items.length) return;
      state.sheet.i = next;
      state.sheet.revealed = false;
      render();
    };
    actions.prev = () => go(-1);
    actions.next = () => go(1);
    actions.primary = state.sheet.revealed ? actions.next : show;
    if (!state.sheet.revealed) {
      setBar([
        { label: "Prev", disabled: i === 0, on: actions.prev },
        { label: "Show answer", primary: true, on: show },
      ]);
    } else {
      setBar([
        { label: "Prev", disabled: i === 0, on: actions.prev },
        { label: "Next", primary: true, disabled: i === items.length - 1, on: actions.next },
      ]);
    }
  }

  function resetMapRound() {
    const ids = STUDY.places.map((place) => place.id);
    state.map.order = shuffle(ids);
    state.map.step = 0;
    state.map.locked = false;
    state.map.picked = null;
    state.map.score = 0;
    state.map.over = false;
    state.map.choices = shuffle(ids);
  }

  function renderMap(view) {
    if (!state.map.order) resetMapRound();
    chrome("Map", "");
    const segment = h("div", { class: "segment", role: "tablist", "aria-label": "Map mode" });
    [
      ["learn", "Learn"],
      ["find", "Find it"],
      ["name", "Name it"],
    ].forEach((pair) => {
      const button = h(
        "button",
        {
          type: "button",
          role: "tab",
          "aria-selected": state.map.mode === pair[0] ? "true" : "false",
        },
        pair[1]
      );
      button.addEventListener("click", () => {
        state.map.mode = pair[0];
        if (pair[0] === "learn") {
          state.map.over = false;
          state.map.locked = false;
        } else {
          resetMapRound();
        }
        render();
      });
      segment.appendChild(button);
    });
    view.appendChild(segment);

    const tips = h("details", { class: "tips panel", open: state.map.mode === "learn" });
    tips.appendChild(h("summary", null, "Map tips"));
    const ol = h("ol");
    STUDY.map.tips.forEach((tip) => ol.appendChild(h("li", null, tip)));
    tips.appendChild(ol);
    const board = h("div", { class: "map-board" });
    board.appendChild(tips);
    view.appendChild(board);

    if (state.map.mode === "learn") renderMapLearn(board);
    else if (state.map.over) renderMapDone(board);
    else if (state.map.mode === "find") renderMapFind(board);
    else renderMapName(board);
    view.appendChild(mapCreditLine());
  }

  function mapCreditLine() {
    const credit = STUDY.map.credit;
    const line = h("p", { class: "quiet map-credit" });
    line.appendChild(document.createTextNode("Map: "));
    line.appendChild(
      h("a", { href: credit.source, target: "_blank", rel: "noopener" }, credit.title)
    );
    line.appendChild(document.createTextNode(" by " + credit.creator + ", " + credit.license));
    return line;
  }

  function renderMapCanvas(options) {
    const wrap = h("div", { class: "map-wrap" });
    const img = h("img", { class: "map-img", alt: STUDY.map.alt });
    const ready = () => img.classList.add("is-ready");
    img.addEventListener("load", ready);
    img.addEventListener("error", () => {
      img.remove();
      wrap.insertBefore(h("div", { class: "map-missing" }, "Mediterranean map"), wrap.firstChild);
    });
    img.src = STUDY.map.src;
    if (img.complete && img.naturalWidth > 0) ready();
    wrap.appendChild(img);

    const layer = h("div", { class: options.blind ? "pin-layer is-blind" : "pin-layer" });
    STUDY.places.forEach((place) => {
      const pos = pinPercent(place);
      const button = h("button", {
        type: "button",
        class:
          "pin pin-" +
          place.kind +
          " label-" +
          place.label +
          (options.classFor ? " " + options.classFor(place) : ""),
      });
      button.style.left = pos.x + "%";
      button.style.top = pos.y + "%";
      button.setAttribute("aria-label", options.labelFor ? options.labelFor(place) : place.name);
      const dot = h("span", { class: "pin-dot" });
      dot.appendChild(h("span", { class: "pin-num" }, String(place.n)));
      button.appendChild(dot);
      if (!options.blind) button.appendChild(h("span", { class: "pin-name" }, place.name));
      button.addEventListener("click", () => options.onPin(place));
      layer.appendChild(button);
    });
    wrap.appendChild(layer);
    return wrap;
  }

  function renderMapLearn(view) {
    const selected = placeById(state.map.selected) || STUDY.places[0];
    const lead = h("div", { class: "map-lead" });
    lead.appendChild(
      h("p", null, "Tap a pin. Red dots are cities. Round rings are lands. Square rings are seas.")
    );
    const canvas = renderMapCanvas({
      labelFor: (place) => place.name,
      classFor: (place) => (place.id === selected.id ? "is-hot" : ""),
      onPin: (place) => {
        state.map.selected = place.id;
        render();
        const fact = document.getElementById("place-fact");
        if (fact) fact.scrollIntoView({ block: "nearest" });
      },
    });
    const side = h("div", { class: "map-side" });
    const fact = h("div", { class: "panel", id: "place-fact" });
    fact.appendChild(h("h2", null, selected.n + ". " + selected.name));
    fact.appendChild(h("p", null, selected.where));
    fact.appendChild(h("p", null, selected.fact));
    fact.appendChild(teachBox("", selected.hook));
    side.appendChild(fact);
    view.appendChild(h("div", { class: "map-split" }, [lead, canvas, side]));

    const order = STUDY.places.map((place) => place.id);
    const index = Math.max(0, order.indexOf(selected.id));
    const go = (delta) => {
      const next = clamp(index + delta, 0, order.length - 1);
      state.map.selected = order[next];
      render();
    };
    actions.prev = () => go(-1);
    actions.next = () => go(1);
    actions.primary = actions.next;
    setBar([
      { label: "Prev", disabled: index === 0, on: actions.prev },
      { label: "Next", primary: true, disabled: index === order.length - 1, on: actions.next },
    ]);
  }

  function renderMapFind(view) {
    const target = placeById(state.map.order[state.map.step]);
    const lead = h("div", { class: "map-lead" });
    lead.appendChild(h("p", { class: "prompt" }, "Tap " + target.name));
    lead.appendChild(
      h("p", { class: "quiet" }, "Question " + (state.map.step + 1) + " of " + state.map.order.length)
    );
    const canvas = renderMapCanvas({
      blind: !state.map.locked,
      labelFor: (place) => (state.map.locked ? place.name : "Unlabeled pin"),
      classFor: (place) => pinClass(place, target),
      onPin: (place) => {
        if (state.map.locked) return;
        state.map.locked = true;
        state.map.picked = place.id;
        if (place.id === target.id) state.map.score += 1;
        say(place.id === target.id ? "Yes. " + target.name : "That is " + place.name + ".");
        render();
      },
    });
    const side = h("div", { class: "map-side" });
    if (state.map.locked) side.appendChild(mapFeedback(target));
    view.appendChild(h("div", { class: "map-split" }, [lead, canvas, side]));
    mapQuestionBar(target);
  }

  function renderMapName(view) {
    const target = placeById(state.map.order[state.map.step]);
    const lead = h("div", { class: "map-lead" });
    lead.appendChild(h("p", { class: "prompt" }, "What is the highlighted pin?"));
    lead.appendChild(
      h("p", { class: "quiet" }, "Question " + (state.map.step + 1) + " of " + state.map.order.length)
    );
    const canvas = renderMapCanvas({
      blind: true,
      labelFor: () => "Map pin",
      classFor: (place) => {
        if (!state.map.locked && place.id === target.id) return "is-hot";
        return pinClass(place, target);
      },
      onPin: () => {},
    });
    const side = h("div", { class: "map-side" });
    state.map.choices.forEach((id) => {
      const place = placeById(id);
      let cls = "choice";
      let tag = "";
      if (state.map.locked) {
        if (id === target.id) {
          cls += " is-correct";
          tag = "Answer";
        } else if (id === state.map.picked) {
          cls += " is-wrong";
          tag = "Not quite";
        }
      }
      const button = h("button", { type: "button", class: cls, disabled: state.map.locked }, place.name);
      if (tag) button.appendChild(h("span", { class: "tag" }, tag));
      button.addEventListener("click", () => {
        if (state.map.locked) return;
        state.map.locked = true;
        state.map.picked = id;
        if (id === target.id) state.map.score += 1;
        say(id === target.id ? "Yes. " + target.name : "Not quite. It is " + target.name + ".");
        render();
      });
      side.appendChild(button);
    });
    if (state.map.locked) side.appendChild(mapFeedback(target));
    view.appendChild(h("div", { class: "map-split" }, [lead, canvas, side]));
    mapQuestionBar(target);
  }

  function pinClass(place, target) {
    if (!state.map.locked) return "";
    if (place.id === target.id) return "is-correct";
    if (place.id === state.map.picked) return "is-wrong";
    return "";
  }

  function mapFeedback(target) {
    const picked = placeById(state.map.picked);
    const box = h("div", { class: "teach" });
    if (picked && picked.id === target.id) {
      box.appendChild(h("p", null, "Yes. That is " + target.name + "."));
    } else if (picked) {
      box.appendChild(
        h(
          "p",
          null,
          "That is " + picked.name + ". " + picked.where + " " + target.name + " is the one to remember."
        )
      );
    }
    box.appendChild(h("p", null, target.where));
    box.appendChild(h("p", null, target.fact));
    box.appendChild(teachBox("", target.hook));
    return box;
  }

  function mapQuestionBar(target) {
    const last = state.map.step === state.map.order.length - 1;
    const advance = () => {
      if (!state.map.locked) return;
      if (last) {
        state.map.over = true;
        render();
        return;
      }
      state.map.step += 1;
      state.map.locked = false;
      state.map.picked = null;
      state.map.choices = shuffle(STUDY.places.map((place) => place.id));
      render();
    };
    actions.prev = null;
    actions.next = advance;
    actions.primary = state.map.locked ? advance : null;
    setBar([
      {
        label: last ? "Finish" : "Next",
        primary: true,
        disabled: !state.map.locked,
        on: advance,
      },
    ]);
  }

  function renderMapDone(view) {
    const total = state.map.order.length;
    view.appendChild(h("p", { class: "score" }, state.map.score + " / " + total));
    view.appendChild(
      h(
        "p",
        null,
        state.map.score === total
          ? "You can place all of them. Do it once more on test morning."
          : "Look again at the ones that slipped. Find the boot first, then work outward."
      )
    );
    const again = () => {
      resetMapRound();
      render();
    };
    actions.primary = again;
    setBar([{ label: "Try again", primary: true, top: true, on: again }]);
  }

  function renderEssays(view) {
    chrome("Essays", "");
    view.appendChild(
      h(
        "p",
        null,
        "Write a real paragraph. The sample is a model, not a script to memorize. Use your own words on the test."
      )
    );
    STUDY.essays.forEach((essay, index) => {
      const article = h("article", { class: "essay", id: "essay-" + essay.id });
      article.appendChild(h("h2", null, index + 1 + ". " + essay.title));
      article.appendChild(h("p", { class: "prompt" }, essay.prompt));
      article.appendChild(h("h3", null, "Key points to hit"));
      const checks = h("div");
      essay.points.forEach((point) => {
        const label = h("label", { class: "check" });
        label.appendChild(h("input", { type: "checkbox" }));
        label.appendChild(h("span", null, point));
        checks.appendChild(label);
      });
      article.appendChild(checks);
      if (essay.watch) article.appendChild(watchBox(essay.watch));
      article.appendChild(h("h3", null, "Paragraph recipe"));
      article.appendChild(listOf("ol", "recipe", essay.recipe));
      if (essay.starters) {
        article.appendChild(h("h3", null, "Ways to start your opinion"));
        article.appendChild(listOf("ul", "starters", essay.starters));
      }
      const details = h("details", { class: "sample" });
      details.appendChild(
        h("summary", null, "Sample answer. Read it, then write your own in your own words.")
      );
      const body = h("div", { class: "sample-body" });
      essay.sample.forEach((text) => body.appendChild(para(text)));
      details.appendChild(body);
      article.appendChild(details);
      view.appendChild(article);
    });

    const jump = (delta) => {
      const nodes = Array.from(document.querySelectorAll("article.essay"));
      if (!nodes.length) return;
      state.essayI = clamp(state.essayI + delta, 0, nodes.length - 1);
      nodes[state.essayI].scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    };
    actions.prev = () => jump(-1);
    actions.next = () => jump(1);
    actions.primary = null;
    setBar([
      { label: "Essay up", on: actions.prev },
      { label: "Essay down", primary: true, on: actions.next },
    ]);
  }

  function ensureListenChoices() {
    if (state.listen.choices) return;
    const passage = STUDY.listen[state.listen.i];
    state.listen.choices = passage.questions.map((q) => shuffle(q.choices));
  }

  function enterPassage(index) {
    stopSpeech();
    const passage = STUDY.listen[index];
    state.listen.i = index;
    state.listen.phase = "listen";
    state.listen.qi = 0;
    state.listen.picks = {};
    state.listen.shown = false;
    state.listen.choices = passage.questions.map((q) => shuffle(q.choices));
  }

  function commitListen() {
    const passage = STUDY.listen[state.listen.i];
    let n = 0;
    passage.questions.forEach((q, qi) => {
      if (state.listen.picks[qi] === q.a) n += 1;
    });
    state.listen.saved[state.listen.i] = n;
    let total = 0;
    state.listen.saved.forEach((value) => {
      total += value || 0;
    });
    state.listen.correct = total;
  }

  function listenTotal() {
    return STUDY.listen.reduce((sum, passage) => sum + passage.questions.length, 0);
  }

  function resetListen() {
    stopSpeech();
    state.listen.i = 0;
    state.listen.phase = "listen";
    state.listen.qi = 0;
    state.listen.picks = {};
    state.listen.correct = 0;
    state.listen.shown = false;
    state.listen.saved = [];
    state.listen.choices = STUDY.listen[0].questions.map((q) => shuffle(q.choices));
  }

  function renderListen(view) {
    if (state.listen.phase === "done") {
      renderListenDone(view);
      return;
    }
    ensureListenChoices();
    const passages = STUDY.listen;
    const i = state.listen.i;
    const passage = passages[i];
    const questions = passage.questions;
    const qi = state.listen.qi;
    const q = questions[qi];
    const picked = state.listen.picks[qi] || null;
    chrome("Listening", i + 1 + " / " + passages.length);
    view.appendChild(h("h2", null, passage.title));
    view.appendChild(
      h(
        "p",
        null,
        "Press Play and listen. Try not to read the words. Then answer the questions."
      )
    );

    if (!canSpeak()) {
      view.appendChild(
        h(
          "p",
          { class: "quiet" },
          "This device can't read aloud. Ask someone to read the words to you, or read them once yourself."
        )
      );
      view.appendChild(para(passage.text));
    } else {
      const play = h(
        "button",
        { type: "button", class: "play-btn", id: "play-btn" },
        speaking ? "Stop" : "Play"
      );
      play.addEventListener("click", () => {
        if (speaking) {
          stopSpeech();
          play.textContent = "Play";
          return;
        }
        play.textContent = "Stop";
        speakPassage(passage.text);
      });
      view.appendChild(play);
      const details = h("details", { class: "words", open: state.listen.shown });
      details.appendChild(h("summary", null, "Show the words"));
      details.appendChild(para(passage.text));
      details.addEventListener("toggle", () => {
        state.listen.shown = details.open;
      });
      view.appendChild(details);
    }

    view.appendChild(h("p", { class: "quiet" }, "Question " + (qi + 1) + " of " + questions.length));
    view.appendChild(h("p", { class: "prompt" }, q.q));
    const choices = h("div", { class: "choices" });
    state.listen.choices[qi].forEach((choice) => {
      let cls = "choice";
      let tag = "";
      if (picked) {
        if (choice === q.a) {
          cls += " is-correct";
          tag = "Answer";
        } else if (choice === picked) {
          cls += " is-wrong";
          tag = "Not quite";
        }
      }
      const button = h("button", { type: "button", class: cls, disabled: !!picked });
      button.appendChild(document.createTextNode(choice));
      if (tag) button.appendChild(h("span", { class: "tag" }, tag));
      button.addEventListener("click", () => pickListen(choice));
      choices.appendChild(button);
    });
    view.appendChild(choices);
    if (picked) view.appendChild(teachBox(q.explain));

    const lastQ = qi === questions.length - 1;
    const lastP = i === passages.length - 1;
    const goNext = () => {
      if (!state.listen.picks[qi]) return;
      if (!lastQ) {
        state.listen.qi += 1;
        state.listen.phase = "listen";
        render();
        return;
      }
      commitListen();
      if (!lastP) {
        enterPassage(i + 1);
        render();
        return;
      }
      stopSpeech();
      state.listen.phase = "done";
      render();
    };
    const goPrev = () => {
      if (i === 0) return;
      enterPassage(i - 1);
      render();
    };
    actions.prev = goPrev;
    actions.next = goNext;
    actions.primary = picked ? goNext : null;
    let nextLabel = "Next";
    if (lastQ && lastP) nextLabel = "Finish";
    else if (lastQ) nextLabel = "Next passage";
    setBar([
      { label: "Prev passage", disabled: i === 0, on: goPrev },
      { label: nextLabel, primary: true, disabled: !picked, on: goNext },
    ]);
  }

  function pickListen(choice) {
    const qi = state.listen.qi;
    if (state.listen.picks[qi]) return;
    const q = STUDY.listen[state.listen.i].questions[qi];
    state.listen.picks[qi] = choice;
    state.listen.phase = "answer";
    if (choice === q.a) say("Yes. " + q.explain);
    else say("Not quite. " + q.explain);
    render();
  }

  function renderListenDone(view) {
    const total = listenTotal();
    const correct = state.listen.correct;
    chrome("Listening", correct + " / " + total);
    view.appendChild(h("h2", null, "Listening done"));
    view.appendChild(h("p", { class: "score" }, correct + " / " + total));
    const again = () => {
      resetListen();
      render();
    };
    const button = h("button", { type: "button" }, "Start over");
    button.addEventListener("click", again);
    view.appendChild(h("div", { class: "stack-btns" }, button));
    actions.prev = null;
    actions.next = null;
    actions.primary = again;
    setBar([{ label: "Start over", primary: true, top: true, on: again }]);
  }

  function startQuiz(ids) {
    const source = ids
      ? ids.map((id) => STUDY.quiz.find((q) => q.id === id)).filter(Boolean)
      : shuffle(STUDY.quiz).slice(0, 15);
    state.quiz.round = source.map((q) => Object.assign({}, q, { choices: shuffle(q.choices) }));
    state.quiz.i = 0;
    state.quiz.picks = {};
    state.quiz.correct = 0;
    state.quiz.missed = [];
    state.quiz.phase = source.length ? "ask" : "done";
  }

  function renderQuiz(view) {
    if (!state.quiz.round) startQuiz(null);
    chrome("Quiz", "");
    if (state.quiz.phase === "done") {
      renderQuizDone(view);
      return;
    }
    const round = state.quiz.round;
    const i = state.quiz.i;
    const q = round[i];
    const picked = state.quiz.picks[i] || null;
    chrome("Quiz", i + 1 + " / " + round.length);
    view.appendChild(h("p", { class: "quiet" }, "Tap an answer. You will see why right away."));
    const split = h("div", { class: q.image ? "quiz-split has-figure" : "quiz-split" });
    if (q.image) split.appendChild(figure(q.image, q.alt, "Artwork"));
    const copy = h("div", { class: "quiz-copy" });
    copy.appendChild(h("p", { class: "prompt" }, q.q));
    const choices = h("div", { class: "choices" });
    q.choices.forEach((choice) => {
      let cls = "choice";
      let tag = "";
      if (picked) {
        if (choice === q.a) {
          cls += " is-correct";
          tag = "Answer";
        } else if (choice === picked) {
          cls += " is-wrong";
          tag = "Not quite";
        }
      }
      const button = h("button", { type: "button", class: cls, disabled: !!picked });
      button.appendChild(document.createTextNode(choice));
      if (tag) button.appendChild(h("span", { class: "tag" }, tag));
      button.addEventListener("click", () => pickQuiz(choice));
      choices.appendChild(button);
    });
    copy.appendChild(choices);
    if (picked) copy.appendChild(teachBox(q.explain, q.hook));
    split.appendChild(copy);
    view.appendChild(split);

    const go = (delta) => {
      const next = state.quiz.i + delta;
      if (next < 0 || next >= round.length) {
        if (delta > 0 && picked && i === round.length - 1) {
          state.quiz.phase = "done";
          render();
        }
        return;
      }
      if (delta > 0 && !picked) return;
      state.quiz.i = next;
      render();
    };
    actions.prev = () => go(-1);
    actions.next = () => go(1);
    actions.primary = picked ? actions.next : null;
    const onLast = i === round.length - 1;
    setBar([
      { label: "Prev", disabled: i === 0, on: actions.prev },
      {
        label: onLast ? "Finish" : "Next",
        primary: true,
        disabled: !picked,
        on: actions.next,
      },
    ]);
  }

  function pickQuiz(choice) {
    const i = state.quiz.i;
    if (state.quiz.picks[i]) return;
    const q = state.quiz.round[i];
    state.quiz.picks[i] = choice;
    if (choice === q.a) {
      state.quiz.correct += 1;
      say("Yes. " + q.explain);
    } else {
      state.quiz.missed.push(q.id);
      say("Not quite. " + q.explain);
    }
    render();
  }

  function renderQuizDone(view) {
    const total = state.quiz.round.length;
    const correct = state.quiz.correct;
    chrome("Quiz", correct + " / " + total);
    view.appendChild(h("h2", null, "Round done"));
    view.appendChild(h("p", { class: "score" }, correct + " / " + total));
    view.appendChild(h("p", null, scoreNote(correct, total)));
    const review = h(
      "button",
      { type: "button", class: state.quiz.missed.length ? "" : "secondary", disabled: !state.quiz.missed.length },
      "Review the ones you missed"
    );
    const again = h("button", { type: "button", class: "secondary" }, "New round");
    review.addEventListener("click", () => {
      const ids = state.quiz.missed.slice();
      startQuiz(ids);
      render();
    });
    again.addEventListener("click", () => {
      startQuiz(null);
      render();
    });
    view.appendChild(h("div", { class: "stack-btns" }, [review, again]));
    actions.primary = () => {
      startQuiz(null);
      render();
    };
    setBar([
      {
        label: "Review misses",
        disabled: !state.quiz.missed.length,
        top: true,
        on: () => {
          const ids = state.quiz.missed.slice();
          startQuiz(ids);
          render();
        },
      },
      {
        label: "New round",
        primary: true,
        top: true,
        on: () => {
          startQuiz(null);
          render();
        },
      },
    ]);
  }

  function scoreNote(correct, total) {
    if (correct === total) return "Clean sweep. One more round on another day and it will stay.";
    if (correct >= Math.ceil(total * 0.8)) return "That is a strong round. Review the misses, then rest.";
    if (correct >= Math.ceil(total * 0.5)) {
      return "You already know a lot of this. Review the misses. Those are the ones that will stick.";
    }
    return "This round found the gaps. That is useful. Review them and they get easier.";
  }

  function renderCram(view) {
    chrome("Cram Sheet", "");
    view.appendChild(
      h(
        "p",
        null,
        "On test morning, read this once slowly. If a line feels fuzzy, that is the card to flip again."
      )
    );
    const wrap = h("div", { class: "cram" });
    STUDY.cram.forEach((group) => {
      const block = h("section", { class: "cram-group" });
      block.appendChild(h("h2", null, group.heading));
      const ul = h("ul");
      group.lines.forEach((line) => ul.appendChild(h("li", null, line)));
      block.appendChild(ul);
      wrap.appendChild(block);
    });
    view.appendChild(wrap);
    setBar(null);
  }

  function renderMissing(view) {
    chrome("Ancient Rome Review", "");
    view.appendChild(h("p", null, "That section is not on the list."));
    view.appendChild(h("a", { class: "tile", href: "#/" }, "Back to the start"));
    setBar(null);
  }

  const routes = {
    "/": renderHome,
    "/learn": renderLearn,
    "/sheet": renderSheet,
    "/map": renderMap,
    "/listen": renderListen,
    "/quiz": renderQuiz,
    "/essays": renderEssays,
    "/cram": renderCram,
  };

  function render() {
    if (typeof STUDY === "undefined") {
      $("view").textContent = "Study data did not load.";
      return;
    }
    const path = currentPath();
    if (path !== "/listen") stopSpeech();
    document.body.dataset.mode = path === "/" ? "home" : path.replace(/^\//, "");
    syncNav(path);
    const changed = path !== lastPath;
    lastPath = path;
    actions = { prev: null, next: null, primary: null };
    const view = $("view");
    view.textContent = "";
    setBar(null);
    const draw = routes[path] || renderMissing;
    draw(view);
    if (changed || toTop) {
      window.scrollTo(0, 0);
      view.scrollTop = 0;
    }
  }

  function onKey(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      run(actions.prev);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      run(actions.next);
    } else if (event.key === " " || event.key === "Enter") {
      if (event.target && event.target.closest && event.target.closest("button, a, summary")) return;
      if (!actions.primary) return;
      event.preventDefault();
      run(actions.primary);
    }
  }

  function bindSwipe(el) {
    let tracking = false;
    let axis = null;
    let x0 = 0;
    let y0 = 0;
    let dx = 0;
    el.addEventListener(
      "touchstart",
      (event) => {
        tracking = false;
        axis = null;
        dx = 0;
        if (event.touches.length !== 1) return;
        if (event.target.closest("button, a, input, textarea, summary, label")) return;
        x0 = event.touches[0].clientX;
        y0 = event.touches[0].clientY;
        tracking = true;
      },
      { passive: true }
    );
    el.addEventListener(
      "touchmove",
      (event) => {
        if (!tracking) return;
        dx = event.touches[0].clientX - x0;
        const dy = event.touches[0].clientY - y0;
        if (!axis) {
          if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
          axis = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
        }
        if (axis === "h") event.preventDefault();
      },
      { passive: false }
    );
    el.addEventListener("touchend", () => {
      if (!tracking) return;
      const horizontal = axis === "h" && Math.abs(dx) >= 48;
      tracking = false;
      if (!horizontal) return;
      swallowClick = true;
      window.setTimeout(() => {
        swallowClick = false;
      }, 400);
      if (dx < 0) run(actions.next);
      else if (dx > 0) run(actions.prev);
    });
  }

  if (window.speechSynthesis && window.speechSynthesis.getVoices) {
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        window.speechSynthesis.getVoices();
      });
    }
  }

  document.addEventListener("keydown", onKey);
  window.addEventListener("hashchange", () => {
    stopSpeech();
    render();
  });
  bindSwipe($("view"));
  render();
})();
