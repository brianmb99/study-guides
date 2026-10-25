/* Renaissance Test Prep — routing and study modes.
   Nothing is saved. Progress lives only until the page is closed. */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    learnI: 0,
    cards: { deck: "all", order: null, i: 0, flipped: false },
    blanks: { queue: null, i: 0, revealed: false, hint: false, finished: false },
    vocab: {
      tab: "flip",
      dir: "word",
      flip: { queue: null, i: 0, flipped: false, finished: false },
      match: { round: null, i: 0, picks: {}, firstCorrect: 0, missed: [], tried: {}, phase: "ask", total: 0 },
      spell: { round: null, i: 0, firstCorrect: 0, missed: [], tried: {}, phase: "ask", total: 0 },
    },
    quiz: { round: null, i: 0, picks: {}, correct: 0, missed: [], phase: "ask" },
    artI: 0,
    artRevealed: false,
    map: {
      mode: "learn",
      selected: "florence",
      order: null,
      step: 0,
      locked: false,
      picked: null,
      score: 0,
      over: false,
      choices: null,
    },
    essayI: 0,
  };

  let actions = { prev: null, next: null, primary: null };
  let lastPath = null;
  let renderToken = 0;
  let toTop = false;

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
      ["/cards", "Flashcards"],
      ["/blanks", "Fill-in-the-Blank"],
      ["/vocab", "Vocab"],
      ["/art", "Art ID"],
      ["/map", "Map"],
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

  function currentPath() {
    let raw = (location.hash || "").replace(/^#/, "");
    if (!raw || raw === "/") return "/";
    if (!raw.startsWith("/")) raw = "/" + raw;
    return raw.split("?")[0].replace(/\/+$/, "") || "/";
  }

  function pinPercent(place) {
    return {
      x: ((place.lon - 6.2) / 12.8) * 100,
      y: ((47.4 - place.lat) / 12.1) * 100,
    };
  }

  function placeById(id) {
    return STUDY.places.find((place) => place.id === id);
  }

  /* ---------- views ---------- */

  function renderHome(view) {
    chrome("Renaissance Test Prep", "");
    view.appendChild(
      para(
        "Test Tuesday, October 27. This page quizzes you and teaches you on the same tap. Short sentences. Lots of repeats. You can do this."
      )
    );
    view.appendChild(
      h(
        "p",
        { class: "quiet" },
        "20–30 minutes a day until Tuesday beats one long cram. The plan is below the list."
      )
    );

    const tiles = [
      ["#/learn", "Crash Course", "The big story in 12 short cards."],
      ["#/cards", "Flashcards", "Every fact, front and back."],
      ["#/blanks", "Fill-in-the-Blank", "The worksheet sentences, exact."],
      ["#/vocab", "Vocab", "All " + STUDY.glossary.length + " textbook glossary words. Flip, then match."],
      ["#/art", "Art ID", "Name the work, then learn the clues."],
      ["#/map", "Map", "Rome, Florence, Venice, and two seas."],
      ["#/quiz", "Quiz", "15 questions a round. Misses come back."],
      ["#/essays", "Essays", "A checklist, a recipe, and a sample."],
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
    view.appendChild(
      h(
        "p",
        { class: "quiet" },
        "Nothing is saved on this device. If you close the tab, just start the round again."
      )
    );
    view.appendChild(h("a", { class: "credits-link", href: "../" }, "All study guides"));
    view.appendChild(h("a", { class: "credits-link", href: "#/credits" }, "Image credits"));
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

  function cardPool(deck) {
    if (deck === "all" || deck === "flip") return STUDY.cards;
    return STUDY.cards.filter((card) => card.cat === deck);
  }

  function setDeck(deck) {
    state.cards.deck = deck;
    state.cards.order = cardPool(deck).map((card) => card.id);
    state.cards.i = 0;
    state.cards.flipped = false;
    render();
  }

  function currentCard() {
    const order = state.cards.order;
    if (!order || !order.length) return null;
    return STUDY.cards.find((card) => card.id === order[state.cards.i]) || null;
  }

  function toggleFlip() {
    const card = currentCard();
    if (!card) return;
    state.cards.flipped = !state.cards.flipped;
    const el = document.querySelector(".flip-card");
    if (!el) {
      render();
      return;
    }
    el.classList.toggle("is-flipped", state.cards.flipped);
    const front = el.querySelector(".flip-front");
    const back = el.querySelector(".flip-back");
    if (front) front.setAttribute("aria-hidden", state.cards.flipped ? "true" : "false");
    if (back) back.setAttribute("aria-hidden", state.cards.flipped ? "false" : "true");
    const primary = document.querySelector(".bottombar .bar-btn.primary");
    if (primary) primary.textContent = state.cards.flipped ? "Flip back" : "Flip";
    if (state.cards.flipped) say(card.answer + ". " + card.hook);
  }

function renderCards(view) {
  if (!state.cards.order) {
    state.cards.order = cardPool(state.cards.deck).map((card) => card.id);
  }
    const order = state.cards.order;
    if (!order.length) {
      chrome("Flashcards", "0");
      view.appendChild(h("p", null, "This deck is empty."));
      setBar([{ label: "All cards", primary: true, top: true, on: () => setDeck("all") }]);
      return;
    }
    state.cards.i = clamp(state.cards.i, 0, order.length - 1);
    const card = currentCard();
    const flipMode = state.cards.deck === "flip";
    chrome("Flashcards", state.cards.i + 1 + " / " + order.length);

    const chips = h("div", { class: "chips", role: "group", "aria-label": "Decks" });
    [
      ["all", "All"],
      ["people", "People"],
      ["places", "Places"],
      ["terms", "Terms"],
      ["art", "Art"],
      ["flip", "Flip it"],
    ].forEach((pair) => {
      const button = h(
        "button",
        { type: "button", class: state.cards.deck === pair[0] ? "chip is-on" : "chip" },
        pair[1]
      );
      button.setAttribute("aria-pressed", state.cards.deck === pair[0] ? "true" : "false");
      button.addEventListener("click", () => setDeck(pair[0]));
      chips.appendChild(button);
    });
    view.appendChild(chips);
    const shuffleBtn = h("button", { type: "button", class: "text-btn" }, "Shuffle");
    shuffleBtn.addEventListener("click", () => {
      state.cards.order = shuffle(order);
      state.cards.i = 0;
      state.cards.flipped = false;
      render();
    });
    view.appendChild(h("div", { class: "row-actions" }, shuffleBtn));

    const scene = h("div", { class: "flip-scene" });
    const flip = h("div", {
      class: state.cards.flipped ? "flip-card is-flipped" : "flip-card",
    });
    const front = h("div", {
      class: "flip-face flip-front",
      "aria-hidden": state.cards.flipped ? "true" : "false",
    });
    const back = h("div", {
      class: "flip-face flip-back",
      "aria-hidden": state.cards.flipped ? "false" : "true",
    });

    if (!flipMode && card.image) front.appendChild(figure(card.image, card.alt, "Artwork"));
    front.appendChild(h("p", { class: "prompt" }, flipMode ? card.define : card.front));
    front.appendChild(h("p", { class: "quiet tap-hint" }, "Tap the card to flip."));

    back.appendChild(h("p", { class: "answer" }, card.answer));
    if (flipMode && card.image) back.appendChild(figure(card.image, card.alt, card.answer));
    back.appendChild(teachBox(card.connection, card.hook));
    back.appendChild(h("p", { class: "quiet tap-hint" }, "Tap to flip back."));

    flip.appendChild(front);
    flip.appendChild(back);
    flip.addEventListener("click", () => {
      if (swallowClick) {
        swallowClick = false;
        return;
      }
      toggleFlip();
    });
    scene.appendChild(flip);
    view.appendChild(scene);

    const go = (delta) => {
      const next = state.cards.i + delta;
      if (next < 0 || next >= order.length) return;
      state.cards.i = next;
      state.cards.flipped = false;
      render();
    };
    actions.prev = () => go(-1);
    actions.next = () => go(1);
    actions.primary = toggleFlip;
    setBar([
      { label: "Prev", disabled: state.cards.i === 0, on: actions.prev },
      { label: state.cards.flipped ? "Flip back" : "Flip", primary: true, on: toggleFlip },
      { label: "Next", disabled: state.cards.i === order.length - 1, on: actions.next },
    ]);
  }

  function freshBlanks() {
    state.blanks.queue = shuffle(STUDY.blanks.map((item) => Object.assign({}, item, { got: false })));
    state.blanks.i = 0;
    state.blanks.revealed = false;
    state.blanks.hint = false;
    state.blanks.finished = false;
  }

  function blankAnswers(item) {
    return item.parts.filter((part) => typeof part !== "string");
  }

  function renderBlanks(view) {
    if (!state.blanks.queue) freshBlanks();
    const queue = state.blanks.queue;
    const locked = queue.filter((item) => item.got).length;
    chrome("Fill-in-the-Blank", locked + " / " + queue.length);

    if (state.blanks.finished) {
      view.appendChild(h("h2", null, "Every sentence is locked in."));
      view.appendChild(
        h(
          "p",
          null,
          "That is the vocab section. Run them once more in the morning if you want them automatic."
        )
      );
      const again = () => {
        freshBlanks();
        render();
      };
      actions.primary = again;
      setBar([{ label: "Practice again", primary: true, top: true, on: again }]);
      return;
    }

    const item = queue[state.blanks.i];
    view.appendChild(
      h(
        "p",
        { class: "quiet" },
        "These are the worksheet lines. Hint, then the answer, then decide if it stuck."
      )
    );
    const shuffleBtn = h("button", { type: "button", class: "text-btn" }, "Shuffle");
    shuffleBtn.addEventListener("click", () => {
      state.blanks.queue = shuffle(queue);
      state.blanks.i = 0;
      state.blanks.revealed = false;
      state.blanks.hint = false;
      render();
    });
    view.appendChild(h("div", { class: "row-actions" }, shuffleBtn));
    view.appendChild(h("p", { class: "quiet" }, "Card " + (state.blanks.i + 1) + " of " + queue.length));
    if (item.got) view.appendChild(h("p", null, h("span", { class: "locked-pill" }, "Locked in")));

    const sentence = h("p", { class: "blank-sentence" });
    item.parts.forEach((part) => {
      if (typeof part === "string") {
        sentence.appendChild(document.createTextNode(part));
        return;
      }
      const slot = h(
        "span",
        { class: state.blanks.revealed ? "blank filled" : "blank" },
        state.blanks.revealed ? part.answer : "________"
      );
      sentence.appendChild(slot);
    });
    view.appendChild(h("div", { class: "panel" }, sentence));

    if (state.blanks.hint && !state.blanks.revealed) {
      const hints = h("ul", { class: "hint-list" });
      blankAnswers(item).forEach((part, index) => {
        const label = blankAnswers(item).length > 1 ? "Blank " + (index + 1) + ": " : "Hint: ";
        hints.appendChild(h("li", null, label + part.hint));
      });
      view.appendChild(hints);
    }

    if (state.blanks.revealed) {
      view.appendChild(h("p", null, item.explain));
      const got = h("button", { type: "button", class: "got" }, "Got it");
      const later = h("button", { type: "button" }, "Not yet");
      got.addEventListener("click", () => run(() => markBlank(true), true));
      later.addEventListener("click", () => run(() => markBlank(false), true));
      view.appendChild(h("div", { class: "pair" }, [got, later]));
    }

    const show = () => {
      state.blanks.revealed = true;
      state.blanks.hint = false;
      say(item.explain);
      render();
    };
    const showHint = () => {
      state.blanks.hint = true;
      render();
    };
    if (!state.blanks.revealed) {
      const hintBtn = h("button", { type: "button", class: "text-btn" }, "Hint");
      hintBtn.addEventListener("click", showHint);
      view.appendChild(h("div", { class: "row-actions" }, hintBtn));
    }

    const go = (delta) => {
      const next = state.blanks.i + delta;
      if (next < 0 || next >= queue.length) return;
      state.blanks.i = next;
      state.blanks.revealed = false;
      state.blanks.hint = false;
      render();
    };
    actions.prev = () => go(-1);
    actions.next = () => go(1);
    actions.primary = state.blanks.revealed ? actions.next : show;
    setBar([
      { label: "Prev", disabled: state.blanks.i === 0, on: actions.prev },
      {
        label: state.blanks.revealed ? "Next" : "Show answer",
        primary: true,
        on: state.blanks.revealed ? actions.next : show,
        disabled: state.blanks.revealed && state.blanks.i === queue.length - 1,
      },
      {
        label: "Next",
        disabled: state.blanks.revealed || state.blanks.i === queue.length - 1,
        on: actions.next,
      },
    ]);
    if (state.blanks.revealed) {
      setBar([
        { label: "Prev", disabled: state.blanks.i === 0, on: actions.prev },
        { label: "Next", primary: true, disabled: state.blanks.i === queue.length - 1, on: actions.next },
      ]);
    }
  }

  function markBlank(got) {
    const queue = state.blanks.queue;
    const index = state.blanks.i;
    if (got) {
      queue[index].got = true;
      if (queue.every((item) => item.got)) {
        state.blanks.finished = true;
        say("Every worksheet sentence is locked in.");
        render();
        return;
      }
      let next = index;
      for (let n = 0; n < queue.length; n += 1) {
        next = (next + 1) % queue.length;
        if (!queue[next].got) break;
      }
      state.blanks.i = next;
    } else {
      const [item] = queue.splice(index, 1);
      item.got = false;
      queue.push(item);
      state.blanks.i = index >= queue.length ? 0 : index;
      say("Not yet. It will come back in a minute.");
    }
    state.blanks.revealed = false;
    state.blanks.hint = false;
    render();
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

  function renderArt(view) {
    const items = STUDY.art;
    state.artI = clamp(state.artI, 0, items.length - 1);
    const item = items[state.artI];
    chrome("Art ID", state.artI + 1 + " / " + items.length);
    const lead = h("div", { class: "art-lead" });
    if (item.bonus) lead.appendChild(h("p", { class: "banner" }, "Bonus — may be in your book"));
    lead.appendChild(h("p", { class: "prompt" }, item.prompt));

    if (item.kind === "compare") {
      const layout = h("div", { class: "art-compare" });
      layout.appendChild(lead);
      const grid = h("div", { class: "compare-grid" });
      grid.appendChild(compareFigure(item.left));
      grid.appendChild(compareFigure(item.right));
      layout.appendChild(grid);
      if (state.artRevealed) {
        if (item.also) layout.appendChild(h("div", { class: "compare-also" }, compareFigure(item.also)));
        const lists = h("div", { class: "compare-lists" });
        const medieval = h("div", { class: "compare-col" });
        medieval.appendChild(h("h3", null, "Middle Ages"));
        medieval.appendChild(listOf("ul", "checklist", item.medieval));
        const renaissance = h("div", { class: "compare-col" });
        renaissance.appendChild(h("h3", null, "Renaissance"));
        renaissance.appendChild(listOf("ul", "checklist", item.renaissance));
        lists.append(medieval, renaissance);
        layout.appendChild(lists);
        layout.appendChild(teachBox(item.connection, item.hook));
      }
      view.appendChild(layout);
    } else {
      const split = h("div", { class: "art-split" });
      split.appendChild(lead);
      const fallback = state.artRevealed ? item.title : "Image";
      split.appendChild(figure(item.file, item.alt, fallback));
      if (state.artRevealed) {
        const reveal = h("div", { class: "art-reveal" });
        reveal.appendChild(h("h2", null, item.title));
        if (item.kind === "place") {
          reveal.appendChild(h("p", null, "This is a city, not a painting."));
        } else if (item.artist) {
          const line = h("p");
          line.appendChild(h("strong", null, "Artist: "));
          line.appendChild(document.createTextNode(item.artist));
          reveal.appendChild(line);
        }
        const where = h("p");
        where.appendChild(h("strong", null, "Place: "));
        where.appendChild(document.createTextNode(item.place));
        reveal.appendChild(where);
        reveal.appendChild(h("h3", null, "How to recognize it"));
        reveal.appendChild(listOf("ul", "clues", item.clues));
        reveal.appendChild(teachBox(item.connection, item.hook));
        split.appendChild(reveal);
      }
      view.appendChild(split);
    }

    const reveal = () => {
      state.artRevealed = true;
      say(item.title || "Here is the comparison.");
      render();
    };
    const go = (delta) => {
      const next = state.artI + delta;
      if (next < 0 || next >= items.length) return;
      state.artI = next;
      state.artRevealed = false;
      render();
    };
    actions.prev = () => go(-1);
    actions.next = () => go(1);
    actions.primary = state.artRevealed ? actions.next : reveal;
    setBar([
      { label: "Prev", disabled: state.artI === 0, on: actions.prev },
      {
        label: state.artRevealed ? "Next" : "Reveal",
        primary: true,
        disabled: state.artRevealed && state.artI === items.length - 1,
        on: state.artRevealed ? actions.next : reveal,
      },
      {
        label: "Next",
        disabled: state.artRevealed || state.artI === items.length - 1,
        on: actions.next,
      },
    ]);
    if (state.artRevealed) {
      setBar([
        { label: "Prev", disabled: state.artI === 0, on: actions.prev },
        { label: "Next", primary: true, disabled: state.artI === items.length - 1, on: actions.next },
      ]);
    }
  }

  function compareFigure(info) {
    const card = h("div", { class: "compare-card" });
    card.appendChild(h("h3", null, info.label));
    card.appendChild(figure(info.file, info.alt, info.label));
    return card;
  }

  function listOf(tag, className, items) {
    const list = h(tag, { class: className });
    items.forEach((text) => list.appendChild(h("li", null, text)));
    return list;
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
      const button = h("button", {
        type: "button",
        role: "tab",
        "aria-selected": state.map.mode === pair[0] ? "true" : "false",
      }, pair[1]);
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
    tips.appendChild(h("summary", null, "Boot tips"));
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
  }

  function renderMapCanvas(options) {
    const wrap = h("div", { class: "map-wrap" });
    const img = h("img", { class: "map-img", alt: STUDY.map.alt });
    const ready = () => img.classList.add("is-ready");
    img.addEventListener("load", ready);
    img.addEventListener("error", () => {
      img.remove();
      wrap.insertBefore(h("div", { class: "map-missing" }, "Italy map"), wrap.firstChild);
    });
    img.src = STUDY.map.src;
    if (img.complete && img.naturalWidth > 0) ready();
    wrap.appendChild(img);

    const layer = h("div", { class: options.blind ? "pin-layer is-blind" : "pin-layer" });
    STUDY.places.forEach((place) => {
      const pos = pinPercent(place);
      const button = h("button", {
        type: "button",
        class: "pin pin-" + place.kind + " label-" + place.label + (options.classFor ? " " + options.classFor(place) : ""),
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
    lead.appendChild(h("p", null, "Tap a pin. Filled dots are cities. Square rings are seas."));
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
          ? "You can place all five. Do it once more in the morning."
          : "Look again at any place that slipped. The boot shape is the whole trick."
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
      article.appendChild(h("h3", null, "Paragraph recipe"));
      article.appendChild(listOf("ol", "recipe", essay.recipe));
      if (essay.starters) {
        article.appendChild(h("h3", null, "Ways to start your opinion"));
        article.appendChild(listOf("ul", "starters", essay.starters));
      }
      const details = h("details", { class: "sample" });
      details.appendChild(
        h("summary", null, "Sample paragraph. Read it, then write your own in your own words.")
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

  /* ---------- Glossary vocab ---------- */

  function normWord(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u2010-\u2015-]/g, " ")
      .replace(/["'\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F\u00AB\u00BB\u2039\u203A`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function vocabTeach(entry) {
    const box = h("div", { class: "teach" });
    box.appendChild(para("**" + entry.word + "** (" + entry.pos + ") — " + entry.def));
    return box;
  }

  function appendMissed(view, items) {
    if (!items.length) return;
    view.appendChild(h("h3", null, "Missed"));
    const ul = h("ul", { class: "missed-list" });
    items.forEach((item) => ul.appendChild(h("li", null, item.word + " — " + item.def)));
    view.appendChild(ul);
  }

  function vocabChoices(entry) {
    const others = STUDY.glossary.filter((item) => item.id !== entry.id);
    const same = shuffle(others.filter((item) => item.pos === entry.pos));
    const rest = shuffle(others.filter((item) => item.pos !== entry.pos));
    const distractors = (same.length >= 3 ? same : same.concat(rest)).slice(0, 3);
    return shuffle([entry.word].concat(distractors.map((item) => item.word)));
  }

  function matchQuestion(entry) {
    return {
      id: entry.id,
      word: entry.word,
      pos: entry.pos,
      def: entry.def,
      page: entry.page,
      choices: vocabChoices(entry),
    };
  }

  function spellQuestion(entry) {
    return {
      id: entry.id,
      word: entry.word,
      pos: entry.pos,
      def: entry.def,
      page: entry.page,
      typed: "",
      checked: false,
      ok: false,
      revealed: false,
    };
  }

  function resetVocabFlip() {
    state.vocab.flip = {
      queue: STUDY.glossary.map((item) => ({
        id: item.id,
        word: item.word,
        pos: item.pos,
        def: item.def,
        page: item.page,
        got: false,
      })),
      i: 0,
      flipped: false,
      finished: false,
    };
  }

  function startVocabMatch(all) {
    const count = all ? STUDY.glossary.length : Math.min(10, STUDY.glossary.length);
    const source = shuffle(STUDY.glossary).slice(0, count);
    state.vocab.match = {
      round: source.map(matchQuestion),
      i: 0,
      picks: {},
      firstCorrect: 0,
      missed: [],
      tried: {},
      phase: source.length ? "ask" : "done",
      total: source.length,
    };
  }

  function startVocabSpell() {
    const source = shuffle(STUDY.glossary).slice(0, Math.min(10, STUDY.glossary.length));
    state.vocab.spell = {
      round: source.map(spellQuestion),
      i: 0,
      firstCorrect: 0,
      missed: [],
      tried: {},
      phase: source.length ? "ask" : "done",
      total: source.length,
    };
  }

  function renderVocab(view) {
    const segment = h("div", { class: "segment", role: "tablist", "aria-label": "Vocab mode" });
    [
      ["flip", "Flip"],
      ["match", "Match"],
      ["spell", "Spell it"],
    ].forEach((pair) => {
      const button = h("button", {
        type: "button",
        role: "tab",
        "aria-selected": state.vocab.tab === pair[0] ? "true" : "false",
      }, pair[1]);
      button.addEventListener("click", () => {
        if (state.vocab.tab === pair[0]) return;
        state.vocab.tab = pair[0];
        if (pair[0] === "flip") resetVocabFlip();
        else if (pair[0] === "match") startVocabMatch(false);
        else startVocabSpell();
        render();
      });
      segment.appendChild(button);
    });
    view.appendChild(segment);
    if (state.vocab.tab === "match") renderVocabMatch(view);
    else if (state.vocab.tab === "spell") renderVocabSpell(view);
    else renderVocabFlip(view);
  }

  function toggleVocabFlip() {
    const flip = state.vocab.flip;
    if (!flip.queue || flip.finished) return;
    flip.flipped = !flip.flipped;
    const entry = flip.queue[flip.i];
    if (flip.flipped && entry) {
      say(state.vocab.dir === "def" ? entry.word + ". " + entry.def : entry.def);
    }
    render();
  }

  function markVocab(got) {
    const flip = state.vocab.flip;
    const queue = flip.queue;
    const index = flip.i;
    if (got) {
      queue[index].got = true;
      if (queue.every((item) => item.got)) {
        flip.finished = true;
        say("Every glossary word is locked in.");
        render();
        return;
      }
      let next = index;
      for (let n = 0; n < queue.length; n += 1) {
        next = (next + 1) % queue.length;
        if (!queue[next].got) break;
      }
      flip.i = next;
    } else {
      const [item] = queue.splice(index, 1);
      item.got = false;
      queue.push(item);
      flip.i = index >= queue.length ? 0 : index;
      say("Not yet. It will come back in a minute.");
    }
    flip.flipped = false;
    render();
  }

  function renderVocabFlip(view) {
    if (!state.vocab.flip.queue) resetVocabFlip();
    const flip = state.vocab.flip;
    const queue = flip.queue;
    const known = queue.filter((item) => item.got).length;
    chrome("Glossary Vocab", known + " / " + queue.length);

    if (flip.finished) {
      view.appendChild(h("h2", null, "Every word is locked in."));
      view.appendChild(
        h("p", null, "That is the glossary. Run them once more in the morning if you want them automatic.")
      );
      const again = () => {
        resetVocabFlip();
        render();
      };
      actions.primary = again;
      setBar([{ label: "Practice again", primary: true, top: true, on: again }]);
      return;
    }

    flip.i = clamp(flip.i, 0, queue.length - 1);
    const entry = queue[flip.i];
    view.appendChild(
      h("p", { class: "quiet" }, "Flip the card. Got it locks it in. Not yet sends it to the back of the line.")
    );

    const chips = h("div", { class: "chips", role: "group", "aria-label": "Card direction" });
    [
      ["word", "Word first"],
      ["def", "Definition first"],
    ].forEach((pair) => {
      const button = h(
        "button",
        { type: "button", class: state.vocab.dir === pair[0] ? "chip is-on" : "chip" },
        pair[1]
      );
      button.setAttribute("aria-pressed", state.vocab.dir === pair[0] ? "true" : "false");
      button.addEventListener("click", () => {
        state.vocab.dir = pair[0];
        flip.flipped = false;
        render();
      });
      chips.appendChild(button);
    });
    view.appendChild(chips);

    const shuffleBtn = h("button", { type: "button", class: "text-btn" }, "Shuffle");
    shuffleBtn.addEventListener("click", () => {
      flip.queue = shuffle(queue);
      flip.i = 0;
      flip.flipped = false;
      render();
    });
    view.appendChild(h("div", { class: "row-actions" }, shuffleBtn));
    view.appendChild(h("p", { class: "quiet" }, "Card " + (flip.i + 1) + " of " + queue.length));
    if (entry.got) view.appendChild(h("p", null, h("span", { class: "locked-pill" }, "Locked in")));

    const wordFirst = state.vocab.dir !== "def";
    const scene = h("div", { class: "flip-scene" });
    const card = h("div", { class: flip.flipped ? "flip-card is-flipped" : "flip-card" });
    const front = h("div", {
      class: "flip-face flip-front",
      "aria-hidden": flip.flipped ? "true" : "false",
    });
    const back = h("div", {
      class: "flip-face flip-back",
      "aria-hidden": flip.flipped ? "false" : "true",
    });
    if (wordFirst) {
      front.appendChild(h("p", { class: "prompt" }, entry.word));
      front.appendChild(h("p", { class: "quiet" }, entry.pos));
      back.appendChild(h("p", { class: "answer" }, entry.def));
      back.appendChild(h("p", { class: "quiet" }, "Textbook page " + entry.page));
    } else {
      front.appendChild(h("p", { class: "prompt" }, entry.def));
      back.appendChild(h("p", { class: "answer" }, entry.word));
      back.appendChild(h("p", { class: "quiet" }, entry.pos));
      back.appendChild(h("p", { class: "quiet" }, "Textbook page " + entry.page));
    }
    front.appendChild(h("p", { class: "quiet tap-hint" }, "Tap the card to flip."));
    back.appendChild(h("p", { class: "quiet tap-hint" }, "Tap to flip back."));
    card.appendChild(front);
    card.appendChild(back);
    card.addEventListener("click", () => {
      if (swallowClick) {
        swallowClick = false;
        return;
      }
      toggleVocabFlip();
    });
    scene.appendChild(card);
    view.appendChild(scene);

    if (flip.flipped) {
      const got = h("button", { type: "button", class: "got" }, "Got it");
      const later = h("button", { type: "button" }, "Not yet");
      got.addEventListener("click", () => run(() => markVocab(true), true));
      later.addEventListener("click", () => run(() => markVocab(false), true));
      view.appendChild(h("div", { class: "pair" }, [got, later]));
    }

    const go = (delta) => {
      const next = flip.i + delta;
      if (next < 0 || next >= queue.length) return;
      flip.i = next;
      flip.flipped = false;
      render();
    };
    actions.prev = () => go(-1);
    actions.next = () => go(1);
    actions.primary = toggleVocabFlip;
    setBar([
      { label: "Prev", disabled: flip.i === 0, on: actions.prev },
      { label: flip.flipped ? "Flip back" : "Flip", primary: true, on: toggleVocabFlip },
      { label: "Next", disabled: flip.i === queue.length - 1, on: actions.next },
    ]);
  }

  function pickVocab(choice) {
    const match = state.vocab.match;
    const i = match.i;
    if (match.picks[i]) return;
    const q = match.round[i];
    match.picks[i] = choice;
    const right = choice === q.word;
    const first = !match.tried[q.id];
    match.tried[q.id] = true;
    if (right) {
      if (first) match.firstCorrect += 1;
      say("Yes. " + q.word + ". " + q.def);
    } else {
      if (first) match.missed.push({ word: q.word, def: q.def });
      match.round.push(matchQuestion(q));
      say("Not quite. " + q.word + ". " + q.def);
    }
    render();
  }

  function renderVocabDone(view, bucket, againFn, extra) {
    chrome("Glossary Vocab", bucket.firstCorrect + " / " + bucket.total);
    view.appendChild(h("h2", null, "Round done"));
    view.appendChild(h("p", { class: "score" }, bucket.firstCorrect + " / " + bucket.total));
    view.appendChild(h("p", null, "First-try correct / " + bucket.total + "."));
    view.appendChild(h("p", null, scoreNote(bucket.firstCorrect, bucket.total)));
    appendMissed(view, bucket.missed);
    const again = h("button", { type: "button" }, "New round");
    again.addEventListener("click", () => run(againFn, true));
    const buttons = [again];
    if (extra) {
      const more = h("button", { type: "button", class: "secondary" }, extra.label);
      more.addEventListener("click", () => run(extra.on, true));
      buttons.push(more);
    }
    view.appendChild(h("div", { class: "stack-btns" }, buttons));
    actions.primary = againFn;
    const bar = [];
    if (extra) bar.push({ label: extra.label, top: true, on: extra.on });
    bar.push({ label: "New round", primary: true, top: true, on: againFn });
    setBar(bar);
  }

  function renderVocabMatch(view) {
    if (!state.vocab.match.round) startVocabMatch(false);
    const match = state.vocab.match;
    if (match.phase === "done") {
      renderVocabDone(view, match, () => {
        startVocabMatch(false);
        render();
      }, {
        label: "Drill all words",
        on: () => {
          startVocabMatch(true);
          render();
        },
      });
      return;
    }
    const i = match.i;
    const q = match.round[i];
    const picked = match.picks[i] || null;
    chrome("Glossary Vocab", i + 1 + " / " + match.round.length);
    view.appendChild(
      h("p", { class: "quiet" }, "Tap the word that matches. A miss comes back later in the round.")
    );
    view.appendChild(h("p", { class: "prompt" }, q.def));
    const choices = h("div", { class: "choices" });
    q.choices.forEach((choice) => {
      let cls = "choice";
      let tag = "";
      if (picked) {
        if (choice === q.word) {
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
      button.addEventListener("click", () => pickVocab(choice));
      choices.appendChild(button);
    });
    view.appendChild(choices);
    if (picked) view.appendChild(vocabTeach(q));

    const go = (delta) => {
      const next = match.i + delta;
      if (next < 0 || next >= match.round.length) {
        if (delta > 0 && picked && i === match.round.length - 1) {
          match.phase = "done";
          render();
        }
        return;
      }
      if (delta > 0 && !picked) return;
      match.i = next;
      render();
    };
    actions.prev = () => go(-1);
    actions.next = () => go(1);
    actions.primary = picked ? actions.next : null;
    const onLast = i === match.round.length - 1;
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

  function spellFieldValue() {
    const input = document.querySelector(".spell-form input");
    return input ? input.value : "";
  }

  function checkSpell() {
    const spell = state.vocab.spell;
    if (spell.phase !== "ask") return;
    const q = spell.round[spell.i];
    if (!q || q.checked) return;
    const typed = spellFieldValue();
    if (!normWord(typed)) {
      say("Type the word, then check.");
      return;
    }
    q.typed = typed;
    q.checked = true;
    q.ok = normWord(typed) === normWord(q.word);
    const first = !spell.tried[q.id];
    spell.tried[q.id] = true;
    if (q.ok && first && !q.revealed) spell.firstCorrect += 1;
    else if (first) spell.missed.push({ word: q.word, def: q.def });
    if (!q.ok) spell.round.push(spellQuestion(q));
    say(q.ok ? "Yes. " + q.word + "." : "Not quite. The word is " + q.word + ".");
    render();
  }

  function revealSpell() {
    const spell = state.vocab.spell;
    const q = spell.round[spell.i];
    if (!q || q.checked) return;
    q.typed = spellFieldValue();
    q.revealed = true;
    say("The word is " + q.word + ".");
    render();
  }

  function renderVocabSpell(view) {
    if (!state.vocab.spell.round) startVocabSpell();
    const spell = state.vocab.spell;
    if (spell.phase === "done") {
      renderVocabDone(view, spell, () => {
        startVocabSpell();
        render();
      }, null);
      return;
    }
    const i = spell.i;
    const q = spell.round[i];
    chrome("Glossary Vocab", i + 1 + " / " + spell.round.length);
    view.appendChild(
      h("p", { class: "quiet" }, "Type the word. A miss comes back later in the round.")
    );
    view.appendChild(h("p", { class: "prompt" }, q.def));

    if (!q.checked) {
      if (q.revealed) {
        view.appendChild(h("p", { class: "quiet" }, "The word is " + q.word + ". Type it, then check."));
      }
      const input = h("input", {
        type: "text",
        autocomplete: "off",
        autocapitalize: "off",
        spellcheck: "false",
        "aria-label": "Type the glossary word",
      });
      if (q.typed) input.value = q.typed;
      const form = h("form", { class: "spell-form", autocomplete: "off" }, [
        input,
        h("button", { type: "submit", class: "bar-btn primary" }, "Check"),
      ]);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        checkSpell();
      });
      view.appendChild(form);
      if (!q.revealed) {
        const show = h("button", { type: "button", class: "text-btn" }, "Show answer");
        show.addEventListener("click", () => revealSpell());
        view.appendChild(h("div", { class: "row-actions" }, show));
      }
      input.focus({ preventScroll: true });
    } else {
      view.appendChild(
        h(
          "p",
          { class: q.ok ? "spell-note is-correct" : "spell-note is-wrong" },
          q.ok ? "Yes. " + q.word : "Not quite. The word is " + q.word + "."
        )
      );
      view.appendChild(vocabTeach(q));
    }

    const last = i === spell.round.length - 1;
    const go = (delta) => {
      if (delta > 0 && !q.checked) return;
      const next = spell.i + delta;
      if (next < 0 || next >= spell.round.length) {
        if (delta > 0 && q.checked && last) {
          spell.phase = "done";
          render();
        }
        return;
      }
      spell.i = next;
      render();
    };
    actions.prev = () => go(-1);
    actions.next = () => go(1);
    actions.primary = q.checked ? actions.next : checkSpell;
    if (!q.checked) {
      setBar([
        { label: "Prev", disabled: i === 0, on: actions.prev },
        { label: "Check", primary: true, on: checkSpell },
        { label: "Next", disabled: true, on: actions.next },
      ]);
    } else {
      setBar([
        { label: "Prev", disabled: i === 0, on: actions.prev },
        { label: last ? "Finish" : "Next", primary: true, on: actions.next },
      ]);
    }
  }

  function renderCredits(view, token) {
    chrome("Credits", "");
    view.appendChild(h("h2", null, "Image credits"));
    view.appendChild(h("p", { class: "quiet", id: "credit-status" }, "Checking for credits…"));
    loadCredits().then((data) => {
      if (token !== renderToken) return;
      const status = document.getElementById("credit-status");
      if (!data) {
        if (status) status.textContent = "Credits will show here when the credit file is ready.";
        return;
      }
      if (status) status.remove();
      const list = h("ul", { class: "parts" });
      data.forEach((item) => {
        const li = h("li", { class: "credit" });
        li.appendChild(h("strong", null, item.title || item.file || "Image"));
        [item.creator, item.photographer ? "Photo: " + item.photographer : "", item.license, item.source, item.file]
          .filter(Boolean)
          .forEach((bit) => li.appendChild(h("span", { class: "credit-bit" }, bit)));
        list.appendChild(li);
      });
      view.appendChild(list);
    });
    setBar(null);
  }

  function loadCredits() {
    return fetch("assets/credits.json")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => (Array.isArray(data) ? data : null))
      .catch(() => null);
  }

  function renderMissing(view) {
    chrome("Renaissance Test Prep", "");
    view.appendChild(h("p", null, "That section is not on the list."));
    view.appendChild(h("a", { class: "tile", href: "#/" }, "Back to the start"));
    setBar(null);
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  const routes = {
    "/": renderHome,
    "/learn": renderLearn,
    "/cards": renderCards,
    "/blanks": renderBlanks,
    "/vocab": renderVocab,
    "/quiz": renderQuiz,
    "/art": renderArt,
    "/map": renderMap,
    "/essays": renderEssays,
    "/cram": renderCram,
    "/credits": (view) => renderCredits(view, renderToken),
  };

  function render() {
    if (typeof STUDY === "undefined") {
      $("view").textContent = "Study data did not load.";
      return;
    }
    const token = ++renderToken;
    const path = currentPath();
    document.body.dataset.mode = path === "/" ? "home" : path.replace(/^\//, "");
    syncNav(path);
    const changed = path !== lastPath;
    lastPath = path;
    actions = { prev: null, next: null, primary: null };
    const view = $("view");
    view.textContent = "";
    setBar(null);
    const draw = routes[path] || renderMissing;
    if (path === "/credits") renderCredits(view, token);
    else draw(view);
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

  document.addEventListener("keydown", onKey);
  window.addEventListener("hashchange", render);
  bindSwipe($("view"));
  render();
})();
