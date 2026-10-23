/* Renaissance Test Prep — routing and study modes.
   Nothing is saved. Progress lives only until the page is closed. */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    learnI: 0,
    cards: { deck: "all", order: null, i: 0, flipped: false },
    blanks: { queue: null, i: 0, revealed: false, hint: false, finished: false },
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
        if (!item.disabled && item.on) item.on();
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
        "Test Friday. This page quizzes you and teaches you on the same tap. Short sentences. Lots of repeats. You can do this."
      )
    );
    view.appendChild(
      h(
        "p",
        { class: "quiet" },
        "Tonight, go top to bottom (about 45 min). Tomorrow morning: Cram Sheet + one more Quiz round."
      )
    );

    const tiles = [
      ["#/learn", "Crash Course", "The big story in 12 short cards."],
      ["#/cards", "Flashcards", "Every fact, front and back."],
      ["#/blanks", "Fill-in-the-Blank", "The worksheet sentences, exact."],
      ["#/art", "Art ID", "Name the work, then learn the clues."],
      ["#/map", "Map", "Rome, Florence, Venice, and two seas."],
      ["#/quiz", "Quiz", "15 questions a round. Misses come back."],
      ["#/essays", "Essays", "A checklist, a recipe, and a sample."],
      ["#/cram", "Cram Sheet", "Every fact on one page, for the morning."],
    ];
    const grid = h("div", { class: "tiles" });
    tiles.forEach((tile, i) => {
      const link = h("a", { class: "tile", href: tile[0] });
      link.appendChild(h("strong", null, i + 1 + ". " + tile[1]));
      link.appendChild(h("span", null, tile[2]));
      grid.appendChild(link);
    });
    view.appendChild(grid);

    view.appendChild(h("h2", null, "Test Friday: what's on it"));
    const list = h("ol", { class: "parts" });
    STUDY.plan.parts.forEach((part) => {
      const li = h("li");
      li.appendChild(h("span", { class: "part-name" }, part.n + ". " + part.name));
      li.appendChild(document.createTextNode(" — " + part.help));
      list.appendChild(li);
    });
    view.appendChild(list);
    view.appendChild(
      h(
        "p",
        { class: "quiet" },
        "Nothing is saved on this phone. If you close the tab, start the round again. Tonight, just keep going."
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
    view.appendChild(h("h2", null, card.title));
    if (card.image) view.appendChild(figure(card.image, card.alt, card.title));
    card.paragraphs.forEach((text) => view.appendChild(para(text)));
    view.appendChild(teachBox("", card.hook));

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
      setBar([{ label: "All cards", primary: true, on: () => setDeck("all") }]);
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
      setBar([{ label: "Practice again", primary: true, on: again }]);
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
      got.addEventListener("click", () => markBlank(true));
      later.addEventListener("click", () => markBlank(false));
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
    if (q.image) view.appendChild(figure(q.image, q.alt, "Artwork"));
    view.appendChild(h("p", { class: "prompt" }, q.q));
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
      view.appendChild(button);
    });
    if (picked) {
      view.appendChild(teachBox(q.explain, q.hook));
    }

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
        on: () => {
          const ids = state.quiz.missed.slice();
          startQuiz(ids);
          render();
        },
      },
      {
        label: "New round",
        primary: true,
        on: () => {
          startQuiz(null);
          render();
        },
      },
    ]);
  }

  function scoreNote(correct, total) {
    if (correct === total) return "Clean sweep. One more round tomorrow morning and it will stay.";
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
    if (item.bonus) view.appendChild(h("p", { class: "banner" }, "Bonus — may be in your book"));
    view.appendChild(h("p", { class: "prompt" }, item.prompt));

    if (item.kind === "compare") {
      const grid = h("div", { class: "compare-grid" });
      grid.appendChild(compareFigure(item.left));
      grid.appendChild(compareFigure(item.right));
      view.appendChild(grid);
      if (state.artRevealed) {
        if (item.also) view.appendChild(compareFigure(item.also));
        view.appendChild(h("h3", null, "Middle Ages"));
        view.appendChild(listOf("ul", "checklist", item.medieval));
        view.appendChild(h("h3", null, "Renaissance"));
        view.appendChild(listOf("ul", "checklist", item.renaissance));
        view.appendChild(teachBox(item.connection, item.hook));
      }
    } else {
      const fallback = state.artRevealed ? item.title : "Image";
      view.appendChild(figure(item.file, item.alt, fallback));
      if (state.artRevealed) {
        view.appendChild(h("h2", null, item.title));
        if (item.kind === "place") {
          view.appendChild(h("p", null, "This is a city, not a painting."));
        } else if (item.artist) {
          const line = h("p");
          line.appendChild(h("strong", null, "Artist: "));
          line.appendChild(document.createTextNode(item.artist));
          view.appendChild(line);
        }
        const where = h("p");
        where.appendChild(h("strong", null, "Place: "));
        where.appendChild(document.createTextNode(item.place));
        view.appendChild(where);
        view.appendChild(h("h3", null, "How to recognize it"));
        view.appendChild(listOf("ul", "clues", item.clues));
        view.appendChild(teachBox(item.connection, item.hook));
      }
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
    view.appendChild(tips);

    if (state.map.mode === "learn") renderMapLearn(view);
    else if (state.map.over) renderMapDone(view);
    else if (state.map.mode === "find") renderMapFind(view);
    else renderMapName(view);
  }

  function renderMapCanvas(view, options) {
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
    view.appendChild(wrap);
  }

  function renderMapLearn(view) {
    view.appendChild(h("p", null, "Tap a pin. Filled dots are cities. Square rings are seas."));
    const selected = placeById(state.map.selected) || STUDY.places[0];
    renderMapCanvas(view, {
      labelFor: (place) => place.name,
      classFor: (place) => (place.id === selected.id ? "is-hot" : ""),
      onPin: (place) => {
        state.map.selected = place.id;
        render();
        const fact = document.getElementById("place-fact");
        if (fact) fact.scrollIntoView({ block: "nearest" });
      },
    });
    const fact = h("div", { class: "panel", id: "place-fact" });
    fact.appendChild(h("h2", null, selected.n + ". " + selected.name));
    fact.appendChild(h("p", null, selected.where));
    fact.appendChild(h("p", null, selected.fact));
    fact.appendChild(teachBox("", selected.hook));
    view.appendChild(fact);

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
    view.appendChild(h("p", { class: "prompt" }, "Tap " + target.name));
    view.appendChild(
      h("p", { class: "quiet" }, "Question " + (state.map.step + 1) + " of " + state.map.order.length)
    );
    renderMapCanvas(view, {
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
    if (state.map.locked) view.appendChild(mapFeedback(target));
    mapQuestionBar(target);
  }

  function renderMapName(view) {
    const target = placeById(state.map.order[state.map.step]);
    view.appendChild(h("p", { class: "prompt" }, "What is the highlighted pin?"));
    view.appendChild(
      h("p", { class: "quiet" }, "Question " + (state.map.step + 1) + " of " + state.map.order.length)
    );
    renderMapCanvas(view, {
      blind: true,
      labelFor: () => "Map pin",
      classFor: (place) => {
        if (!state.map.locked && place.id === target.id) return "is-hot";
        return pinClass(place, target);
      },
      onPin: () => {},
    });
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
      view.appendChild(button);
    });
    if (state.map.locked) view.appendChild(mapFeedback(target));
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
    setBar([{ label: "Try again", primary: true, on: again }]);
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
        "Tomorrow morning, read this once slowly. If a line feels fuzzy, that is the card to flip again."
      )
    );
    const wrap = h("div", { class: "cram" });
    STUDY.cram.forEach((group) => {
      wrap.appendChild(h("h2", null, group.heading));
      const ul = h("ul");
      group.lines.forEach((line) => ul.appendChild(h("li", null, line)));
      wrap.appendChild(ul);
    });
    view.appendChild(wrap);
    setBar(null);
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
    const changed = path !== lastPath;
    lastPath = path;
    actions = { prev: null, next: null, primary: null };
    const view = $("view");
    view.textContent = "";
    setBar(null);
    const draw = routes[path] || renderMissing;
    if (path === "/credits") renderCredits(view, token);
    else draw(view);
    if (changed) window.scrollTo(0, 0);
  }

  function onKey(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (actions.prev) actions.prev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      if (actions.next) actions.next();
    } else if (event.key === " " || event.key === "Enter") {
      if (event.target && event.target.closest && event.target.closest("button, a, summary")) return;
      if (!actions.primary) return;
      event.preventDefault();
      actions.primary();
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
      if (dx < 0 && actions.next) actions.next();
      else if (dx > 0 && actions.prev) actions.prev();
    });
  }

  document.addEventListener("keydown", onKey);
  window.addEventListener("hashchange", render);
  bindSwipe($("view"));
  render();
})();
