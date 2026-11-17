/* 40 Prepositions practice. Facts live in content.js (global STUDY). */
(function () {
  "use strict";

  if (typeof STUDY === "undefined") {
    var missing = document.getElementById("view");
    if (missing) missing.textContent = "Study data did not load.";
    return;
  }

  var KEY = "prepositions-write40";
  var MODES = [
    { id: "learn", label: "Learn" },
    { id: "cards", label: "Flashcards" },
    { id: "write", label: "Write 40" },
  ];

  var view = document.getElementById("view");
  var nav = document.getElementById("desk-nav");
  var mode = "learn";
  var listSet = {};
  var extraSet = {};
  var deck = [];

  STUDY.groups.forEach(function (group) {
    group.words.forEach(function (word, i) {
      listSet[word] = group.letter;
      deck.push({ word: word, letter: group.letter, n: i + 1, of: group.words.length });
    });
  });
  STUDY.extras.forEach(function (word) { extraSet[word] = true; });

  var fc = { queue: deck.slice(), i: 0, up: false, again: {}, got: {}, only: false };
  var written = loadWritten();
  var writeMsg = null;
  var showMissing = false;

  function el(tag, attrs, child) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "class") node.className = attrs[key];
        else if (key.indexOf("on") === 0 && typeof attrs[key] === "function") {
          node.addEventListener(key.slice(2), attrs[key]);
        } else if (attrs[key] != null) node.setAttribute(key, attrs[key]);
      });
    }
    append(node, child);
    return node;
  }

  function append(node, child) {
    if (child == null || child === false) return;
    if (Array.isArray(child)) {
      child.forEach(function (item) { append(node, item); });
      return;
    }
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }

  function say(text) {
    var live = document.getElementById("live");
    if (live) live.textContent = text;
  }

  function hint(word) {
    var blanks = "";
    for (var i = 2; i < word.length; i++) blanks += " _";
    return word.slice(0, 2) + blanks;
  }

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    }
    return copy;
  }

  function pool() {
    return deck.filter(function (card) { return !fc.only || fc.again[card.word]; });
  }

  function current() {
    if (!fc.queue.length) return null;
    if (fc.i >= fc.queue.length) fc.i = 0;
    return fc.queue[fc.i];
  }

  function keys(obj) {
    var n = 0;
    for (var k in obj) if (obj[k]) n += 1;
    return n;
  }

  function loadWritten() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(data)) return [];
      return data.filter(function (word, i) {
        return typeof word === "string" && (listSet[word] || extraSet[word]) && data.indexOf(word) === i;
      });
    } catch (err) { return []; }
  }

  function saveWritten() {
    try { localStorage.setItem(KEY, JSON.stringify(written)); } catch (err) {}
  }

  function paintNav() {
    if (nav.children.length !== MODES.length) {
      nav.textContent = "";
      MODES.forEach(function (item) {
        nav.appendChild(el("button", {
          type: "button",
          "data-mode": item.id,
          onclick: function () { mode = item.id; render(); },
        }, item.label));
      });
    }
    Array.prototype.forEach.call(nav.children, function (button) {
      button.setAttribute("aria-selected", button.getAttribute("data-mode") === mode ? "true" : "false");
    });
  }

  function paintLearn() {
    view.appendChild(el("p", { class: "lede" }, STUDY.quiz));
    view.appendChild(el("p", { class: "trick" }, STUDY.trick));
    var tips = el("section", { class: "tips" }, el("h2", null, "Tricky spellings"));
    var list = el("ul");
    STUDY.tips.forEach(function (tip) { list.appendChild(el("li", null, tip)); });
    tips.appendChild(list);
    view.appendChild(tips);
    STUDY.groups.forEach(function (group) {
      view.appendChild(el("section", { class: "group" }, [
        el("h2", null, group.letter + " · " + group.words.length),
        el("p", { class: "words" }, group.words.join(" · ")),
      ]));
    });
    view.appendChild(el("p", { class: "note" }, "Extras that also count: " + STUDY.extras.join(", ") + "."));
  }

  function paintCards() {
    var card = current();
    view.appendChild(el("p", { class: "counter" }, "Got it " + keys(fc.got) + " · Again " + keys(fc.again)));
    if (!card) {
      view.appendChild(el("p", { class: "empty" }, "No Again cards yet. Mark a card Again, then come back."));
    } else {
      var face = fc.up ? card.word : hint(card.word);
      view.appendChild(el("button", {
        id: "card",
        class: "card",
        type: "button",
        "aria-label": fc.up ? card.word : "Group " + card.letter + ", hint " + face + ". Flip",
        onclick: function () {
          fc.up = !fc.up;
          say(fc.up ? card.word : "Hidden");
          render();
        },
      }, [
        el("span", { class: "kicker" }, "Group " + card.letter + " · " + card.n + " of " + card.of),
        el("span", { class: fc.up ? "big" : "hint" }, face),
      ]));
      view.appendChild(el("p", { class: "counter" }, (fc.i + 1) + " / " + fc.queue.length));
    }
    view.appendChild(el("div", { class: "actions" }, [
      el("button", { type: "button", onclick: function () { step(-1); } }, "Prev"),
      el("button", { type: "button", onclick: function () { step(1); } }, "Next"),
      el("button", { type: "button", onclick: reshuffle }, "Shuffle"),
      el("button", { type: "button", class: "got", onclick: function () { mark("got"); } }, "Got it"),
      el("button", { type: "button", class: "again", onclick: function () { mark("again"); } }, "Again"),
      el("button", {
        type: "button",
        "aria-pressed": fc.only ? "true" : "false",
        onclick: function () {
          fc.only = !fc.only;
          fc.queue = pool();
          fc.i = 0;
          fc.up = false;
          render();
        },
      }, "Study again only"),
    ]));
  }

  function step(dir) {
    if (!fc.queue.length) return;
    fc.i = (fc.i + dir + fc.queue.length) % fc.queue.length;
    fc.up = false;
    render();
  }

  function mark(kind) {
    var card = current();
    if (!card) return;
    if (kind === "again") { fc.again[card.word] = true; delete fc.got[card.word]; }
    else { fc.got[card.word] = true; delete fc.again[card.word]; }
    if (kind === "got" && fc.only) {
      fc.queue.splice(fc.i, 1);
      if (fc.i >= fc.queue.length) fc.i = 0;
    } else if (fc.queue.length) fc.i = (fc.i + 1) % fc.queue.length;
    fc.up = false;
    render();
  }

  function reshuffle() {
    fc.queue = shuffle(pool());
    fc.i = 0;
    fc.up = false;
    render();
  }

  function paintWrite() {
    var count = written.length;
    var hits = {};
    STUDY.groups.forEach(function (group) { hits[group.letter] = 0; });
    written.forEach(function (word) { if (listSet[word]) hits[listSet[word]] += 1; });

    view.appendChild(el("p", { class: "lede" }, "Type a preposition and press Enter. Spelling counts."));
    view.appendChild(el("div", { class: "score" }, [
      el("span", null, count + " / 40"),
      el("span", null, count >= 40 ? "Ready" : "Keep going"),
    ]));
    view.appendChild(el("div", {
      class: "bar",
      role: "progressbar",
      "aria-valuemin": "0",
      "aria-valuemax": "40",
      "aria-valuenow": String(Math.min(count, 40)),
    }, el("span", { style: "width:" + Math.min(100, (count / 40) * 100) + "%" })));
    if (count >= 40) view.appendChild(el("p", { class: "party" }, "40! You can write a full list for Friday."));

    var form = el("form", { class: "add-row" }, [
      el("input", {
        id: "word-box",
        type: "text",
        autocomplete: "off",
        autocapitalize: "off",
        autocorrect: "off",
        spellcheck: "false",
        "aria-label": "Preposition",
      }),
      el("button", { type: "submit" }, "Add"),
    ]);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      addWord(form.querySelector("input").value);
    });
    view.appendChild(form);
    if (writeMsg) view.appendChild(el("p", { class: "msg " + writeMsg.kind }, writeMsg.text));

    var chips = el("ul", { class: "chips" });
    written.forEach(function (word) {
      var extra = !!extraSet[word];
      chips.appendChild(el("li", { class: extra ? "chip extra" : "chip" }, extra
        ? [word, el("small", null, "extra")]
        : word));
    });
    view.appendChild(chips);

    var letters = el("div", { class: "letters" });
    STUDY.groups.forEach(function (group) {
      var n = hits[group.letter];
      letters.appendChild(el("span", {
        class: n === group.words.length ? "pill done" : "pill",
      }, group.letter + " " + n + "/" + group.words.length));
    });
    view.appendChild(letters);

    if (showMissing) {
      var box = el("div", { class: "missing" });
      var any = false;
      STUDY.groups.forEach(function (group) {
        var left = group.words.filter(function (word) { return written.indexOf(word) === -1; });
        if (!left.length) return;
        any = true;
        box.appendChild(el("p", null, group.letter + ": " + left.join(", ")));
      });
      if (!any) box.appendChild(el("p", null, "Nothing missing from the list of 40."));
      view.appendChild(box);
    }

    view.appendChild(el("div", { class: "tools" }, [
      el("button", { type: "button", class: "text-btn", onclick: function () {
        showMissing = !showMissing;
        render();
      } }, showMissing ? "Hide missing" : "Show missing"),
      el("button", { type: "button", class: "text-btn", onclick: function () {
        written = [];
        writeMsg = null;
        showMissing = false;
        saveWritten();
        render();
      } }, "Start over"),
    ]));

    var boxInput = document.getElementById("word-box");
    if (boxInput) boxInput.focus();
  }

  function addWord(raw) {
    var word = String(raw || "").trim().toLowerCase();
    if (!word) return;
    if (written.indexOf(word) !== -1) writeMsg = { kind: "dup", text: "Already have it" };
    else if (listSet[word]) {
      written.push(word);
      writeMsg = { kind: "ok", text: word };
      saveWritten();
    } else if (extraSet[word]) {
      written.push(word);
      writeMsg = { kind: "extra", text: word + " (extra)" };
      saveWritten();
    } else writeMsg = { kind: "bad", text: "Not a preposition on the list — check the spelling" };
    say(writeMsg.text);
    render();
  }

  function render() {
    paintNav();
    view.textContent = "";
    if (mode === "learn") paintLearn();
    else if (mode === "cards") paintCards();
    else paintWrite();
  }

  document.addEventListener("keydown", function (event) {
    if (mode !== "cards") return;
    var tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      step(event.key === "ArrowRight" ? 1 : -1);
    } else if (event.key === " " && tag !== "BUTTON") {
      event.preventDefault();
      if (!current()) return;
      fc.up = !fc.up;
      say(fc.up ? current().word : "Hidden");
      render();
    }
  });

  var offline = document.getElementById("offline");
  if (window.StudyOffline && offline) window.StudyOffline.mount(offline);
  render();
})();
