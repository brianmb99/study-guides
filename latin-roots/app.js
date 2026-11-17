/* Latin Roots practice. Facts live in content.js (global STUDY). */
(function () {
  "use strict";

  if (typeof STUDY === "undefined") {
    var missing = document.getElementById("view");
    if (missing) missing.textContent = "Study data did not load.";
    return;
  }

  var PREFIX = "latin-roots:";
  var GROUPS = [
    { sense: "see", title: "See", lesson: "Lesson 1", ids: ["vis", "spect"] },
    { sense: "hear", title: "Hear", lesson: "Lesson 2", ids: ["audi", "phon"] },
    { sense: "speak", title: "Speak", lesson: "Lesson 3", ids: ["dict", "voc"] }
  ];
  var MODES = [
    { id: "roots", name: "Roots", blurb: "Six roots", scored: false },
    { id: "words", name: "Words", blurb: "30 cards", scored: false },
    { id: "match", name: "Match", blurb: "6 pairs", scored: true },
    { id: "sort", name: "Sort", blurb: "Which root?", scored: true },
    { id: "synonyms", name: "Synonyms", blurb: "Closest meaning", scored: true },
    { id: "blank", name: "Fill the blank", blurb: "In context", scored: true },
    { id: "parts", name: "Word parts", blurb: "pre-, super-", scored: true },
    { id: "write", name: "Write it", blurb: "Your sentence", scored: true },
    { id: "test", name: "Practice test", blurb: "15 questions", scored: true },
    { id: "cram", name: "Cram card", blurb: "Last look", scored: false }
  ];

  var view = document.getElementById("view");
  var cameFromMenu = false;
  var lastKey = "";
  var pendingFocus = null;
  var roundSerial = 0;
  var gen = 0;

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
    if (kids == null) return;
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
    window.setTimeout(function () { live.textContent = message; }, 30);
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

  function wordEntry(word) {
    var key = String(word || "").toLowerCase();
    for (var i = 0; i < STUDY.words.length; i++) {
      if (STUDY.words[i].word === key) return STUDY.words[i];
    }
    return null;
  }

  function rootById(id) {
    for (var i = 0; i < STUDY.roots.length; i++) {
      if (STUDY.roots[i].id === id) return STUDY.roots[i];
    }
    return null;
  }

  function senseOf(id) {
    if (id === "vis" || id === "spect") return "see";
    if (id === "audi" || id === "phon") return "hear";
    if (id === "dict" || id === "voc") return "speak";
    return "part";
  }

  function matchSense(left) {
    var s = String(left || "").toLowerCase();
    if (s.indexOf("vis") !== -1 || s.indexOf("spect") !== -1) return "see";
    if (s.indexOf("audi") !== -1 || s.indexOf("phon") !== -1) return "hear";
    if (s.indexOf("dict") !== -1 || s.indexOf("voc") !== -1) return "speak";
    return "part";
  }

  function boldWord(phrase) {
    var match = String(phrase || "").match(/\*\*([^*]+)\*\*/);
    return match ? match[1] : "";
  }

  function phraseFragment(phrase) {
    var frag = document.createDocumentFragment();
    var re = /\*\*([^*]+)\*\*/g;
    var last = 0;
    var match;
    while ((match = re.exec(phrase))) {
      if (match.index > last) frag.appendChild(document.createTextNode(phrase.slice(last, match.index)));
      var word = match[1];
      var strong = el("strong", {}, word);
      var entry = wordEntry(word);
      if (entry) strong.className = "sense-" + senseOf(entry.root);
      frag.appendChild(strong);
      last = re.lastIndex;
    }
    if (last < phrase.length) frag.appendChild(document.createTextNode(phrase.slice(last)));
    return frag;
  }

  function fillFragment(text, word) {
    var frag = document.createDocumentFragment();
    var bits = String(text || "").split("___");
    bits.forEach(function (bit, i) {
      frag.appendChild(document.createTextNode(bit));
      if (i >= bits.length - 1) return;
      if (word) {
        var strong = el("strong", { class: "filled" }, word);
        var entry = wordEntry(word);
        if (entry) strong.classList.add("sense-" + senseOf(entry.root));
        frag.appendChild(strong);
      } else {
        frag.appendChild(el("span", { class: "blank" }, "blank"));
      }
    });
    return frag;
  }

  function partsFragment(parts, rootId) {
    var frag = document.createDocumentFragment();
    var root = rootById(rootId);
    var text = String(parts || "");
    if (!root) {
      frag.appendChild(document.createTextNode(text));
      return frag;
    }
    var label = root.label.toLowerCase();
    var idx = text.toLowerCase().indexOf(label);
    if (idx < 0) {
      frag.appendChild(document.createTextNode(text));
      return frag;
    }
    frag.appendChild(document.createTextNode(text.slice(0, idx)));
    frag.appendChild(el("mark", { class: "root-hit sense-" + senseOf(rootId) }, text.slice(idx, idx + label.length)));
    frag.appendChild(document.createTextNode(text.slice(idx + label.length)));
    return frag;
  }

  function loadBest(mode) {
    try {
      var raw = localStorage.getItem(PREFIX + mode);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") return null;
      return data;
    } catch (err) {
      return null;
    }
  }

  function saveBest(mode, data) {
    try {
      localStorage.setItem(PREFIX + mode, JSON.stringify(data));
    } catch (err) {}
  }

  function isBetter(mode, next, prev) {
    if (!prev) return true;
    if (mode === "match") return typeof next.tries === "number" && (typeof prev.tries !== "number" || next.tries < prev.tries);
    if (typeof next.correct !== "number" || typeof next.total !== "number" || !next.total) return false;
    if (typeof prev.correct !== "number" || typeof prev.total !== "number" || !prev.total) return true;
    return next.correct / next.total > prev.correct / prev.total;
  }

  function record(mode, data) {
    if (isBetter(mode, data, loadBest(mode))) saveBest(mode, data);
    return loadBest(mode);
  }

  function bestText(mode) {
    var data = loadBest(mode);
    if (!data) return "Best —";
    if (mode === "match") {
      if (typeof data.tries !== "number") return "Best —";
      return "Best " + data.tries + (data.tries === 1 ? " try" : " tries");
    }
    if (typeof data.correct !== "number" || typeof data.total !== "number") return "Best —";
    return "Best " + data.correct + "/" + data.total;
  }

  function scoreNote(correct, total) {
    if (!total) return "";
    var pct = correct / total;
    if (pct === 1) return "Perfect.";
    if (pct >= 0.8) return "Strong. Look once more at any you missed.";
    if (pct >= 0.5) return "Keep going. The roots are starting to stick.";
    return "Review Roots, then try this again.";
  }

  function queueFocus(node) {
    pendingFocus = node;
  }

  function applyFocus(key) {
    var node = pendingFocus || document.getElementById("top-title");
    pendingFocus = null;
    if (key === lastKey) return;
    lastKey = key;
    if (!node || !node.focus) return;
    if (node.tabIndex < 0) node.tabIndex = -1;
    try {
      node.focus({ preventScroll: true });
    } catch (err) {
      node.focus();
    }
  }

  function setChrome(title, progress, score, showBack) {
    var h1 = document.getElementById("top-title");
    h1.textContent = title;
    document.title = title === "Latin Roots" ? "Latin Roots" : title + " · Latin Roots";
    var meta = document.getElementById("top-meta");
    meta.textContent = "";
    if (progress) meta.appendChild(el("span", { class: "progress" }, progress));
    if (score) meta.appendChild(el("span", { class: "scoreline" }, score));
    var bits = [];
    if (progress) bits.push(progress.replace(" / ", " of "));
    if (score) bits.push(score);
    if (bits.length) meta.setAttribute("aria-label", bits.join(", "));
    else meta.removeAttribute("aria-label");
    var start = document.getElementById("top-start");
    start.textContent = "";
    if (showBack) {
      var back = button("back", "Back", goMenu);
      back.setAttribute("aria-label", "Back to modes");
      start.appendChild(back);
    } else {
      start.appendChild(el("a", { class: "all-guides", href: "../" }, "All guides"));
    }
  }

  function goMenu() {
    if (cameFromMenu) {
      cameFromMenu = false;
      history.back();
      return;
    }
    if (location.hash && location.hash !== "#") {
      history.replaceState(null, "", location.pathname + location.search);
    }
    renderCurrent();
  }

  function currentMode() {
    var raw = (location.hash || "").replace(/^#/, "").trim().toLowerCase();
    var known = {
      roots: 1, words: 1, match: 1, sort: 1, synonyms: 1,
      blank: 1, parts: 1, write: 1, test: 1, cram: 1
    };
    return known[raw] ? raw : "home";
  }

  function choiceObjs(list) {
    return list.map(function (choice) { return { value: choice, label: choice }; });
  }

  function rootChoices() {
    return STUDY.roots.map(function (root) {
      return {
        value: root.id,
        label: root.label,
        meaning: root.meaning,
        sense: senseOf(root.id)
      };
    });
  }

  function pickFour(answer, pool) {
    var rest = [];
    pool.forEach(function (item) {
      if (item !== answer && rest.indexOf(item) === -1) rest.push(item);
    });
    return shuffle(shuffle(rest).slice(0, 3).concat([answer]));
  }

  function itemsSyn(list) {
    return list.map(function (item) {
      return {
        type: "syn",
        phrase: item.phrase,
        word: boldWord(item.phrase),
        choices: choiceObjs(shuffle(item.choices)),
        answer: item.answer,
        grid: false
      };
    });
  }

  function itemsBlank(list) {
    return list.map(function (item) {
      return {
        type: "blank",
        text: item.text,
        choices: choiceObjs(shuffle(item.choices)),
        answer: item.answer,
        grid: false
      };
    });
  }

  function itemsParts(list) {
    return list.map(function (item) {
      return {
        type: "parts",
        q: item.q,
        choices: choiceObjs(shuffle(item.choices)),
        answer: item.answer,
        grid: false
      };
    });
  }

  function itemsSort(words) {
    var choices = rootChoices();
    return words.map(function (word) {
      return {
        type: "sort",
        entry: word,
        choices: choices,
        answer: word.root,
        grid: true
      };
    });
  }

  function itemsMean() {
    var meanings = STUDY.matching.map(function (item) { return item.right; });
    return STUDY.matching.map(function (item) {
      return {
        type: "mean",
        left: item.left,
        choices: choiceObjs(pickFour(item.right, meanings)),
        answer: item.right,
        grid: false
      };
    });
  }

  function makeTest() {
    var all = itemsMean().concat(
      itemsSort(shuffle(STUDY.words).slice(0, 4)),
      itemsSyn(shuffle(STUDY.synonyms).slice(0, 3)),
      itemsBlank(shuffle(STUDY.context).slice(0, 2))
    );
    if (all.length !== 15) console.error("Practice test should have 15 questions, has " + all.length);
    all.forEach(function (item) {
      var values = item.choices.map(function (choice) { return choice.value; });
      if (values.indexOf(item.answer) === -1) console.error("Answer missing from choices", item.answer);
      if (item.type === "mean" && item.choices.length !== 4) console.error("Meaning question needs 4 choices");
    });
    return shuffle(all);
  }

  function promptFor(item, revealed) {
    var box = el("div", { class: "prompt" });
    if (item.type === "syn") {
      box.appendChild(el("p", { class: "ask" }, "Pick the SYNONYM (closest meaning) of the bold word."));
      var phrase = el("p", { class: "phrase" });
      phrase.appendChild(phraseFragment(item.phrase));
      box.appendChild(phrase);
    } else if (item.type === "blank") {
      box.appendChild(el("p", { class: "ask" }, "Pick the word that belongs in the blank."));
      var sentence = el("p", { class: "phrase" });
      sentence.appendChild(fillFragment(item.text, revealed ? item.answer : null));
      box.appendChild(sentence);
    } else if (item.type === "parts") {
      box.appendChild(el("p", { class: "phrase parts-q" }, item.q));
    } else if (item.type === "sort") {
      box.appendChild(el("p", { class: "ask" }, "Which root is in this word?"));
      var hero = el("p", { class: revealed ? "hero-word sense-" + senseOf(item.answer) : "hero-word" }, item.entry.word);
      box.appendChild(hero);
      box.appendChild(el("p", { class: "pos" }, item.entry.pos));
    } else if (item.type === "mean") {
      var line = el("p", { class: "phrase" });
      line.appendChild(document.createTextNode("What does "));
      line.appendChild(el("strong", { class: "sense-" + matchSense(item.left) }, item.left));
      line.appendChild(document.createTextNode(" mean?"));
      box.appendChild(line);
    }
    return box;
  }

  function feedbackFor(item, ok) {
    var frag = document.createDocumentFragment();
    var head = el("p");
    head.appendChild(el("strong", {}, ok ? "Correct. " : "Not quite. "));
    if (item.type === "sort") {
      var root = rootById(item.answer);
      head.appendChild(document.createTextNode(root.label + " means " + root.meaning + "."));
      frag.appendChild(head);
      var parts = el("p", { class: "parts-line" });
      parts.appendChild(partsFragment(item.entry.parts, item.answer));
      frag.appendChild(parts);
      return frag;
    }
    if (item.type === "mean") {
      head.appendChild(document.createTextNode("It means " + item.answer + "."));
      frag.appendChild(head);
      return frag;
    }
    if (!ok) head.appendChild(document.createTextNode("Answer: " + item.answer + "."));
    frag.appendChild(head);
    if (item.type === "syn" || item.type === "blank") {
      var entry = wordEntry(item.type === "syn" ? item.word : item.answer);
      if (entry) frag.appendChild(el("p", {}, entry.def));
    }
    return frag;
  }

  function answerLabel(item) {
    if (item.type === "sort") {
      var root = rootById(item.answer);
      return root ? root.label : item.answer;
    }
    return item.answer;
  }

  function labelOf(item, value) {
    for (var i = 0; i < item.choices.length; i++) {
      if (item.choices[i].value === value) return item.choices[i].label;
    }
    return value;
  }

  function sayFor(item, ok) {
    if (ok) return "Correct. The answer is " + answerLabel(item) + ".";
    return "Incorrect. The answer is " + answerLabel(item) + ".";
  }

  function missLine(item, picked) {
    var li = el("li", { class: "miss" });
    var question = el("p", { class: "miss-q" });
    if (item.type === "syn") question.appendChild(phraseFragment(item.phrase));
    else if (item.type === "blank") question.appendChild(fillFragment(item.text, null));
    else if (item.type === "sort") question.appendChild(document.createTextNode("Which root is in " + item.entry.word + "?"));
    else if (item.type === "mean") question.appendChild(document.createTextNode("What does " + item.left + " mean?"));
    else question.appendChild(document.createTextNode(item.q));
    li.appendChild(question);
    li.appendChild(el("p", { class: "miss-a" }, "You picked " + labelOf(item, picked) + ". Answer: " + answerLabel(item) + "."));
    return li;
  }

  function sortExtra() {
    var wrap = el("div", { class: "sort-extras" });
    wrap.appendChild(el("h2", {}, "Add another word"));
    wrap.appendChild(el("p", { class: "extra-note" }, "Other words with each root."));
    STUDY.roots.forEach(function (root) {
      var row = el("div", { class: "extra sense-" + senseOf(root.id) });
      var head = el("p", { class: "extra-head" });
      head.appendChild(el("strong", {}, root.label));
      head.appendChild(document.createTextNode(" · " + root.meaning));
      row.appendChild(head);
      row.appendChild(el("p", { class: "extra-words" }, (STUDY.extras[root.id] || []).join(" · ")));
      wrap.appendChild(row);
    });
    return wrap;
  }

  function testExtra(misses) {
    var wrap = el("div", { class: "miss-list" });
    if (!misses.length) {
      wrap.appendChild(el("p", {}, "You didn't miss any."));
      return wrap;
    }
    wrap.appendChild(el("h2", {}, "Missed"));
    var list = el("ul", { class: "misses" });
    misses.forEach(function (miss) { list.appendChild(missLine(miss.item, miss.picked)); });
    wrap.appendChild(list);
    return wrap;
  }

  function buildDone(opts) {
    record(opts.mode, { correct: opts.correct, total: opts.total });
    view.textContent = "";
    setChrome(opts.title, opts.correct + " / " + opts.total, "Score", true);
    var screen = el("section", { class: opts.extra ? "done has-extra" : "done simple" });
    var head = el("div", { class: "done-head" });
    var score = el("p", { class: "done-score" }, opts.correct + " / " + opts.total);
    score.setAttribute("aria-label", opts.correct + " out of " + opts.total);
    head.appendChild(score);
    head.appendChild(el("p", { class: "done-note" }, opts.note || scoreNote(opts.correct, opts.total)));
    head.appendChild(el("p", { class: "best-line" }, bestText(opts.mode)));
    screen.appendChild(head);
    if (opts.extra) {
      opts.extra.classList.add("done-extra");
      screen.appendChild(opts.extra);
    }
    screen.appendChild(button("btn primary", "Play again", opts.again));
    view.appendChild(screen);
    queueFocus(score);
    applyFocus(opts.mode + ":done:" + (++roundSerial));
    say("Score " + opts.correct + " out of " + opts.total + ".");
  }

  function runRound(config) {
    var items = config.makeItems();
    var index = 0;
    var correct = 0;
    var misses = [];

    function paint() {
      if (index >= items.length) {
        buildDone({
          mode: config.mode,
          title: config.title,
          correct: correct,
          total: items.length,
          note: config.note ? config.note(correct, items.length) : scoreNote(correct, items.length),
          extra: config.extra ? config.extra(misses, items) : null,
          again: function () { runRound(config); }
        });
        return;
      }
      var item = items[index];
      var answered = false;
      view.textContent = "";
      setChrome(config.title, (index + 1) + " / " + items.length, correct + " right", true);
      var screen = el("section", { class: "quiz" });
      var promptHost = el("div", { class: "prompt-host", tabindex: "-1" });
      promptHost.appendChild(promptFor(item, false));
      var choiceHost = el("div", { class: item.grid ? "q-choices is-grid" : "q-choices" });
      var feedback = el("div", { class: "feedback" });
      feedback.appendChild(el("p", { class: "muted" }, "Tap an answer."));
      var next = button("btn primary", index === items.length - 1 ? "See score" : "Next");
      next.disabled = true;

      item.choices.forEach(function (choice) {
        var className = "choice";
        if (choice.sense) className += " sense-" + choice.sense;
        if (choice.meaning) className += " root-choice";
        var btn = el("button", { type: "button", class: className });
        btn.setAttribute("data-value", choice.value);
        if (choice.meaning) {
          btn.appendChild(el("span", { class: "root-label" }, choice.label));
          btn.appendChild(el("span", { class: "root-mean" }, choice.meaning));
        } else {
          btn.textContent = choice.label;
        }
        btn.addEventListener("click", function () {
          if (answered) return;
          answered = true;
          var ok = choice.value === item.answer;
          if (ok) correct += 1;
          else misses.push({ item: item, picked: choice.value });
          choiceHost.querySelectorAll("button").forEach(function (node) {
            var value = node.getAttribute("data-value");
            if (value === item.answer) node.classList.add("is-right");
            else if (value === choice.value) node.classList.add("is-wrong");
            node.disabled = true;
          });
          feedback.classList.add(ok ? "is-right" : "is-wrong");
          feedback.textContent = "";
          feedback.appendChild(feedbackFor(item, ok));
          promptHost.textContent = "";
          promptHost.appendChild(promptFor(item, true));
          setChrome(config.title, (index + 1) + " / " + items.length, correct + " right", true);
          next.disabled = false;
          say(sayFor(item, ok));
        });
        choiceHost.appendChild(btn);
      });

      next.addEventListener("click", function () {
        if (!answered) return;
        index += 1;
        paint();
      });

      screen.appendChild(promptHost);
      screen.appendChild(choiceHost);
      screen.appendChild(feedback);
      screen.appendChild(next);
      view.appendChild(screen);
      queueFocus(promptHost);
      applyFocus(config.mode + ":" + index);
    }

    paint();
  }

  function renderHome() {
    view.textContent = "";
    setChrome("Latin Roots", "", "", false);
    var screen = el("div", { class: "home" });
    screen.appendChild(el("p", { class: "subtitle" }, STUDY.subtitle));
    var legend = el("p", { class: "legend" });
    legend.appendChild(el("span", { class: "key sense-see" }, "See"));
    legend.appendChild(el("span", { class: "key sense-hear" }, "Hear"));
    legend.appendChild(el("span", { class: "key sense-speak" }, "Speak"));
    screen.appendChild(legend);
    var grid = el("div", { class: "mode-grid" });
    MODES.forEach(function (mode) {
      var link = el("a", { class: "tile", href: "#" + mode.id });
      link.addEventListener("click", function () { cameFromMenu = true; });
      link.appendChild(el("span", { class: "tile-name" }, mode.name));
      link.appendChild(el("span", { class: "tile-blurb" }, mode.blurb));
      link.appendChild(el("span", { class: "tile-best" }, mode.scored ? bestText(mode.id) : "\u00a0"));
      grid.appendChild(link);
    });
    screen.appendChild(grid);
    view.appendChild(screen);
    queueFocus(document.getElementById("top-title"));
    applyFocus("home");
  }

  function learnPageOne() {
    var wrap = el("div", { class: "learn-page" });
    GROUPS.forEach(function (group) {
      var block = el("section", { class: "sense-block" });
      block.appendChild(el("h2", { class: "sense-" + group.sense }, group.title + " · " + group.lesson));
      var pair = el("div", { class: "root-pair" });
      group.ids.forEach(function (id) {
        var root = rootById(id);
        var card = el("div", { class: "root-card sense-" + group.sense });
        card.appendChild(el("p", { class: "rl" }, root.label));
        card.appendChild(el("p", { class: "rm" }, root.meaning));
        card.appendChild(el("p", { class: "rh" }, root.hook));
        pair.appendChild(card);
      });
      block.appendChild(pair);
      wrap.appendChild(block);
    });
    var parts = el("section", { class: "parts-block" });
    parts.appendChild(el("h2", {}, "On the test"));
    STUDY.parts.forEach(function (part) {
      if (!part.test) return;
      var row = el("div", { class: "part-row" });
      var line = el("p", { class: "part-line" });
      line.appendChild(el("strong", {}, part.label));
      line.appendChild(document.createTextNode(" · " + part.meaning));
      row.appendChild(line);
      row.appendChild(el("p", { class: "rh" }, part.hook));
      parts.appendChild(row);
    });
    wrap.appendChild(parts);
    return wrap;
  }

  function learnPageTwo() {
    var wrap = el("div", { class: "learn-page" });
    wrap.appendChild(el("h2", { class: "page-title" }, "Helper parts"));
    wrap.appendChild(el("p", { class: "extra-note" }, "Not on the matching. They help you take a word apart."));
    var list = el("div", { class: "helper-list" });
    STUDY.parts.forEach(function (part) {
      if (part.test) return;
      var row = el("div", { class: "helper" });
      var line = el("p", { class: "part-line" });
      line.appendChild(el("strong", {}, part.label));
      line.appendChild(document.createTextNode(" · " + part.meaning));
      row.appendChild(line);
      row.appendChild(el("p", { class: "rh" }, part.hook));
      row.appendChild(el("p", { class: "examples" }, "Examples: " + part.examples.join(", ")));
      list.appendChild(row);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function renderRoots() {
    var page = 0;
    var serial = ++roundSerial;
    function paint() {
      view.textContent = "";
      setChrome("Roots", (page + 1) + " / 2", "", true);
      var screen = el("section", { class: "learn" });
      var body = el("div", { class: "learn-body", tabindex: "-1" });
      body.appendChild(page === 0 ? learnPageOne() : learnPageTwo());
      var prev = button("btn", "Prev");
      var next = button("btn primary", "Next");
      prev.setAttribute("aria-label", "Previous page");
      next.setAttribute("aria-label", "Next page");
      prev.disabled = page === 0;
      next.disabled = page === 1;
      prev.addEventListener("click", function () {
        if (page === 0) return;
        page -= 1;
        paint();
      });
      next.addEventListener("click", function () {
        if (page === 1) return;
        page += 1;
        paint();
      });
      var pager = el("div", { class: "pager" });
      pager.appendChild(prev);
      pager.appendChild(next);
      screen.appendChild(body);
      screen.appendChild(pager);
      view.appendChild(screen);
      queueFocus(body);
      applyFocus("roots:" + page + ":" + serial);
    }
    paint();
  }

  function renderWords() {
    var deck = shuffle(STUDY.words);
    var filter = "all";
    var index = 0;
    var flipped = false;

    function pool() {
      if (filter === "all") return deck;
      return deck.filter(function (word) { return senseOf(word.root) === filter; });
    }

    function paint(focusCard) {
      var list = pool();
      if (!list.length) return;
      if (index >= list.length) index = 0;
      var entry = list[index];
      var root = rootById(entry.root);
      var sense = senseOf(entry.root);
      view.textContent = "";
      var filterLabel = filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1);
      setChrome("Words", (index + 1) + " / " + list.length, filterLabel, true);
      var screen = el("section", { class: "words" });
      var chips = el("div", { class: "chips" });
      chips.setAttribute("role", "group");
      chips.setAttribute("aria-label", "Filter by sense");
      [["all", "All"], ["see", "See"], ["hear", "Hear"], ["speak", "Speak"]].forEach(function (pair) {
        var chip = button(pair[0] === "all" ? "chip" : "chip sense-" + pair[0], pair[1], function () {
          filter = pair[0];
          index = 0;
          flipped = false;
          paint(true);
        });
        chip.setAttribute("aria-pressed", filter === pair[0] ? "true" : "false");
        if (filter === pair[0]) chip.classList.add("is-on");
        chips.appendChild(chip);
      });

      var card = el("button", { type: "button", class: "card sense-" + sense });
      var front = el("span", { class: "face front" });
      front.appendChild(el("span", { class: "hero-word" }, entry.word));
      front.appendChild(el("span", { class: "pos" }, entry.pos));
      front.appendChild(el("span", { class: "badge sense-" + sense }, root.label));
      front.appendChild(el("span", { class: "flip-hint" }, "Tap to flip"));
      var back = el("span", { class: "face back" });
      back.appendChild(el("span", { class: "back-word" }, entry.word));
      back.appendChild(el("span", { class: "def" }, entry.def));
      var parts = el("span", { class: "parts-line" });
      parts.appendChild(partsFragment(entry.parts, entry.root));
      back.appendChild(parts);
      var example = el("span", { class: "example" });
      example.appendChild(el("span", { class: "ex-label" }, "Example: "));
      example.appendChild(document.createTextNode(entry.sentence));
      back.appendChild(example);
      back.appendChild(el("span", { class: "flip-hint" }, "Tap to flip back"));
      front.hidden = flipped;
      back.hidden = !flipped;
      card.appendChild(front);
      card.appendChild(back);

      function cardLabel() {
        if (flipped) return entry.word + ". " + entry.def + ". Tap to flip back.";
        return entry.word + ", " + entry.pos + ". Root " + root.label + ". Tap to flip.";
      }
      card.setAttribute("aria-label", cardLabel());
      card.addEventListener("click", function () {
        flipped = !flipped;
        front.hidden = flipped;
        back.hidden = !flipped;
        card.setAttribute("aria-label", cardLabel());
        say(flipped ? entry.word + ". " + entry.def : entry.word);
      });

      var prev = button("btn", "Prev", function () {
        if (index === 0) return;
        index -= 1;
        flipped = false;
        paint(true);
      });
      var shuf = button("btn", "Shuffle", function () {
        deck = shuffle(STUDY.words);
        index = 0;
        flipped = false;
        paint(true);
      });
      var next = button("btn primary", "Next", function () {
        if (index >= list.length - 1) return;
        index += 1;
        flipped = false;
        paint(true);
      });
      prev.disabled = index === 0;
      next.disabled = index >= list.length - 1;
      var controls = el("div", { class: "row3" });
      controls.appendChild(prev);
      controls.appendChild(shuf);
      controls.appendChild(next);
      screen.appendChild(chips);
      screen.appendChild(card);
      screen.appendChild(controls);
      view.appendChild(screen);
      if (focusCard) {
        queueFocus(card);
        applyFocus("words:" + filter + ":" + index + ":" + (++roundSerial));
      } else {
        queueFocus(document.getElementById("top-title"));
        applyFocus("words-enter");
      }
    }

    paint(false);
  }

  function renderMatch() {
    var myGen = gen;
    var serial = ++roundSerial;
    var pairs = STUDY.matching.slice();
    var left = shuffle(pairs.map(function (pair) { return pair.left; }));
    var right = shuffle(pairs.map(function (pair) { return pair.right; }));
    var answerOf = {};
    pairs.forEach(function (pair) { answerOf[pair.left] = pair.right; });
    var locked = {};
    var picked = null;
    var tries = 0;
    var leftBtns = {};
    var rightBtns = {};

    view.textContent = "";
    setChrome("Match", "0 / 6", "Tries 0", true);
    var screen = el("section", { class: "match" });
    var grid = el("div", { class: "match-grid" });
    var leftCol = el("div", { class: "match-col" });
    leftCol.setAttribute("role", "group");
    leftCol.setAttribute("aria-label", "Roots and parts");
    leftCol.appendChild(el("span", { class: "col-label" }, "Part"));
    var rightCol = el("div", { class: "match-col" });
    rightCol.setAttribute("role", "group");
    rightCol.setAttribute("aria-label", "Meanings");
    rightCol.appendChild(el("span", { class: "col-label" }, "Meaning"));

    function lockedCount() {
      var n = 0;
      Object.keys(locked).forEach(function (key) { if (locked[key]) n += 1; });
      return n;
    }

    function lockBtn(btn, sense) {
      btn.disabled = true;
      btn.classList.remove("is-picked", "is-flash");
      btn.classList.add("is-locked", "sense-" + sense);
      btn.setAttribute("aria-pressed", "true");
    }

    left.forEach(function (text) {
      var btn = el("button", { type: "button", class: "match-btn" }, text);
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", function () {
        if (locked[text]) return;
        if (picked && leftBtns[picked]) {
          leftBtns[picked].classList.remove("is-picked");
          leftBtns[picked].setAttribute("aria-pressed", "false");
        }
        if (picked === text) {
          picked = null;
          setStatus("Tap left, then its meaning.");
          return;
        }
        picked = text;
        btn.classList.add("is-picked");
        btn.setAttribute("aria-pressed", "true");
        setStatus("Now tap the meaning.");
      });
      leftBtns[text] = btn;
      leftCol.appendChild(btn);
    });

    right.forEach(function (text) {
      var btn = el("button", { type: "button", class: "match-btn" }, text);
      btn.addEventListener("click", function () {
        if (btn.disabled) return;
        if (!picked) {
          setStatus("Tap the left side first.");
          say("Pick the left side first.");
          return;
        }
        tries += 1;
        var leftText = picked;
        var ok = answerOf[leftText] === text;
        var doneCount;
        if (ok) {
          locked[leftText] = true;
          var sense = matchSense(leftText);
          lockBtn(leftBtns[leftText], sense);
          lockBtn(btn, sense);
          picked = null;
          doneCount = lockedCount();
          setChrome("Match", doneCount + " / 6", "Tries " + tries, true);
          setStatus(doneCount === 6 ? "All 6 pairs found." : "Matched.");
          say("Correct. " + leftText + " means " + text + ".");
          if (doneCount === 6) finish();
        } else {
          leftBtns[leftText].classList.add("is-flash");
          btn.classList.add("is-flash");
          leftBtns[leftText].classList.remove("is-picked");
          leftBtns[leftText].setAttribute("aria-pressed", "false");
          picked = null;
          setChrome("Match", lockedCount() + " / 6", "Tries " + tries, true);
          setStatus("Not a match.");
          say("Incorrect. Not a match.");
          window.setTimeout(function () {
            if (gen !== myGen) return;
            leftBtns[leftText].classList.remove("is-flash");
            btn.classList.remove("is-flash");
          }, 500);
        }
      });
      rightBtns[text] = btn;
      rightCol.appendChild(btn);
    });

    var status = el("p", { class: "status" }, "Tap left, then its meaning.");
    var action = el("div", { class: "match-action" });
    function setStatus(text) { status.textContent = text; }
    function finish() {
      record("match", { tries: tries });
      setStatus("All 6 pairs found. " + bestText("match") + ".");
      say("All pairs matched in " + tries + " tries.");
      action.appendChild(button("btn primary", "Play again", renderMatch));
    }
    var foot = el("div", { class: "match-foot" });
    foot.appendChild(status);
    foot.appendChild(action);
    grid.appendChild(leftCol);
    grid.appendChild(rightCol);
    screen.appendChild(grid);
    screen.appendChild(foot);
    view.appendChild(screen);
    queueFocus(document.getElementById("top-title"));
    applyFocus("match:" + serial);
  }

  function stemOf(word) {
    var w = String(word || "").toLowerCase();
    if (w.length >= 5 && /[ey]$/.test(w)) return w.slice(0, -1);
    return w;
  }

  function analyze(sentence, word) {
    var text = String(sentence || "").trim();
    var tokens = text.toLowerCase().match(/[a-z]+/g) || [];
    var full = String(word || "").toLowerCase();
    var stem = stemOf(word);
    var uses = false;
    for (var i = 0; i < tokens.length; i++) {
      if (tokens[i] === full || (stem.length >= 4 && tokens[i].indexOf(stem) === 0)) {
        uses = true;
        break;
      }
    }
    return {
      uses: uses,
      enough: tokens.length >= 6,
      punct: /[.!?]["')\]]*$/.test(text) && /[.!?]/.test(text)
    };
  }

  function renderWrite() {
    var items = shuffle(STUDY.sentences);
    var index = 0;
    var grades = [];

    function paint() {
      if (index >= items.length) {
        var correct = grades.filter(function (grade) { return grade === "yes"; }).length;
        buildDone({
          mode: "write",
          title: "Write it",
          correct: correct,
          total: items.length,
          note: "You marked " + correct + " of " + items.length + " as showing the meaning.",
          again: renderWrite
        });
        return;
      }
      var item = items[index];
      var entry = wordEntry(item.word);
      var root = entry ? rootById(entry.root) : null;
      var grade = null;
      var checked = false;
      var yesCount = grades.filter(function (g) { return g === "yes"; }).length;
      view.textContent = "";
      setChrome("Write it", (index + 1) + " / " + items.length, yesCount + " right", true);
      var screen = el("section", { class: "write" });
      var wordLine = el("div", { class: "word-line", tabindex: "-1" });
      wordLine.appendChild(el("span", { class: "big-word" }, item.word));
      if (entry) wordLine.appendChild(el("span", { class: "pos" }, entry.pos));
      if (root) wordLine.appendChild(el("span", { class: "badge sense-" + senseOf(root.id) }, root.label));
      screen.appendChild(wordLine);
      screen.appendChild(el("p", { class: "def" }, entry ? entry.def : ""));
      var area = el("textarea", { id: "sentence", rows: "3" });
      area.setAttribute("aria-label", "Your sentence using " + item.word);
      area.setAttribute("aria-describedby", "aim");
      area.setAttribute("autocomplete", "off");
      area.setAttribute("spellcheck", "true");
      screen.appendChild(area);
      var hint = el("p", { class: "hint", id: "aim" }, item.check);
      screen.appendChild(hint);
      var checkBtn = button("btn primary", "Check my sentence");
      screen.appendChild(checkBtn);
      var checks = el("ul", { class: "check-list" });
      var liUse = el("li", {}, "Uses the word: —");
      var liLen = el("li", {}, "At least 6 words: —");
      var liPunct = el("li", {}, "Ends with punctuation: —");
      checks.appendChild(liUse);
      checks.appendChild(liLen);
      checks.appendChild(liPunct);
      screen.appendChild(checks);
      var example = el("p", { class: "example" });
      example.appendChild(el("span", { class: "ex-label" }, "Example: "));
      var exText = el("span", {}, "Shows after you check.");
      example.appendChild(exText);
      screen.appendChild(example);
      screen.appendChild(el("p", { class: "self-q" }, "Does yours show what the word means?"));
      var yesBtn = button("btn yn-yes", "Yes");
      var noBtn = button("btn yn-no", "Not yet");
      yesBtn.disabled = true;
      noBtn.disabled = true;
      yesBtn.setAttribute("aria-pressed", "false");
      noBtn.setAttribute("aria-pressed", "false");
      var yn = el("div", { class: "yn" });
      yn.appendChild(yesBtn);
      yn.appendChild(noBtn);
      screen.appendChild(yn);
      var next = button("btn primary", index === items.length - 1 ? "See score" : "Next");
      next.disabled = true;
      screen.appendChild(next);

      function paintChecks(result) {
        liUse.textContent = "Uses the word: " + (result.uses ? "Yes" : "No");
        liLen.textContent = "At least 6 words: " + (result.enough ? "Yes" : "No");
        liPunct.textContent = "Ends with punctuation: " + (result.punct ? "Yes" : "No");
        liUse.className = result.uses ? "pass" : "fail";
        liLen.className = result.enough ? "pass" : "fail";
        liPunct.className = result.punct ? "pass" : "fail";
      }

      checkBtn.addEventListener("click", function () {
        var result = analyze(area.value, item.word);
        checked = true;
        paintChecks(result);
        exText.textContent = entry ? entry.sentence : "";
        yesBtn.disabled = false;
        noBtn.disabled = false;
        var bits = [];
        bits.push(result.uses ? "Uses the word." : "Does not use the word.");
        bits.push(result.enough ? "At least 6 words." : "Fewer than 6 words.");
        bits.push(result.punct ? "Ends with punctuation." : "Does not end with punctuation.");
        say(bits.join(" "));
      });

      area.addEventListener("input", function () {
        if (!checked && !grade) return;
        checked = false;
        grade = null;
        yesBtn.classList.remove("is-picked");
        noBtn.classList.remove("is-picked");
        yesBtn.setAttribute("aria-pressed", "false");
        noBtn.setAttribute("aria-pressed", "false");
        yesBtn.disabled = true;
        noBtn.disabled = true;
        next.disabled = true;
        liUse.textContent = "Uses the word: —";
        liLen.textContent = "At least 6 words: —";
        liPunct.textContent = "Ends with punctuation: —";
        liUse.className = "";
        liLen.className = "";
        liPunct.className = "";
        exText.textContent = "Shows after you check.";
        setChrome("Write it", (index + 1) + " / " + items.length, yesCount + " right", true);
      });

      function pick(which) {
        if (!checked) return;
        grade = which;
        yesBtn.classList.toggle("is-picked", which === "yes");
        noBtn.classList.toggle("is-picked", which === "no");
        yesBtn.setAttribute("aria-pressed", which === "yes" ? "true" : "false");
        noBtn.setAttribute("aria-pressed", which === "no" ? "true" : "false");
        next.disabled = false;
        var shown = yesCount + (which === "yes" ? 1 : 0);
        setChrome("Write it", (index + 1) + " / " + items.length, shown + " right", true);
        say(which === "yes" ? "Marked yes." : "Marked not yet.");
      }
      yesBtn.addEventListener("click", function () { pick("yes"); });
      noBtn.addEventListener("click", function () { pick("no"); });
      next.addEventListener("click", function () {
        if (!grade) return;
        grades.push(grade);
        index += 1;
        paint();
      });

      view.appendChild(screen);
      queueFocus(wordLine);
      applyFocus("write:" + index);
    }

    paint();
  }

  function renderCram() {
    view.textContent = "";
    setChrome("Cram card", "", "", true);
    var screen = el("section", { class: "cram" });
    screen.appendChild(el("h2", {}, "Remember"));
    var tips = el("ul", { class: "tips" });
    STUDY.tips.forEach(function (tip) { tips.appendChild(el("li", {}, tip)); });
    screen.appendChild(tips);
    screen.appendChild(el("h2", {}, "Roots and parts"));
    var table = el("table", { class: "cram-table" });
    table.appendChild(el("caption", { class: "visually-hidden" }, "Six roots and three test parts"));
    var headRow = el("tr");
    headRow.appendChild(el("th", { scope: "col" }, "Part"));
    headRow.appendChild(el("th", { scope: "col" }, "Meaning"));
    table.appendChild(el("thead", {}, headRow));
    var body = el("tbody");
    STUDY.roots.forEach(function (root) {
      var row = el("tr");
      row.appendChild(el("th", { scope: "row", class: "part-name sense-" + senseOf(root.id) }, root.label));
      row.appendChild(el("td", {}, root.meaning));
      body.appendChild(row);
    });
    var group = el("tr");
    group.appendChild(el("td", { colspan: "2", class: "group-label" }, "On the test"));
    body.appendChild(group);
    STUDY.parts.forEach(function (part) {
      if (!part.test) return;
      var row = el("tr");
      row.appendChild(el("th", { scope: "row", class: "part-name part" }, part.label));
      row.appendChild(el("td", {}, part.meaning));
      body.appendChild(row);
    });
    table.appendChild(body);
    screen.appendChild(table);
    view.appendChild(screen);
    queueFocus(document.getElementById("top-title"));
    applyFocus("cram");
  }

  function renderCurrent() {
    gen += 1;
    var mode = currentMode();
    document.body.setAttribute("data-mode", mode);
    if (mode === "home") renderHome();
    else if (mode === "roots") renderRoots();
    else if (mode === "words") renderWords();
    else if (mode === "match") renderMatch();
    else if (mode === "sort") {
      runRound({
        mode: "sort",
        title: "Sort",
        makeItems: function () { return itemsSort(shuffle(STUDY.words)); },
        extra: function () { return sortExtra(); }
      });
    } else if (mode === "synonyms") {
      runRound({
        mode: "synonyms",
        title: "Synonyms",
        makeItems: function () { return itemsSyn(shuffle(STUDY.synonyms)); }
      });
    } else if (mode === "blank") {
      runRound({
        mode: "blank",
        title: "Fill the blank",
        makeItems: function () { return itemsBlank(shuffle(STUDY.context)); }
      });
    } else if (mode === "parts") {
      runRound({
        mode: "parts",
        title: "Word parts",
        makeItems: function () { return itemsParts(shuffle(STUDY.wordParts)); }
      });
    } else if (mode === "write") renderWrite();
    else if (mode === "test") {
      runRound({
        mode: "test",
        title: "Practice test",
        makeItems: makeTest,
        extra: function (misses) { return testExtra(misses); }
      });
    } else if (mode === "cram") renderCram();
  }

  document.getElementById("top-title").tabIndex = -1;
  window.addEventListener("hashchange", renderCurrent);
  renderCurrent();
})();
