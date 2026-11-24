/* The Reformation practice. Facts live in content.js (global STUDY). */
(function () {
  "use strict";

  var PREFIX = "reformation:";
  var view = document.getElementById("view");

  if (typeof STUDY === "undefined") {
    if (view) view.textContent = "Study data did not load.";
    if (window.StudyOffline) window.StudyOffline.mount(document.getElementById("offline"));
    return;
  }

  var GROUP_KEYS = Object.keys(STUDY.groups);
  var MODES = [
    { id: "story", name: "Story", blurb: "Read the story in order, from one Church to Galileo." },
    {
      id: "sort",
      name: "Sort",
      blurb: "Protestant or Catholic, then name the Protestant group.",
      score: "sort",
      score2: "groups",
      score2Label: "Groups"
    },
    { id: "vocab", name: "Vocab", blurb: "Match five words to their definitions, or flip the cards.", score: "vocab" },
    { id: "people", name: "Who am I?", blurb: "Read the clues and pick the person.", score: "people" },
    { id: "luther", name: "Luther true or false", blurb: "Activity Page 2.1, true or false.", score: "luther" },
    { id: "quiz", name: "Quiz", blurb: "Multiple choice, ten questions a round.", score: "quiz" },
    { id: "essays", name: "Essays", blurb: "A prompt, a checklist, and a sample paragraph." },
    { id: "cram", name: "Cram sheet", blurb: "Dates, sides, spellings, and fixes from the notes." }
  ];

  var state = {
    storyI: 0,
    sort: { side: null, group: null },
    vocab: {
      filter: "all",
      match: null,
      flipKey: "",
      flipOrder: null,
      flipI: 0,
      flipOpen: false
    },
    people: null,
    luther: null,
    quiz: null,
    sampleOn: {}
  };

  var focusSel = "";
  var lastKey = "";
  var booted = false;
  var focusGen = 0;
  var renderGen = 0;
  var flashWait = 0;
  var sayTimer = 0;
  var arrow = { left: null, right: null };

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (key) {
      var val = attrs[key];
      if (val == null || val === false) return;
      if (key === "class") node.className = val;
      else node.setAttribute(key, val === true ? "" : String(val));
    });
    appendKids(node, kids);
    return node;
  }

  function appendKids(node, kids) {
    if (kids == null || kids === false) return;
    if (Array.isArray(kids)) {
      kids.forEach(function (kid) { appendKids(node, kid); });
      return;
    }
    if (typeof kids === "string" || typeof kids === "number") {
      node.appendChild(document.createTextNode(String(kids)));
      return;
    }
    node.appendChild(kids);
  }

  function button(className, text, onClick) {
    var node = el("button", { type: "button", class: className }, text);
    if (onClick) node.addEventListener("click", onClick);
    return node;
  }

  function say(message) {
    var live = document.getElementById("live");
    if (!live) return;
    live.textContent = "";
    window.clearTimeout(sayTimer);
    sayTimer = window.setTimeout(function () { live.textContent = message; }, 30);
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function plain(text) {
    return String(text == null ? "" : text)
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1");
  }

  function rich(text) {
    var frag = document.createDocumentFragment();
    var str = String(text == null ? "" : text);
    var re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
    var last = 0;
    var match;
    while ((match = re.exec(str))) {
      if (match.index > last) frag.appendChild(document.createTextNode(str.slice(last, match.index)));
      if (match[1] != null) frag.appendChild(el("strong", null, match[1]));
      else frag.appendChild(el("em", null, match[2]));
      last = re.lastIndex;
    }
    if (last < str.length) frag.appendChild(document.createTextNode(str.slice(last)));
    return frag;
  }

  function addRich(node, text) {
    node.appendChild(rich(text));
    return node;
  }

  function storeGet(key) {
    try { return localStorage.getItem(PREFIX + key); }
    catch (err) { return null; }
  }

  function storeSet(key, value) {
    try { localStorage.setItem(PREFIX + key, value); }
    catch (err) {}
  }

  function loadJSON(key) {
    var raw = storeGet(key);
    if (!raw) return null;
    try {
      var data = JSON.parse(raw);
      return data;
    } catch (err) {
      return null;
    }
  }

  function saveJSON(key, data) {
    try { storeSet(key, JSON.stringify(data)); }
    catch (err) {}
  }

  function considerBest(mode, correct, total) {
    var prev = loadJSON("best:" + mode);
    var ratio = total ? correct / total : 0;
    var prevRatio = prev && prev.total ? prev.correct / prev.total : -1;
    var improved = !prev || !prev.total || ratio > prevRatio || (ratio === prevRatio && total > prev.total);
    if (improved) {
      prev = { correct: correct, total: total };
      saveJSON("best:" + mode, prev);
    }
    return { best: prev, improved: !!improved };
  }

  function bestBits(mode) {
    var data = loadJSON("best:" + mode);
    if (!data || typeof data.correct !== "number" || !data.total) return "";
    return data.correct + "/" + data.total;
  }

  function bestLine(mode) {
    var parts = [];
    if (mode.score) {
      var main = bestBits(mode.score);
      if (main) parts.push("Best " + main);
    }
    if (mode.score2) {
      var extra = bestBits(mode.score2);
      if (extra) parts.push(mode.score2Label + " " + extra);
    }
    return parts.join(" · ");
  }

  function scoreNote(correct, total) {
    if (!total) return "Nothing in this round.";
    if (correct === total) return "Perfect. That will stick.";
    if (correct / total >= 0.8) return "Strong. Redo the misses once.";
    if (correct / total >= 0.5) return "You know a lot of this. Redo the misses.";
    return "This round found the gaps. Redo the misses.";
  }

  function wantFocus(sel) { focusSel = sel || ""; }

  function placeFocus(routeKey) {
    var sel = focusSel;
    focusSel = "";
    var first = !booted;
    var changed = routeKey !== lastKey;
    lastKey = routeKey;
    booted = true;
    if (first) return;
    var token = ++focusGen;
    window.setTimeout(function () {
      if (token !== focusGen) return;
      var node = sel ? document.querySelector(sel) : (changed ? document.getElementById("title") : null);
      if (!node || !node.focus) return;
      if (node.tabIndex < 0) node.tabIndex = -1;
      try { node.focus({ preventScroll: true }); }
      catch (err) { node.focus(); }
      if (sel && node.scrollIntoView) {
        var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        try { node.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" }); }
        catch (err2) { node.scrollIntoView(false); }
      }
    }, 0);
  }

  function parseRoute() {
    var raw = (location.hash || "").replace(/^#/, "").trim().toLowerCase();
    if (!raw || raw === "home" || raw === "menu") return { name: "home" };
    if (raw.indexOf("essay-") === 0) return { name: "essay", id: raw.slice(6) };
    var known = {
      story: 1, sort: 1, groups: 1, vocab: 1, flip: 1,
      people: 1, roster: 1, luther: 1, quiz: 1, essays: 1, cram: 1
    };
    if (known[raw]) return { name: raw };
    return { name: "home" };
  }

  function counter(i, n, label) {
    return el("p", { class: "count" }, label + " " + (i + 1) + " of " + n);
  }

  function meter(done, n, slate) {
    var bar = el("div", { class: slate ? "meter meter-slate" : "meter", "aria-hidden": "true" });
    var span = el("span");
    span.style.width = (n ? Math.round((done / n) * 100) : 0) + "%";
    bar.appendChild(span);
    return bar;
  }

  function switchNav(label, items) {
    var nav = el("nav", { class: "switch", "aria-label": label });
    items.forEach(function (item) {
      var attrs = { href: item.href };
      if (item.on) attrs["aria-current"] = "page";
      nav.appendChild(el("a", attrs, item.text));
    });
    return nav;
  }

  function dock(buttons) {
    var row = el("div", { class: "dock" });
    buttons.forEach(function (node) { if (node) row.appendChild(node); });
    return row;
  }

  function bindSwipe(node, onPrev, onNext) {
    var x = 0;
    var y = 0;
    var active = false;
    node.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      active = true;
      x = e.clientX;
      y = e.clientY;
    });
    node.addEventListener("pointerup", function (e) {
      if (!active) return;
      active = false;
      var dx = e.clientX - x;
      var dy = e.clientY - y;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) { if (onNext) onNext(); }
      else if (onPrev) onPrev();
    });
    node.addEventListener("pointercancel", function () { active = false; });
  }

  function donePanel(opts) {
    var box = el("div", { class: "done" });
    box.appendChild(el("p", {
      class: "score",
      "data-result": "true",
      "aria-label": opts.correct + " out of " + opts.total
    }, opts.correct + " / " + opts.total));
    box.appendChild(el("p", null, scoreNote(opts.correct, opts.total)));
    if (opts.note) box.appendChild(el("p", { class: "hint" }, opts.note));
    var best = loadJSON("best:" + opts.mode);
    if (best && typeof best.correct === "number" && best.total) {
      box.appendChild(el("p", { class: "best" }, "Best " + best.correct + "/" + best.total));
    }
    if (opts.misses && opts.misses.length) {
      box.appendChild(el("h2", null, "Missed"));
      var ul = el("ul", { class: "misses" });
      opts.misses.forEach(function (miss) {
        var li = el("li");
        li.appendChild(addRich(el("strong"), miss.title));
        li.appendChild(addRich(el("p"), miss.detail));
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }
    var redo = null;
    if (opts.onRedo) {
      redo = button("btn", "Redo my misses", opts.onRedo);
      redo.disabled = !opts.misses || !opts.misses.length;
    }
    box.appendChild(dock([
      redo,
      button("btn btn-primary", opts.againLabel || "New round", opts.onNew)
    ]));
    view.appendChild(box);
  }

  function finishMessage(mode, correct, total, full) {
    var msg = "Round done. " + correct + " out of " + total + ".";
    if (full && considerBest(mode, correct, total).improved) msg += " New best.";
    return msg;
  }

  /* ---------- Home ---------- */

  function renderHome() {
    view.appendChild(el("p", { class: "lede" }, "Practice for the Reformation test, Chapters 1–3. Start with Story, then Sort."));
    var format = el("section", { class: "format" });
    format.appendChild(el("h2", null, "Test format"));
    var list = el("ul");
    STUDY.testParts.forEach(function (part) {
      var li = el("li");
      li.appendChild(addRich(el("strong"), part.name));
      li.appendChild(document.createTextNode(": "));
      li.appendChild(addRich(el("span"), part.help));
      list.appendChild(li);
    });
    format.appendChild(list);
    view.appendChild(format);

    var practice = el("section");
    practice.appendChild(el("h2", null, "Practice"));
    var menu = el("nav", { class: "menu", "aria-label": "Study modes" });
    MODES.forEach(function (mode) {
      var attrs = { class: mode.id === "sort" ? "mode mode-signature" : "mode", href: "#" + mode.id };
      var link = el("a", attrs);
      if (mode.id === "sort") link.appendChild(el("span", { class: "stripe", "aria-hidden": "true" }));
      link.appendChild(el("span", { class: "mode-name" }, mode.name));
      link.appendChild(el("span", { class: "mode-blurb" }, mode.blurb));
      var best = bestLine(mode);
      if (best) link.appendChild(el("span", { class: "mode-best" }, best));
      menu.appendChild(link);
    });
    practice.appendChild(menu);
    view.appendChild(practice);
  }

  /* ---------- Story ---------- */

  function stepStory(delta) {
    var next = state.storyI + delta;
    if (next < 0 || next >= STUDY.story.length) return;
    state.storyI = next;
    wantFocus("[data-prompt]");
    render();
  }

  function renderStory() {
    var cards = STUDY.story;
    var i = state.storyI;
    if (i < 0 || i >= cards.length) i = 0;
    state.storyI = i;
    var card = cards[i];
    view.appendChild(counter(i, cards.length, "Card"));
    view.appendChild(meter(i + 1, cards.length, false));
    if (i === 0) view.appendChild(el("p", { class: "hint" }, "Swipe the card, or use Prev and Next."));

    var sheet = el("article", { class: "card" });
    sheet.appendChild(addRich(el("p", { class: "when" }), card.when));
    sheet.appendChild(addRich(el("h2", { "data-prompt": "true" }), card.title));
    var points = el("ul", { class: "points" });
    card.points.forEach(function (point) {
      points.appendChild(addRich(el("li"), point));
    });
    sheet.appendChild(points);
    var hook = el("p", { class: "hook" });
    hook.appendChild(el("span", { class: "label" }, "Remember. "));
    hook.appendChild(rich(card.hook));
    sheet.appendChild(hook);
    bindSwipe(sheet, i > 0 ? function () { stepStory(-1); } : null, i < cards.length - 1 ? function () { stepStory(1); } : null);
    view.appendChild(sheet);

    var prev = button("btn", "Prev", function () { stepStory(-1); });
    prev.disabled = i === 0;
    var next = button("btn btn-primary", "Next", function () { stepStory(1); });
    next.disabled = i === cards.length - 1;
    view.appendChild(dock([prev, next]));
    arrow.left = i > 0 ? function () { stepStory(-1); } : null;
    arrow.right = i < cards.length - 1 ? function () { stepStory(1); } : null;
  }

  /* ---------- Sort ---------- */

  function groupItems() {
    return STUDY.sort.filter(function (item) {
      return item.side === "protestant" && item.group;
    });
  }

  function groupInfo(id) {
    return STUDY.groups[id] || { name: String(id || ""), who: "" };
  }

  function sideName(side) {
    return side === "catholic" ? "Catholic" : "Protestant";
  }

  function makeSort(level, only) {
    var source = only || (level === "group" ? groupItems() : STUDY.sort);
    var round = shuffle(source);
    return {
      round: round,
      i: 0,
      pick: null,
      correct: 0,
      missed: [],
      phase: round.length ? "ask" : "done",
      full: !only
    };
  }

  function ensureSort(level) {
    if (!state.sort[level]) state.sort[level] = makeSort(level, null);
    return state.sort[level];
  }

  function pickSort(level, value) {
    var st = state.sort[level];
    if (!st || st.pick || st.phase !== "ask") return;
    var item = st.round[st.i];
    st.pick = value;
    var answer = level === "group" ? item.group : item.side;
    var ok = value === answer;
    if (ok) st.correct += 1;
    else st.missed.push(item);
    var label = level === "group" ? groupInfo(answer).name : sideName(answer);
    say((ok ? "Correct. " : "Not quite. ") + label + ". " + plain(item.why));
    wantFocus("[data-next]");
    render();
  }

  function nextSort(level) {
    var st = state.sort[level];
    if (!st || !st.pick) return;
    if (st.i + 1 >= st.round.length) {
      var mode = level === "group" ? "groups" : "sort";
      say(finishMessage(mode, st.correct, st.round.length, st.full));
      st.phase = "done";
      wantFocus("[data-result]");
    } else {
      st.i += 1;
      st.pick = null;
      wantFocus("[data-prompt]");
    }
    render();
  }

  function sortButton(level, value, className, label, sub) {
    var st = state.sort[level];
    var item = st.round[st.i];
    var answer = level === "group" ? item.group : item.side;
    var picked = st.pick === value;
    var right = !!st.pick && answer === value;
    var cls = className;
    if (right) cls += " is-right";
    else if (picked) cls += " is-wrong";
    var node = el("button", { type: "button", class: cls });
    if (st.pick) node.disabled = true;
    node.appendChild(el("span", { class: "btn-label" }, label));
    if (sub) node.appendChild(el("small", null, sub));
    if (right) node.appendChild(el("span", { class: "tag" }, "Right"));
    else if (picked) node.appendChild(el("span", { class: "tag" }, "Wrong"));
    node.addEventListener("click", function () { pickSort(level, value); });
    return node;
  }

  function renderSort(level) {
    view.appendChild(switchNav("Sort level", [
      { href: "#sort", text: "Protestant or Catholic", on: level === "side" },
      { href: "#groups", text: "Which Protestant group?", on: level === "group" }
    ]));
    var st = ensureSort(level);
    if (st.phase === "done") {
      var mode = level === "group" ? "groups" : "sort";
      donePanel({
        mode: mode,
        correct: st.correct,
        total: st.round.length,
        misses: st.missed.map(function (item) {
          var answer = level === "group" ? groupInfo(item.group).name : sideName(item.side);
          return { title: item.text, detail: answer + ". " + item.why };
        }),
        onRedo: function () {
          state.sort[level] = makeSort(level, st.missed.slice());
          wantFocus("[data-prompt]");
          render();
        },
        onNew: function () {
          state.sort[level] = makeSort(level, null);
          wantFocus("[data-prompt]");
          render();
        }
      });
      return;
    }

    var item = st.round[st.i];
    view.appendChild(counter(st.i, st.round.length, "Question"));
    view.appendChild(meter(st.i + 1, st.round.length, level === "group"));
    view.appendChild(el("p", { class: "hint" }, level === "group"
      ? "These are all Protestant. Which group?"
      : "Which side does this belong on?"));

    var card = el("div", { class: "card" });
    if (st.pick) card.classList.add(item.side === "catholic" ? "is-catholic" : "is-protestant");
    card.appendChild(addRich(el("p", { class: "statement", "data-prompt": "true" }), item.text));
    view.appendChild(card);

    if (level === "group") {
      var grid = el("div", { class: "group-grid" });
      GROUP_KEYS.forEach(function (key) {
        var info = STUDY.groups[key];
        grid.appendChild(sortButton(level, key, "group-btn", info.name, info.who));
      });
      view.appendChild(grid);
    } else {
      var row = el("div", { class: "side-row" });
      row.appendChild(sortButton(level, "catholic", "side-btn side-catholic", "Catholic"));
      row.appendChild(sortButton(level, "protestant", "side-btn side-protestant", "Protestant"));
      view.appendChild(row);
    }

    if (st.pick) {
      var answer = level === "group" ? item.group : item.side;
      var ok = st.pick === answer;
      var result = el("div", { class: "result" });
      result.appendChild(el("p", { class: ok ? "banner is-right" : "banner is-wrong" }, ok ? "Correct" : "Not quite"));
      var why = el("p", { class: "why" });
      var lead = level === "group" ? groupInfo(answer).name : sideName(answer);
      why.appendChild(el("strong", null, lead + ". "));
      why.appendChild(rich(item.why));
      result.appendChild(why);
      view.appendChild(result);
      var last = st.i === st.round.length - 1;
      var next = button("btn btn-primary", last ? "Score" : "Next", function () { nextSort(level); });
      next.setAttribute("data-next", "true");
      view.appendChild(dock([next]));
    }
  }

  /* ---------- Vocab ---------- */

  function vocabPool() {
    return STUDY.vocab.filter(function (item) {
      if (state.vocab.filter === "all") return true;
      return item.source === state.vocab.filter;
    });
  }

  function setFilter(name) {
    if (state.vocab.filter === name) return;
    state.vocab.filter = name;
    state.vocab.match = null;
    state.vocab.flipKey = "";
    wantFocus('[data-focus="filter-' + name + '"]');
    render();
  }

  function filterChips() {
    var box = el("div", { class: "chips", role: "group", "aria-label": "Word list" });
    [
      ["all", "All"],
      ["crossword", "Crossword words"],
      ["notes", "Notes words"]
    ].forEach(function (pair) {
      var on = state.vocab.filter === pair[0];
      var chip = button(on ? "chip is-on" : "chip", pair[1], function () { setFilter(pair[0]); });
      chip.setAttribute("aria-pressed", on ? "true" : "false");
      chip.setAttribute("data-focus", "filter-" + pair[0]);
      box.appendChild(chip);
    });
    return box;
  }

  function makeMatch(only) {
    var pool = only ? shuffle(only) : shuffle(vocabPool()).slice(0, 5);
    var pairs = pool.map(function (item, i) {
      return {
        id: i,
        word: item.word,
        def: item.def,
        example: item.example || "",
        source: item.source,
        ref: item
      };
    });
    return {
      pairs: pairs,
      defOrder: shuffle(pairs.map(function (_, i) { return i; })),
      selected: null,
      locked: {},
      wrong: {},
      flash: null,
      firstCorrect: 0,
      phase: pairs.length ? "play" : "done",
      full: !only,
      filter: state.vocab.filter
    };
  }

  function ensureMatch() {
    var match = state.vocab.match;
    if (!match || match.filter !== state.vocab.filter) {
      state.vocab.match = makeMatch(null);
    }
    return state.vocab.match;
  }

  function allLocked(match) {
    if (!match.pairs.length) return false;
    for (var i = 0; i < match.pairs.length; i++) {
      if (!match.locked[i]) return false;
    }
    return true;
  }

  function nextWordSelector(match) {
    for (var i = 0; i < match.pairs.length; i++) {
      if (!match.locked[i]) return '[data-focus="word-' + i + '"]';
    }
    return "[data-result]";
  }

  function pickWord(i) {
    var match = state.vocab.match;
    if (!match || match.phase !== "play" || match.locked[i]) return;
    match.flash = null;
    if (match.selected === i) {
      match.selected = null;
      wantFocus('[data-focus="word-' + i + '"]');
      render();
      return;
    }
    match.selected = i;
    say(plain(match.pairs[i].word) + " selected. Now tap its definition.");
    wantFocus("[data-defs]");
    render();
  }

  function pickDef(defIndex) {
    var match = state.vocab.match;
    if (!match || match.phase !== "play" || match.locked[defIndex]) return;
    if (match.selected == null) {
      say("Tap a word first.");
      return;
    }
    var wordIndex = match.selected;
    var pair = match.pairs[wordIndex];
    if (wordIndex === defIndex) {
      match.locked[wordIndex] = true;
      if (!match.wrong[wordIndex]) match.firstCorrect += 1;
      match.selected = null;
      match.flash = null;
      if (allLocked(match)) {
        match.phase = "done";
        say(finishMessage("vocab", match.firstCorrect, match.pairs.length, match.full));
        wantFocus("[data-result]");
      } else {
        say("Correct. " + plain(pair.word) + ". " + plain(pair.def));
        wantFocus(nextWordSelector(match));
      }
      render();
      return;
    }
    match.wrong[wordIndex] = true;
    match.flash = { word: wordIndex, def: defIndex };
    match.selected = null;
    say("Not a match.");
    wantFocus('[data-focus="def-' + defIndex + '"]');
    render();
  }

  function armFlash() {
    var match = state.vocab.match;
    if (!match || !match.flash || match.phase !== "play") return;
    var gen = renderGen;
    var sel = '[data-focus="word-' + match.flash.word + '"]';
    flashWait = window.setTimeout(function () {
      if (state.vocab.match) state.vocab.match.flash = null;
      if (gen !== renderGen) return;
      if (parseRoute().name !== "vocab") return;
      wantFocus(sel);
      render();
    }, 650);
  }

  function renderVocab() {
    view.appendChild(switchNav("Vocab view", [
      { href: "#vocab", text: "Matching", on: true },
      { href: "#flip", text: "Flip cards", on: false }
    ]));
    view.appendChild(filterChips());
    var match = ensureMatch();
    if (!match.pairs.length) {
      view.appendChild(el("p", null, "No words in this list."));
      return;
    }
    if (match.phase === "done") {
      var missed = [];
      match.pairs.forEach(function (pair, i) {
        if (match.wrong[i]) missed.push(pair);
      });
      donePanel({
        mode: "vocab",
        correct: match.firstCorrect,
        total: match.pairs.length,
        note: "Score is how many you matched on the first try.",
        misses: missed.map(function (pair) {
          return { title: pair.word, detail: pair.def };
        }),
        againLabel: "New set of 5",
        onRedo: function () {
          state.vocab.match = makeMatch(missed.map(function (pair) { return pair.ref; }));
          wantFocus('[data-focus="word-0"]');
          render();
        },
        onNew: function () {
          state.vocab.match = makeMatch(null);
          wantFocus('[data-focus="word-0"]');
          render();
        }
      });
      return;
    }

    var lockedCount = 0;
    match.pairs.forEach(function (_, i) { if (match.locked[i]) lockedCount += 1; });
    view.appendChild(el("p", { class: "count" }, "Matched " + lockedCount + " of " + match.pairs.length));
    view.appendChild(meter(lockedCount, match.pairs.length, false));
    view.appendChild(el("p", { class: "hint" }, "Tap a word, then its definition."));

    var board = el("div", { class: "match-board" });
    var words = el("div", { class: "match-col" });
    words.appendChild(el("h2", null, "Words"));
    match.pairs.forEach(function (pair, i) {
      var locked = !!match.locked[i];
      var selected = match.selected === i;
      var flashed = match.flash && match.flash.word === i;
      var cls = "match-btn";
      if (locked) cls += " is-locked";
      else if (flashed) cls += " is-wrong";
      else if (selected) cls += " is-selected";
      var node = el("button", {
        type: "button",
        class: cls,
        "data-focus": "word-" + i,
        "aria-pressed": selected ? "true" : "false"
      });
      if (locked) node.disabled = true;
      node.appendChild(addRich(el("span"), pair.word));
      if (locked) node.appendChild(el("span", { class: "tag" }, "Matched"));
      else if (selected) node.appendChild(el("span", { class: "tag" }, "Selected"));
      node.addEventListener("click", function () { pickWord(i); });
      words.appendChild(node);
    });

    var defs = el("div", { class: "match-col" });
    defs.appendChild(el("h2", { "data-defs": "true", tabindex: "-1" }, "Definitions"));
    match.defOrder.forEach(function (pairIndex) {
      var pair = match.pairs[pairIndex];
      var locked = !!match.locked[pairIndex];
      var flashed = match.flash && match.flash.def === pairIndex;
      var cls = "match-btn";
      if (locked) cls += " is-locked";
      else if (flashed) cls += " is-wrong";
      var node = el("button", { type: "button", class: cls, "data-focus": "def-" + pairIndex });
      if (locked) node.disabled = true;
      node.appendChild(addRich(el("span"), pair.def));
      if (locked) node.appendChild(el("span", { class: "tag" }, "Matched"));
      node.addEventListener("click", function () { pickDef(pairIndex); });
      defs.appendChild(node);
    });
    board.appendChild(words);
    board.appendChild(defs);
    view.appendChild(board);
    armFlash();
  }

  function ensureFlip() {
    if (state.vocab.flipKey === state.vocab.filter && state.vocab.flipOrder) return;
    state.vocab.flipKey = state.vocab.filter;
    state.vocab.flipOrder = shuffle(vocabPool());
    state.vocab.flipI = 0;
    state.vocab.flipOpen = false;
  }

  function stepFlip(delta) {
    ensureFlip();
    var next = state.vocab.flipI + delta;
    if (next < 0 || next >= state.vocab.flipOrder.length) return;
    state.vocab.flipI = next;
    state.vocab.flipOpen = false;
    wantFocus("[data-prompt]");
    render();
  }

  function toggleFlip() {
    state.vocab.flipOpen = !state.vocab.flipOpen;
    var item = state.vocab.flipOrder[state.vocab.flipI];
    if (state.vocab.flipOpen && item) say(plain(item.word) + ". " + plain(item.def));
    wantFocus("[data-flip]");
    render();
  }

  function renderFlip() {
    view.appendChild(switchNav("Vocab view", [
      { href: "#vocab", text: "Matching", on: false },
      { href: "#flip", text: "Flip cards", on: true }
    ]));
    view.appendChild(filterChips());
    ensureFlip();
    var order = state.vocab.flipOrder;
    if (!order.length) {
      view.appendChild(el("p", null, "No words in this list."));
      return;
    }
    if (state.vocab.flipI >= order.length) state.vocab.flipI = 0;
    var i = state.vocab.flipI;
    var item = order[i];
    view.appendChild(counter(i, order.length, "Card"));
    view.appendChild(meter(i + 1, order.length, true));

    var card = el("article", { class: "card" });
    card.appendChild(el("p", { class: "stamp" }, item.source === "crossword" ? "Crossword word" : "Notes word"));
    card.appendChild(addRich(el("p", { class: "word", "data-prompt": "true" }), item.word));
    if (state.vocab.flipOpen) {
      var def = el("p", { class: "def-line" });
      def.appendChild(el("span", { class: "label" }, "Definition. "));
      def.appendChild(rich(item.def));
      card.appendChild(def);
      if (item.example) {
        var example = el("p", { class: "example" });
        example.appendChild(el("span", { class: "label" }, "Example. "));
        example.appendChild(rich(item.example));
        card.appendChild(example);
      }
    }
    bindSwipe(card, i > 0 ? function () { stepFlip(-1); } : null, i < order.length - 1 ? function () { stepFlip(1); } : null);
    view.appendChild(card);

    var flip = button("btn btn-primary", state.vocab.flipOpen ? "Hide definition" : "Flip", toggleFlip);
    flip.setAttribute("data-flip", "true");
    flip.setAttribute("aria-expanded", state.vocab.flipOpen ? "true" : "false");
    var prev = button("btn", "Prev", function () { stepFlip(-1); });
    prev.disabled = i === 0;
    var next = button("btn", "Next", function () { stepFlip(1); });
    next.disabled = i === order.length - 1;
    view.appendChild(dock([prev, flip, next]));
    arrow.left = i > 0 ? function () { stepFlip(-1); } : null;
    arrow.right = i < order.length - 1 ? function () { stepFlip(1); } : null;
  }

  /* ---------- People ---------- */

  function makePeople(only) {
    var list = only || STUDY.people;
    var round = shuffle(list).map(function (person) {
      var count = person.clues.length > 1 && Math.random() < 0.5 ? 2 : 1;
      var clues = shuffle(person.clues).slice(0, count);
      var names = [];
      STUDY.people.forEach(function (other) {
        if (other.name !== person.name) names.push(other.name);
      });
      var choices = shuffle(shuffle(names).slice(0, 3).concat([person.name]));
      return { person: person, clues: clues, choices: choices };
    });
    return {
      round: round,
      i: 0,
      pick: null,
      correct: 0,
      missed: [],
      phase: round.length ? "ask" : "done",
      full: !only
    };
  }

  function pickPeople(name) {
    var st = state.people;
    if (!st || st.pick || st.phase !== "ask") return;
    var person = st.round[st.i].person;
    st.pick = name;
    var ok = name === person.name;
    if (ok) st.correct += 1;
    else st.missed.push(person);
    say((ok ? "Correct. " : "Not quite. ") + person.name + ". " + plain(person.tag));
    wantFocus("[data-next]");
    render();
  }

  function nextPeople() {
    var st = state.people;
    if (!st || !st.pick) return;
    if (st.i + 1 >= st.round.length) {
      say(finishMessage("people", st.correct, st.round.length, st.full));
      st.phase = "done";
      wantFocus("[data-result]");
    } else {
      st.i += 1;
      st.pick = null;
      wantFocus("[data-prompt]");
    }
    render();
  }

  function renderPeople() {
    view.appendChild(switchNav("People", [
      { href: "#people", text: "Who am I?", on: true },
      { href: "#roster", text: "All people", on: false }
    ]));
    if (!state.people) state.people = makePeople(null);
    var st = state.people;
    if (st.phase === "done") {
      donePanel({
        mode: "people",
        correct: st.correct,
        total: st.round.length,
        misses: st.missed.map(function (person) {
          return { title: person.name, detail: person.tag };
        }),
        onRedo: function () {
          state.people = makePeople(st.missed.slice());
          wantFocus("[data-prompt]");
          render();
        },
        onNew: function () {
          state.people = makePeople(null);
          wantFocus("[data-prompt]");
          render();
        }
      });
      return;
    }

    var q = st.round[st.i];
    var person = q.person;
    view.appendChild(counter(st.i, st.round.length, "Question"));
    view.appendChild(meter(st.i + 1, st.round.length, false));
    view.appendChild(el("p", { class: "hint" }, q.clues.length > 1 ? "Two clues. Who is it?" : "One clue. Who is it?"));
    var clues = el("ul", { class: "clues card", "data-prompt": "true" });
    q.clues.forEach(function (clue) { clues.appendChild(addRich(el("li"), clue)); });
    view.appendChild(clues);

    var choices = el("div", { class: "choices" });
    q.choices.forEach(function (name) {
      var cls = "choice";
      var tag = "";
      if (st.pick) {
        if (name === person.name) { cls += " is-right"; tag = "Right"; }
        else if (name === st.pick) { cls += " is-wrong"; tag = "Wrong"; }
      }
      var node = el("button", { type: "button", class: cls }, name);
      if (st.pick) node.disabled = true;
      if (tag) node.appendChild(el("span", { class: "tag" }, tag));
      node.addEventListener("click", function () { pickPeople(name); });
      choices.appendChild(node);
    });
    view.appendChild(choices);

    if (st.pick) {
      var ok = st.pick === person.name;
      var result = el("div", { class: "result" });
      result.appendChild(el("p", { class: ok ? "banner is-right" : "banner is-wrong" }, ok ? "Correct" : "Not quite"));
      result.appendChild(el("p", { class: "who" }, person.name));
      result.appendChild(addRich(el("p", { class: "person-tag" }), person.tag));
      var facts = el("ul", { class: "facts" });
      person.facts.forEach(function (fact) { facts.appendChild(addRich(el("li"), fact)); });
      result.appendChild(facts);
      view.appendChild(result);
      var last = st.i === st.round.length - 1;
      var next = button("btn btn-primary", last ? "Score" : "Next", nextPeople);
      next.setAttribute("data-next", "true");
      view.appendChild(dock([next]));
    }
  }

  function renderRoster() {
    view.appendChild(switchNav("People", [
      { href: "#people", text: "Who am I?", on: false },
      { href: "#roster", text: "All people", on: true }
    ]));
    STUDY.people.forEach(function (person) {
      var card = el("article", { class: "person" });
      card.appendChild(el("h2", null, person.name));
      card.appendChild(addRich(el("p", { class: "person-tag" }), person.tag));
      var facts = el("ul", { class: "facts" });
      person.facts.forEach(function (fact) { facts.appendChild(addRich(el("li"), fact)); });
      card.appendChild(facts);
      view.appendChild(card);
    });
  }

  /* ---------- Luther true or false ---------- */

  function makeLuther(only) {
    var round = shuffle(only || STUDY.luther);
    return {
      round: round,
      i: 0,
      pick: null,
      correct: 0,
      missed: [],
      phase: round.length ? "ask" : "done",
      full: !only
    };
  }

  function pickLuther(value) {
    var st = state.luther;
    if (!st || st.pick !== null || st.phase !== "ask") return;
    var item = st.round[st.i];
    st.pick = value;
    var ok = value === item.answer;
    if (ok) st.correct += 1;
    else st.missed.push(item);
    var msg = (ok ? "Correct. " : "Not quite. ") + (item.answer ? "True." : "False.");
    if (item.answer === false && item.fix) msg += " " + plain(item.fix);
    say(msg);
    wantFocus("[data-next]");
    render();
  }

  function nextLuther() {
    var st = state.luther;
    if (!st || st.pick === null) return;
    if (st.i + 1 >= st.round.length) {
      say(finishMessage("luther", st.correct, st.round.length, st.full));
      st.phase = "done";
      wantFocus("[data-result]");
    } else {
      st.i += 1;
      st.pick = null;
      wantFocus("[data-prompt]");
    }
    render();
  }

  function renderLuther() {
    if (!state.luther) state.luther = makeLuther(null);
    var st = state.luther;
    if (st.phase === "done") {
      donePanel({
        mode: "luther",
        correct: st.correct,
        total: st.round.length,
        misses: st.missed.map(function (item) {
          var detail = item.answer ? "True." : (item.fix ? "False. " + item.fix : "False.");
          return { title: item.text, detail: detail };
        }),
        onRedo: function () {
          state.luther = makeLuther(st.missed.slice());
          wantFocus("[data-prompt]");
          render();
        },
        onNew: function () {
          state.luther = makeLuther(null);
          wantFocus("[data-prompt]");
          render();
        }
      });
      return;
    }

    var item = st.round[st.i];
    view.appendChild(counter(st.i, st.round.length, "Question"));
    view.appendChild(meter(st.i + 1, st.round.length, false));
    if (item.worksheet) {
      view.appendChild(el("p", { class: "stamp" }, "From Activity Page 2.1 #" + item.worksheet));
    }
    var card = el("div", { class: "card" });
    card.appendChild(addRich(el("p", { class: "statement", "data-prompt": "true" }), item.text));
    view.appendChild(card);

    var row = el("div", { class: "side-row" });
    [true, false].forEach(function (value) {
      var label = value ? "True" : "False";
      var cls = "choice";
      var tag = "";
      if (st.pick !== null) {
        if (value === item.answer) { cls += " is-right"; tag = "Right"; }
        else if (value === st.pick) { cls += " is-wrong"; tag = "Wrong"; }
      }
      var node = el("button", { type: "button", class: cls }, label);
      if (st.pick !== null) node.disabled = true;
      if (tag) node.appendChild(el("span", { class: "tag" }, tag));
      node.addEventListener("click", function () { pickLuther(value); });
      row.appendChild(node);
    });
    view.appendChild(row);

    if (st.pick !== null) {
      var ok = st.pick === item.answer;
      var result = el("div", { class: "result" });
      result.appendChild(el("p", { class: ok ? "banner is-right" : "banner is-wrong" }, ok ? "Correct" : "Not quite"));
      if (item.answer === false && item.fix) {
        var fix = el("p", { class: "fix" });
        fix.appendChild(el("span", { class: "label" }, "The true version. "));
        fix.appendChild(rich(item.fix));
        result.appendChild(fix);
      }
      view.appendChild(result);
      var last = st.i === st.round.length - 1;
      var next = button("btn btn-primary", last ? "Score" : "Next", nextLuther);
      next.setAttribute("data-next", "true");
      view.appendChild(dock([next]));
    }
  }

  /* ---------- Quiz ---------- */

  function makeQuiz(only) {
    var source = only ? shuffle(only) : shuffle(STUDY.quiz).slice(0, 10);
    var round = source.map(function (q) {
      return {
        q: q.q,
        why: q.why || "",
        correct: q.choices[q.answer],
        choices: shuffle(q.choices),
        ref: q
      };
    });
    return {
      round: round,
      i: 0,
      pick: null,
      correct: 0,
      missed: [],
      phase: round.length ? "ask" : "done",
      full: !only
    };
  }

  function pickQuiz(choice) {
    var st = state.quiz;
    if (!st || st.pick || st.phase !== "ask") return;
    var q = st.round[st.i];
    st.pick = choice;
    var ok = choice === q.correct;
    if (ok) st.correct += 1;
    else st.missed.push(q.ref);
    var msg = ok ? "Correct." : "Not quite. " + plain(q.correct) + ".";
    if (q.why) msg += " " + plain(q.why);
    say(msg);
    wantFocus("[data-next]");
    render();
  }

  function nextQuiz() {
    var st = state.quiz;
    if (!st || !st.pick) return;
    if (st.i + 1 >= st.round.length) {
      say(finishMessage("quiz", st.correct, st.round.length, st.full));
      st.phase = "done";
      wantFocus("[data-result]");
    } else {
      st.i += 1;
      st.pick = null;
      wantFocus("[data-prompt]");
    }
    render();
  }

  function renderQuiz() {
    if (!state.quiz) state.quiz = makeQuiz(null);
    var st = state.quiz;
    if (st.phase === "done") {
      donePanel({
        mode: "quiz",
        correct: st.correct,
        total: st.round.length,
        misses: st.missed.map(function (q) {
          var correct = q.choices[q.answer];
          return { title: q.q, detail: correct + (q.why ? ". " + q.why : "") };
        }),
        onRedo: function () {
          state.quiz = makeQuiz(st.missed.slice());
          wantFocus("[data-prompt]");
          render();
        },
        onNew: function () {
          state.quiz = makeQuiz(null);
          wantFocus("[data-prompt]");
          render();
        }
      });
      return;
    }

    var q = st.round[st.i];
    view.appendChild(counter(st.i, st.round.length, "Question"));
    view.appendChild(meter(st.i + 1, st.round.length, false));
    view.appendChild(addRich(el("p", { class: "prompt", "data-prompt": "true" }), q.q));
    var choices = el("div", { class: "choices" });
    q.choices.forEach(function (choice) {
      var cls = "choice";
      var tag = "";
      if (st.pick) {
        if (choice === q.correct) { cls += " is-right"; tag = "Right"; }
        else if (choice === st.pick) { cls += " is-wrong"; tag = "Wrong"; }
      }
      var node = el("button", { type: "button", class: cls });
      if (st.pick) node.disabled = true;
      node.appendChild(rich(choice));
      if (tag) node.appendChild(el("span", { class: "tag" }, tag));
      node.addEventListener("click", function () { pickQuiz(choice); });
      choices.appendChild(node);
    });
    view.appendChild(choices);

    if (st.pick) {
      var ok = st.pick === q.correct;
      var result = el("div", { class: "result" });
      result.appendChild(el("p", { class: ok ? "banner is-right" : "banner is-wrong" }, ok ? "Correct" : "Not quite"));
      if (q.why) result.appendChild(addRich(el("p", { class: "why" }), q.why));
      view.appendChild(result);
      var last = st.i === st.round.length - 1;
      var next = button("btn btn-primary", last ? "Score" : "Next", nextQuiz);
      next.setAttribute("data-next", "true");
      view.appendChild(dock([next]));
    }
  }

  /* ---------- Essays ---------- */

  function essayById(id) {
    for (var i = 0; i < STUDY.essays.length; i++) {
      if (STUDY.essays[i].id === id) return STUDY.essays[i];
    }
    return null;
  }

  function renderEssays() {
    view.appendChild(el("p", { class: "lede" }, "Pick a prompt. Check off the facts, then write a paragraph in your own words."));
    STUDY.essays.forEach(function (essay, index) {
      var link = el("a", { class: "essay-link", href: "#essay-" + essay.id });
      link.appendChild(addRich(el("strong"), (index + 1) + ". " + essay.prompt));
      view.appendChild(link);
    });
  }

  function renderEssay(id) {
    var essay = essayById(id);
    view.appendChild(el("p", { class: "crumb" }, el("a", { href: "#essays" }, "All essays")));
    if (!essay) {
      view.appendChild(el("p", null, "That essay is not on this list."));
      return;
    }
    view.appendChild(addRich(el("h2", { "data-prompt": "true" }), essay.prompt));

    var saved = loadJSON("essay:" + essay.id + ":checks");
    var field = el("fieldset", { class: "checks" });
    field.appendChild(el("legend", null, "Checklist"));
    essay.checklist.forEach(function (line, index) {
      var label = el("label", { class: "check" });
      var input = el("input", { type: "checkbox" });
      input.checked = !!(Array.isArray(saved) && saved[index]);
      input.addEventListener("change", function () {
        var boxes = field.querySelectorAll('input[type="checkbox"]');
        var values = [];
        for (var n = 0; n < boxes.length; n++) values.push(!!boxes[n].checked);
        saveJSON("essay:" + essay.id + ":checks", values);
      });
      label.appendChild(input);
      label.appendChild(addRich(el("span"), line));
      field.appendChild(label);
    });
    view.appendChild(field);

    var fieldId = "practice-" + essay.id;
    view.appendChild(el("label", { for: fieldId }, "Practice here"));
    var area = el("textarea", {
      id: fieldId,
      class: "write",
      spellcheck: "true",
      autocomplete: "off",
      autocapitalize: "sentences"
    });
    area.value = storeGet("essay:" + essay.id + ":draft") || "";
    area.addEventListener("input", function () {
      storeSet("essay:" + essay.id + ":draft", area.value);
    });
    view.appendChild(area);
    view.appendChild(el("p", { class: "hint" }, "Your checklist and writing stay on this phone."));

    var sample = el("div", { class: "sample" });
    var sampleText = el("p");
    sampleText.appendChild(rich(essay.sample));
    sample.appendChild(sampleText);
    var open = !!state.sampleOn[essay.id];
    sample.hidden = !open;
    var toggle = button("btn btn-block", open ? "Hide sample paragraph" : "Show sample paragraph", function () {
      var show = sample.hidden;
      sample.hidden = !show;
      state.sampleOn[essay.id] = show;
      toggle.textContent = show ? "Hide sample paragraph" : "Show sample paragraph";
      toggle.setAttribute("aria-expanded", show ? "true" : "false");
      if (show) {
        say("Sample paragraph.");
        if (sample.tabIndex < 0) sample.tabIndex = -1;
        try { sample.focus({ preventScroll: true }); }
        catch (err) { sample.focus(); }
      }
    });
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    view.appendChild(toggle);
    view.appendChild(sample);

    view.appendChild(el("h2", null, "How to write it"));
    var tips = el("ul", { class: "tips" });
    STUDY.essayTips.forEach(function (tip) { tips.appendChild(addRich(el("li"), tip)); });
    view.appendChild(tips);
  }

  /* ---------- Cram ---------- */

  function renderCram() {
    view.appendChild(el("p", { class: "lede" }, "Read the bold heads, then the spellings, then the fixes."));
    var lines = el("div", { class: "cram" });
    STUDY.cram.forEach(function (row) {
      var p = el("p", { class: "cram-line" });
      p.appendChild(addRich(el("strong"), row.head));
      p.appendChild(rich(row.text));
      lines.appendChild(p);
    });
    view.appendChild(lines);

    view.appendChild(el("h2", null, "Spellings"));
    var spells = el("ul", { class: "spells" });
    STUDY.spellings.forEach(function (word) {
      spells.appendChild(addRich(el("li"), word));
    });
    view.appendChild(spells);

    view.appendChild(el("h2", null, "Fixes to the notes"));
    view.appendChild(el("p", { class: "hint" }, "Places where the notes were a little off, and the more accurate version."));
    STUDY.fixes.forEach(function (fix) {
      var card = el("article", { class: "fix-card" });
      var said = el("p");
      said.appendChild(el("span", { class: "label" }, "Notes said"));
      said.appendChild(rich(fix.notes));
      var better = el("p");
      better.appendChild(el("span", { class: "label label-better" }, "Better"));
      better.appendChild(rich(fix.fixed));
      card.appendChild(said);
      card.appendChild(better);
      view.appendChild(card);
    });
  }

  /* ---------- Paint ---------- */

  function paint() {
    window.clearTimeout(flashWait);
    flashWait = 0;
    var route = parseRoute();
    if (route.name !== "vocab" && state.vocab.match) state.vocab.match.flash = null;
    view.textContent = "";

    var title = "The Reformation";
    var home = route.name === "home";
    if (route.name === "home") renderHome();
    else if (route.name === "story") { title = "Story"; renderStory(); }
    else if (route.name === "sort") { title = "Protestant or Catholic"; renderSort("side"); }
    else if (route.name === "groups") { title = "Which Protestant group?"; renderSort("group"); }
    else if (route.name === "vocab") { title = "Vocab"; renderVocab(); }
    else if (route.name === "flip") { title = "Flip cards"; renderFlip(); }
    else if (route.name === "people") { title = "Who am I?"; renderPeople(); }
    else if (route.name === "roster") { title = "People"; renderRoster(); }
    else if (route.name === "luther") { title = "Luther true or false"; renderLuther(); }
    else if (route.name === "quiz") { title = "Quiz"; renderQuiz(); }
    else if (route.name === "essays") { title = "Essays"; renderEssays(); }
    else if (route.name === "essay") { title = "Essays"; renderEssay(route.id); }
    else if (route.name === "cram") { title = "Cram sheet"; renderCram(); }
    else { home = true; renderHome(); }

    document.getElementById("title").textContent = title;
    document.getElementById("running").textContent = home ? "Chapters 1–3 · Allie" : "The Reformation";
    document.title = home ? "The Reformation" : title + " · The Reformation";
    document.body.setAttribute("data-screen", home ? "home" : route.name);
    var modes = document.getElementById("modes-link");
    if (home) modes.setAttribute("hidden", "");
    else modes.removeAttribute("hidden");
    placeFocus(route.name + ":" + (route.id || ""));
  }

  function render() {
    renderGen += 1;
    arrow.left = null;
    arrow.right = null;
    try {
      paint();
    } catch (err) {
      if (window.console && console.error) console.error(err);
      if (view) view.textContent = "This screen hit a problem. Use Modes to go back.";
    }
  }

  function onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
    var tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || tag === "A") return;
    if (e.key === "ArrowLeft" && arrow.left) { e.preventDefault(); arrow.left(); }
    else if (e.key === "ArrowRight" && arrow.right) { e.preventDefault(); arrow.right(); }
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("keydown", onKey);
  if (window.StudyOffline) window.StudyOffline.mount(document.getElementById("offline"));
  render();
})();
