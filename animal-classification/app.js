/* Animal Classification Review — routing and study modes.
   Quiz progress lives only until the page is closed. */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const SORT_GAMES = [
    ["warm", "Warm or cold?"],
    ["backbone", "Backbone?"],
    ["group", "Which group?"],
  ];

  const VERTEBRATE_ORDER = ["amphibian", "mammal", "bird", "fish", "reptile"];

  const state = {
    learnI: 0,
    cards: { deck: "all", order: null, i: 0, flipped: false },
    sheet: { i: 0, revealed: false },
    sort: { game: "warm", round: null, i: 0, picks: {}, correct: 0, missed: [], phase: "ask" },
    quiz: { round: null, i: 0, picks: {}, correct: 0, missed: [], phase: "ask" },
  };

  let actions = { prev: null, next: null, primary: null };
  let lastPath = null;
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
      ["/sheet", "Review Sheet"],
      ["/cards", "Flashcards"],
      ["/sort", "Sort It"],
      ["/quiz", "Quiz"],
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

  /* ---------- views ---------- */

  function renderHome(view) {
    chrome("Animal Classification Review", "");
    view.appendChild(
      para(
        "Miss Verheeck’s first science assessment. These are the review sheet questions with full, correct answers, plus games that make them stick."
      )
    );

    const tiles = [
      ["#/learn", "Crash Course", "The big ideas in 12 short cards."],
      ["#/sheet", "Review Sheet", "All 10 sheet questions, with full answers."],
      ["#/cards", "Flashcards", "Every fact, front and back."],
      ["#/sort", "Sort It", "Warm or cold? Backbone? Which group?"],
      ["#/quiz", "Quiz", "15 questions a round. Misses come back."],
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

    const steps = h("ol", { class: "parts days" });
    STUDY.plan.steps.forEach((step) => {
      const li = h("li");
      li.appendChild(h("span", { class: "part-name" }, step[0]));
      li.appendChild(document.createTextNode(" — " + step[1]));
      steps.appendChild(li);
    });
    const big = h("ul", { class: "parts" });
    STUDY.plan.big.forEach((line) => big.appendChild(h("li", null, line)));
    const planCol = h("section", { class: "home-col" });
    planCol.appendChild(h("h2", null, "How to study"));
    planCol.appendChild(steps);
    const bigCol = h("section", { class: "home-col" });
    bigCol.appendChild(h("h2", null, "The big four"));
    bigCol.appendChild(big);
    view.appendChild(h("div", { class: "home-cols" }, [planCol, bigCol]));
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

  function renderVenn(venn) {
    const root = h("div", { class: "venn" });
    const circles = h("div", { class: "venn-circles", "aria-hidden": "true" });
    circles.appendChild(h("div", { class: "venn-circle venn-circle-left" }));
    circles.appendChild(h("div", { class: "venn-circle venn-circle-right" }));
    root.appendChild(circles);
    const regions = h("div", { class: "venn-regions" });
    [
      ["venn-left", venn.left],
      ["venn-both", venn.both],
      ["venn-right", venn.right],
    ].forEach((pair) => {
      const region = h("section", { class: "venn-region " + pair[0] });
      region.appendChild(h("h4", null, pair[1].title));
      const list = h("ul");
      pair[1].items.forEach((text) => list.appendChild(h("li", null, text)));
      region.appendChild(list);
      regions.appendChild(region);
    });
    root.appendChild(regions);
    return root;
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
      if (item.venn) view.appendChild(renderVenn(item.venn));
      view.appendChild(h("h3", null, "A full answer includes"));
      const checks = h("div");
      item.points.forEach((point) => {
        const label = h("label", { class: "check" });
        label.appendChild(h("input", { type: "checkbox" }));
        label.appendChild(h("span", null, point));
        checks.appendChild(label);
      });
      view.appendChild(checks);
      const watch = h("div", { class: "teach" });
      const watchP = h("p");
      watchP.appendChild(h("span", { class: "label" }, "Watch out"));
      watchP.appendChild(document.createTextNode(item.watch));
      watch.appendChild(watchP);
      view.appendChild(watch);
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

  function cardPool(deck) {
    if (deck === "all") return STUDY.cards;
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
    chrome("Flashcards", state.cards.i + 1 + " / " + order.length);

    const chips = h("div", { class: "chips", role: "group", "aria-label": "Decks" });
    [
      ["all", "All"],
      ["big", "Big ideas"],
      ["terms", "Terms"],
      ["groups", "Groups"],
      ["tricky", "Tricky ones"],
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

    front.appendChild(h("p", { class: "prompt" }, card.front));
    front.appendChild(h("p", { class: "quiet tap-hint" }, "Tap the card to flip."));

    back.appendChild(h("p", { class: "answer" }, card.answer));
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

  function sortPool(game) {
    if (game === "group") {
      return STUDY.animals.filter((animal) => STUDY.groupInfo[animal.group].backbone);
    }
    return STUDY.animals.slice();
  }

  function sortChoices(game) {
    if (game === "warm") return ["Warm-blooded", "Cold-blooded"];
    if (game === "backbone") return ["Vertebrate", "Invertebrate"];
    return VERTEBRATE_ORDER.map((id) => STUDY.groupInfo[id].label);
  }

  function sortAnswer(game, animal) {
    const info = STUDY.groupInfo[animal.group];
    if (game === "warm") return info.warm ? "Warm-blooded" : "Cold-blooded";
    if (game === "backbone") return info.backbone ? "Vertebrate" : "Invertebrate";
    return info.label;
  }

  function sortExplain(game, animal) {
    const info = STUDY.groupInfo[animal.group];
    const group = info.label.toLowerCase();
    const article = (word) => (/^[aeiou]/i.test(word) ? "An " : "A ");
    const name = animal.name.toLowerCase();
    const lead = article(name) + name + " is " + article(group).toLowerCase() + group;
    let line;
    if (game === "warm") {
      line = lead + ", so it is " + (info.warm ? "warm-blooded" : "cold-blooded") + ". ";
    } else if (game === "backbone") {
      line = lead + ", so it is " + (info.backbone ? "a vertebrate" : "an invertebrate") + ". ";
    } else {
      line = lead + ". ";
    }
    return line + animal.note;
  }

  function sortCue(game) {
    if (game === "warm") return "Is this animal warm-blooded or cold-blooded?";
    if (game === "backbone") return "Does this animal have a backbone?";
    return "Which vertebrate group is this?";
  }

  function startSort(list) {
    const source = list
      ? list.map((animal) => Object.assign({}, animal))
      : shuffle(sortPool(state.sort.game)).slice(0, 12);
    state.sort.round = source;
    state.sort.i = 0;
    state.sort.picks = {};
    state.sort.correct = 0;
    state.sort.missed = [];
    state.sort.phase = source.length ? "ask" : "done";
  }

  function renderSort(view) {
    const segment = h("div", { class: "segment", role: "tablist", "aria-label": "Sort It game" });
    SORT_GAMES.forEach((pair) => {
      const button = h(
        "button",
        {
          type: "button",
          role: "tab",
          "aria-selected": state.sort.game === pair[0] ? "true" : "false",
        },
        pair[1]
      );
      button.addEventListener("click", () => {
        if (state.sort.game === pair[0]) return;
        state.sort.game = pair[0];
        startSort(null);
        render();
      });
      segment.appendChild(button);
    });
    view.appendChild(segment);

    if (!state.sort.round) startSort(null);
    if (state.sort.phase === "done") {
      renderSortDone(view);
      return;
    }

    const round = state.sort.round;
    const i = state.sort.i;
    const animal = round[i];
    const picked = state.sort.picks[i] || null;
    const answer = sortAnswer(state.sort.game, animal);
    chrome("Sort It", i + 1 + " / " + round.length);
    view.appendChild(h("p", { class: "quiet" }, sortCue(state.sort.game)));
    view.appendChild(h("p", { class: "prompt" }, animal.name));

    const choices = h("div", { class: "choices" });
    sortChoices(state.sort.game).forEach((choice) => {
      let cls = "choice";
      let tag = "";
      if (picked) {
        if (choice === answer) {
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
      button.addEventListener("click", () => pickSort(choice));
      choices.appendChild(button);
    });
    view.appendChild(choices);
    if (picked) view.appendChild(teachBox(sortExplain(state.sort.game, animal)));

    const go = (delta) => {
      const next = state.sort.i + delta;
      if (next < 0 || next >= round.length) {
        if (delta > 0 && picked && i === round.length - 1) {
          state.sort.phase = "done";
          render();
        }
        return;
      }
      if (delta > 0 && !picked) return;
      state.sort.i = next;
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

  function pickSort(choice) {
    const i = state.sort.i;
    if (state.sort.picks[i]) return;
    const animal = state.sort.round[i];
    const answer = sortAnswer(state.sort.game, animal);
    state.sort.picks[i] = choice;
    if (choice === answer) {
      state.sort.correct += 1;
      say("Yes. " + sortExplain(state.sort.game, animal));
    } else {
      state.sort.missed.push(animal.name);
      say("Not quite. " + sortExplain(state.sort.game, animal));
    }
    render();
  }

  function renderSortDone(view) {
    const total = state.sort.round.length;
    const correct = state.sort.correct;
    chrome("Sort It", correct + " / " + total);
    view.appendChild(h("h2", null, "Round done"));
    view.appendChild(h("p", { class: "score" }, correct + " / " + total));
    view.appendChild(h("p", null, scoreNote(correct, total)));
    const review = h(
      "button",
      { type: "button", class: state.sort.missed.length ? "" : "secondary", disabled: !state.sort.missed.length },
      "Review the ones you missed"
    );
    const again = h("button", { type: "button", class: "secondary" }, "New round");
    review.addEventListener("click", () => {
      const animals = state.sort.missed
        .map((name) => STUDY.animals.find((animal) => animal.name === name))
        .filter(Boolean);
      startSort(animals);
      render();
    });
    again.addEventListener("click", () => {
      startSort(null);
      render();
    });
    view.appendChild(h("div", { class: "stack-btns" }, [review, again]));
    actions.primary = () => {
      startSort(null);
      render();
    };
    setBar([
      {
        label: "Review misses",
        disabled: !state.sort.missed.length,
        top: true,
        on: () => {
          const animals = state.sort.missed
            .map((name) => STUDY.animals.find((animal) => animal.name === name))
            .filter(Boolean);
          startSort(animals);
          render();
        },
      },
      {
        label: "New round",
        primary: true,
        top: true,
        on: () => {
          startSort(null);
          render();
        },
      },
    ]);
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
    chrome("Animal Classification Review", "");
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
    "/sheet": renderSheet,
    "/cards": renderCards,
    "/sort": renderSort,
    "/quiz": renderQuiz,
    "/cram": renderCram,
  };

  function render() {
    if (typeof STUDY === "undefined") {
      $("view").textContent = "Study data did not load.";
      return;
    }
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

  document.addEventListener("keydown", onKey);
  window.addEventListener("hashchange", render);
  bindSwipe($("view"));
  render();
})();
