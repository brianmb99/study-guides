/* Nouns Quiz #2 — notebook practice.
   Progress stays in memory until the page is closed.
   Tagged sentences come from content.js: "text|tag" or "text|tag.ROLE". */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const TAG_NAME = { n: "noun", j: "adjective", a: "article", v: "verb" };
  const CYCLE = ["", "n", "j", "a", "v"];
  const SYMBOL_TAGS = ["n", "j", "a", "v"];

  const MODES = [
    { path: "/learn", name: "Crash Course", blurb: "The notes, one short card at a time." },
    { path: "/symbols", name: "Draw the Symbols", blurb: "Put the triangle or the red circle above each word." },
    { path: "/find", name: "Find It", blurb: "Tap the subject, the verb, the direct object, and more." },
    { path: "/commas", name: "Commas", blurb: "Fence off the person you are talking to." },
    { path: "/chart", name: "The Chart", blurb: "Plurals and possessives. The quiz has two charts." },
    { path: "/sort", name: "Sort It", blurb: "Count, noncount, or a group." },
    { path: "/tf", name: "True or False", blurb: "Quick true-or-false questions, like the quiz has." },
    { path: "/write", name: "Write It", blurb: "Write a sentence, then check it yourself." },
    { path: "/cram", name: "Cram Sheet", blurb: "The whole unit on one page, for test morning." },
  ];

  const CHART_FIELDS = [
    ["plural", "Plural"],
    ["singPoss", "Singular possessive"],
    ["pluralPoss", "Plural possessive"],
  ];

  const state = {
    learnI: 0,
    symbols: null,
    find: null,
    commas: null,
    chart: {
      view: "practice",
      notesOnly: false,
      round: null,
      i: 0,
      answers: ["", "", ""],
      checked: false,
      results: null,
      correct: 0,
      missed: [],
      phase: "ask",
      focusIndex: 0,
      focusedOnce: false,
      caret: 0,
      caretEnd: 0,
    },
    sort: null,
    tf: null,
    write: { i: 0, revealed: false, draft: "" },
  };

  let actions = { prev: null, next: null, primary: null };
  let lastPath = null;
  let toTop = false;
  let chartInputs = [];

  function run(fn, top) {
    if (!fn) return;
    toTop = top || fn === actions.prev || fn === actions.next;
    try {
      fn();
    } finally {
      toTop = false;
    }
  }

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

  function pretty(text) {
    return String(text == null ? "" : text).replace(/'/g, "\u2019");
  }

  function rich(text) {
    const frag = document.createDocumentFragment();
    const source = pretty(text);
    const re = /\*\*(.+?)\*\*/g;
    let last = 0;
    let match;
    while ((match = re.exec(source))) {
      if (match.index > last) frag.appendChild(document.createTextNode(source.slice(last, match.index)));
      frag.appendChild(h("strong", null, match[1]));
      last = match.index + match[0].length;
    }
    if (last < source.length) frag.appendChild(document.createTextNode(source.slice(last)));
    return frag;
  }

  function para(text, className) {
    const p = h("p", className ? { class: className } : null);
    p.appendChild(rich(text));
    return p;
  }

  function liRich(text) {
    const item = h("li");
    item.appendChild(rich(text));
    return item;
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
    if (!live) return;
    live.textContent = "";
    window.setTimeout(() => {
      live.textContent = message;
    }, 30);
  }

  function sameSet(a, b) {
    if (a.size !== b.size) return false;
    for (const value of a) {
      if (!b.has(value)) return false;
    }
    return true;
  }

  function scoreNote(correct, total) {
    if (!total) return "Nothing in this round.";
    if (correct === total) return "Clean round. That one is ready for the quiz.";
    if (correct * 5 >= total * 4) return "Strong round. The ones below are worth one more look.";
    if (correct * 2 >= total) return "You have a lot of this. Practice the ones below, then play again.";
    return "This round shows what to practice. Read the answers below, then play again.";
  }

  /* Tagged sentence: punctuation tokens stick to the previous word. */
  function parseTagged(str) {
    const words = [];
    String(str).split(" ").forEach((token) => {
      if (!token) return;
      const pipe = token.indexOf("|");
      if (pipe === -1) {
        if (words.length) words[words.length - 1].punct += token;
        else words.push({ text: token, punct: "", tag: "", role: "", loose: true });
        return;
      }
      const text = token.slice(0, pipe);
      const meta = token.slice(pipe + 1);
      const dot = meta.indexOf(".");
      words.push({
        text: text,
        punct: "",
        tag: dot === -1 ? meta : meta.slice(0, dot),
        role: dot === -1 ? "" : meta.slice(dot + 1),
      });
    });
    return words;
  }

  function plainSentence(tagged) {
    return parseTagged(tagged)
      .map((word) => pretty(word.text) + word.punct)
      .join(" ");
  }

  function takesSymbol(word) {
    return SYMBOL_TAGS.indexOf(word.tag) !== -1;
  }

  function cycleTag(current) {
    const index = CYCLE.indexOf(current || "");
    return CYCLE[(index + 1) % CYCLE.length];
  }

  function punctName(punct) {
    if (punct === ",") return "comma";
    if (punct === ".") return "period";
    if (punct === "!") return "exclamation mark";
    if (punct === "?") return "question mark";
    return punct || "";
  }

  function wordName(word, opts, placed, mark) {
    const bits = [pretty(word.text)];
    const spokenPunct = punctName(word.punct);
    if (spokenPunct) bits.push(spokenPunct);
    if (opts.slots && takesSymbol(word)) {
      bits.push(placed && TAG_NAME[placed] ? TAG_NAME[placed] : "no symbol yet");
    } else if (opts.symbols && TAG_NAME[word.tag]) {
      bits.push(TAG_NAME[word.tag]);
    }
    if (opts.labels && word.role && STUDY.roles[word.role]) bits.push(STUDY.roles[word.role].name);
    if (mark === "right") bits.push("correct");
    else if (mark === "wrong") bits.push("incorrect");
    else if (mark === "miss") bits.push("missed");
    return bits.join(", ");
  }

  function svgEl(name, attrs) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attrs).forEach((key) => node.setAttribute(key, attrs[key]));
    return node;
  }

  function symbolSvg(tag) {
    let svg;
    if (tag === "n") {
      svg = svgEl("svg", { viewBox: "0 0 26 22", width: "26", height: "22", class: "sym sym-n" });
      svg.appendChild(svgEl("polygon", { points: "13,1 25,21 1,21", fill: "#000000" }));
    } else if (tag === "j") {
      svg = svgEl("svg", { viewBox: "0 0 20 16", width: "20", height: "16", class: "sym sym-j" });
      svg.appendChild(svgEl("polygon", { points: "10,1 19,15 1,15", fill: "#1f4fb8" }));
    } else if (tag === "a") {
      svg = svgEl("svg", { viewBox: "0 0 12 9", width: "12", height: "9", class: "sym sym-a" });
      svg.appendChild(svgEl("polygon", { points: "6,0.5 11.5,8.5 0.5,8.5", fill: "#6fa8e8" }));
    } else if (tag === "v") {
      svg = svgEl("svg", { viewBox: "0 0 18 18", width: "18", height: "18", class: "sym sym-v" });
      svg.appendChild(svgEl("circle", { cx: "9", cy: "9", r: "8.5", fill: "#d0242b" }));
    } else {
      return null;
    }
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    return svg;
  }

  function legendEl() {
    const list = h("ul", { class: "legend" });
    STUDY.symbols.forEach((sym) => {
      const shape = h("span", { class: "legend-shape", "aria-hidden": "true" });
      const svg = symbolSvg(sym.tag);
      if (svg) shape.appendChild(svg);
      const copy = h("span", { class: "legend-copy" });
      copy.appendChild(h("strong", null, sym.name));
      copy.appendChild(h("span", { class: "legend-says" }, sym.says));
      copy.appendChild(h("span", { class: "legend-shape-name" }, sym.shape));
      list.appendChild(h("li", { class: "legend-item" }, [shape, copy]));
    });
    return list;
  }

  function markWord(mark) {
    if (mark === "right") return "\u2713 Right";
    if (mark === "wrong") return "\u2717 Wrong";
    if (mark === "miss") return "Missed";
    return "";
  }

  /* opts: symbols, labels, tappable, onTap, selected (Set), marks (array), slots (array). */
  function sentenceView(tagged, opts) {
    opts = opts || {};
    const words = parseTagged(tagged);
    const classes = ["sentence"];
    if (opts.chips || (opts.tappable && !opts.slots)) classes.push("is-tap");
    if (opts.slots) classes.push("is-draw");
    if (opts.symbols || opts.slots) classes.push("has-sym");
    if (opts.labels) classes.push("has-roles");
    const row = h("div", {
      class: classes.join(" "),
      role: "group",
      "aria-label": opts.groupLabel || "Sentence",
    });

    words.forEach((word, i) => {
      const mark = opts.marks ? opts.marks[i] || "" : "";
      const placed = opts.slots ? opts.slots[i] || "" : "";
      const interactive = !!opts.tappable && (!opts.slots || takesSymbol(word)) && !word.loose;
      const col = h(interactive ? "button" : "span", {
        class: "word" + (mark ? " is-" + mark : ""),
        type: interactive ? "button" : null,
      });
      const name = wordName(word, opts, placed, mark);
      if (interactive) {
        col.setAttribute("data-focus", (opts.slots ? "slot-" : "pick-") + i);
        if (!opts.slots) {
          const pressed = opts.selected && opts.selected.has(i);
          col.setAttribute("aria-pressed", pressed ? "true" : "false");
        }
        col.setAttribute("aria-label", name);
        col.addEventListener("click", () => {
          if (opts.onTap) opts.onTap(i, word);
        });
      }

      if (opts.symbols || opts.slots) {
        const showDashed = !!(opts.slots && takesSymbol(word) && !placed);
        const slotClass = ["sym-slot"];
        if (showDashed) slotClass.push("is-empty");
        if (mark === "right" || mark === "wrong") slotClass.push("is-" + mark);
        const slot = h("span", { class: slotClass.join(" "), "aria-hidden": "true" });
        const drawn = opts.slots ? (takesSymbol(word) ? placed : "") : word.tag;
        const svg = drawn ? symbolSvg(drawn) : null;
        if (svg) slot.appendChild(svg);
        col.appendChild(slot);
      }

      const text = h("span", { class: "word-text", "aria-hidden": "true" }, pretty(word.text));
      if (word.punct) text.appendChild(h("span", { class: "punct" }, word.punct));
      if (!interactive) col.appendChild(h("span", { class: "visually-hidden" }, name));
      col.appendChild(text);

      if (mark) {
        col.appendChild(h("span", { class: "mark-text mark-" + mark, "aria-hidden": "true" }, markWord(mark)));
      }

      if (opts.labels) {
        const roleSlot = h("span", { class: "role-slot", "aria-hidden": "true" });
        if (word.role && STUDY.roles[word.role]) {
          roleSlot.appendChild(h("span", { class: "role-label" }, STUDY.roles[word.role].label));
        }
        col.appendChild(roleSlot);
      }
      row.appendChild(col);
    });
    return row;
  }

  function hookNote(text) {
    const box = h("aside", { class: "hook" });
    box.appendChild(h("span", { class: "hook-label" }, "Memory hook"));
    const p = h("p");
    p.appendChild(rich(text));
    box.appendChild(p);
    return box;
  }

  function banner(ok, text) {
    const box = h("div", { class: ok ? "banner is-right" : "banner is-wrong" });
    box.appendChild(h("span", { class: "banner-icon", "aria-hidden": "true" }, ok ? "\u2713" : "\u2717"));
    box.appendChild(h("p", null, text));
    return box;
  }

  function targetIndexes(words, ask) {
    const set = new Set();
    words.forEach((word, i) => {
      if (ask === "a" || ask === "j" || ask === "n" || ask === "v") {
        if (word.tag === ask) set.add(i);
      } else if (word.role === ask) {
        set.add(i);
      }
    });
    return set;
  }

  /* gap i sits after word i. A correct gap is a word that ended with a comma. */
  function splitCommas(sentence) {
    const words = [];
    const correct = [];
    String(sentence).split(" ").forEach((token) => {
      if (!token) return;
      const hasComma = token.indexOf(",") !== -1;
      const cleaned = token.replace(/,/g, "");
      if (!cleaned) return;
      if (hasComma) correct.push(words.length);
      words.push(cleaned);
    });
    return { words: words, correct: correct };
  }

  function normAnswer(value) {
    return String(value).trim().toLowerCase().replace(/[\u2019\u2018`]/g, "'");
  }

  function answersMatch(value, accepted) {
    const normal = normAnswer(value);
    if (!normal) return false;
    return accepted.some((answer) => normAnswer(answer) === normal);
  }

  function showAnswers(list) {
    return list.map(pretty).join(" or ");
  }

  function pickCommaRound() {
    const zeros = shuffle(STUDY.commas.filter((item) => item.rule === 0));
    const rest = shuffle(STUDY.commas.filter((item) => item.rule !== 0));
    const picked = zeros.slice(0, 2).concat(rest.slice(0, 8));
    if (picked.length < 10) picked.push(...zeros.slice(2, 2 + (10 - picked.length)));
    return shuffle(picked).slice(0, 10);
  }

  function selfCheck() {
    const jojo = parseTagged("Jojo|n.NDA , throw|v the|a tiny|j orange|j cheese|n.DO .");
    if (jojo.length !== 6 || jojo[0].role !== "NDA" || jojo[0].punct !== "," || jojo[5].role !== "DO" || jojo[5].punct !== ".") {
      throw new Error("Jojo sentence did not parse");
    }
    const london = parseTagged("London's|j.PN house|n.S threw|v a|a big|j purple|j mouse|n.DO .");
    if (london[0].tag !== "j" || london[0].role !== "PN") throw new Error("possessive tag");
    if (targetIndexes(london, "j").size !== 3 || targetIndexes(london, "PN").size !== 1) {
      throw new Error("London targets");
    }
    const slept = parseTagged("The|a tired|j geese|n.S slept|v .");
    if (targetIndexes(slept, "DO").size !== 0) throw new Error("empty direct object");
    const mr = splitCommas("Thank you, Mr. Lee, for the great lesson.");
    if (mr.words[2] !== "Mr." || mr.correct.join(",") !== "1,3") throw new Error("Mr. Lee commas");
    if (splitCommas("Mom baked a pumpkin pie.").correct.length !== 0) throw new Error("rule 0 commas");
    if (splitCommas("I think, Allie, that you are right.").correct.join(",") !== "1,2") {
      throw new Error("middle commas");
    }
    if (!answersMatch(" Cat\u2019s ", ["cat's"]) || answersMatch("mouses'", ["mice's"])) {
      throw new Error("answer normalize");
    }
    if (!answersMatch("cactuses", ["cacti", "cactuses"])) throw new Error("alternatives");
    for (let n = 0; n < 12; n += 1) {
      const round = pickCommaRound();
      const zeroCount = round.filter((item) => item.rule === 0).length;
      if (round.length !== 10 || zeroCount < 2) throw new Error("comma round");
    }
  }

  function chrome(title, meta) {
    const titleEl = $("top-title");
    titleEl.textContent = "";
    titleEl.appendChild(h("span", { class: "title-text" }, title));
    const metaEl = $("top-meta");
    metaEl.textContent = meta || "";
    if (meta && meta.indexOf("/") !== -1) {
      const bits = meta.split("/");
      metaEl.setAttribute("aria-label", bits[0].trim() + " of " + bits[1].trim());
    } else {
      metaEl.removeAttribute("aria-label");
    }
    const start = $("top-start");
    start.textContent = "";
    if (currentPath() !== "/") start.appendChild(h("a", { class: "back", href: "#/" }, "Home"));
  }

  function buildNav() {
    const nav = $("desk-nav");
    MODES.forEach((mode) => {
      nav.appendChild(h("a", { href: "#" + mode.path, "data-path": mode.path }, mode.name));
    });
  }

  function syncNav(path) {
    document.querySelectorAll("#desk-nav a").forEach((link) => {
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
        { type: "button", class: item.primary ? "bar-btn primary" : "bar-btn", disabled: !!item.disabled },
        item.label
      );
      button.addEventListener("click", () => {
        if (!item.disabled) run(item.on, item.top);
      });
      bar.appendChild(button);
    });
  }

  function currentPath() {
    let raw = (location.hash || "").replace(/^#/, "");
    if (!raw || raw === "/") return "/";
    if (raw.charAt(0) !== "/") raw = "/" + raw;
    return raw.split("?")[0].replace(/\/+$/, "") || "/";
  }

  function endScreen(view, opts) {
    chrome(opts.title, opts.correct + " / " + opts.total);
    view.appendChild(h("h2", null, "Round done"));
    const score = h("p", { class: "score" }, opts.correct + " / " + opts.total);
    score.setAttribute("aria-label", opts.correct + " out of " + opts.total);
    view.appendChild(score);
    view.appendChild(h("p", null, opts.note || scoreNote(opts.correct, opts.total)));
    if (opts.extra) view.appendChild(opts.extra);
    if (opts.blocks && opts.blocks.length) {
      view.appendChild(h("h3", null, opts.missedTitle || "Look again"));
      opts.blocks.forEach((block) => view.appendChild(block));
    }
    const again = h("button", { type: "button", class: "btn primary" }, "Play again");
    again.addEventListener("click", () => run(opts.again, true));
    view.appendChild(h("div", { class: "end-actions" }, again));
    actions.primary = opts.again;
    setBar([{ label: "Play again", primary: true, top: true, on: opts.again }]);
  }

  /* ---------- Home ---------- */

  function renderHome(view) {
    chrome(STUDY.test.name, "");
    view.appendChild(
      para("Allie\u2019s grammar notes, turned into games. Everything on the Nouns Quiz #2 sheet is here.", "lead")
    );
    const last = STUDY.learn[STUDY.learn.length - 1];
    const heroSrc = last.examples[last.examples.length - 1];
    view.appendChild(
      h("div", { class: "hero" }, sentenceView(heroSrc, {
        symbols: true,
        labels: true,
        groupLabel: "Example from the notes",
      }))
    );

    const grid = h("div", { class: "modes" });
    MODES.forEach((mode, index) => {
      const link = h("a", { class: "mode-card", href: "#" + mode.path });
      link.appendChild(h("span", { class: "mode-num", "aria-hidden": "true" }, String(index + 1)));
      const copy = h("span", { class: "mode-copy" });
      copy.appendChild(h("strong", null, mode.name));
      copy.appendChild(h("span", null, mode.blurb));
      link.appendChild(copy);
      grid.appendChild(link);
    });
    view.appendChild(grid);

    const how = h("section", { class: "section" });
    how.appendChild(h("h2", null, "How to study"));
    const steps = h("ol", { class: "steps" });
    STUDY.plan.steps.forEach((step) => {
      const item = h("li");
      item.appendChild(h("strong", null, step[0]));
      item.appendChild(document.createTextNode(" "));
      item.appendChild(rich(step[1]));
      steps.appendChild(item);
    });
    how.appendChild(steps);
    view.appendChild(how);

    const big = h("section", { class: "section" });
    big.appendChild(h("h2", null, "The big five"));
    const bigList = h("ol", { class: "big-five" });
    STUDY.plan.big.forEach((line) => bigList.appendChild(liRich(line)));
    big.appendChild(bigList);
    view.appendChild(big);

    const quiz = h("section", { class: "section" });
    quiz.appendChild(h("h2", null, "What\u2019s on the quiz"));
    const covers = h("ul", { class: "covers" });
    STUDY.test.covers.forEach((line) => covers.appendChild(liRich(line)));
    quiz.appendChild(covers);
    quiz.appendChild(h("h3", null, "Parts"));
    const parts = h("ol", { class: "parts" });
    STUDY.test.parts.forEach((line) => parts.appendChild(liRich(line)));
    quiz.appendChild(parts);
    view.appendChild(quiz);

    const foot = h("footer", { class: "home-foot" });
    const mountPoint = h("div", { class: "offline-mount" });
    foot.appendChild(mountPoint);
    foot.appendChild(
      h(
        "p",
        { class: "install-note" },
        "Add it to your home screen: Share, then Add to Home Screen (iPhone), or the browser menu, then Install app (Android/Chrome)."
      )
    );
    foot.appendChild(h("p", null, h("a", { class: "guides-link", href: "../" }, "All study guides")));
    view.appendChild(foot);
    if (window.StudyOffline) window.StudyOffline.mount(mountPoint);
    setBar(null);
  }

  /* ---------- Crash Course ---------- */

  function renderLearn(view) {
    const cards = STUDY.learn;
    const i = Math.max(0, Math.min(state.learnI, cards.length - 1));
    state.learnI = i;
    const card = cards[i];
    chrome("Crash Course", i + 1 + " / " + cards.length);
    view.appendChild(h("h2", null, card.title));
    if (i === 0) view.appendChild(legendEl());
    card.paragraphs.forEach((text) => view.appendChild(para(text)));
    if (card.examples && card.examples.length) {
      const wrap = h("div", { class: "examples" });
      card.examples.forEach((example) => {
        wrap.appendChild(sentenceView(example, { symbols: true, labels: true, groupLabel: "Example" }));
      });
      view.appendChild(wrap);
    }
    if (card.hook) view.appendChild(hookNote(card.hook));

    const go = (delta) => {
      const next = state.learnI + delta;
      if (next < 0 || next >= cards.length) return;
      state.learnI = next;
      render();
    };
    actions.prev = () => go(-1);
    actions.next = () => go(1);
    actions.primary = i === cards.length - 1 ? null : actions.next;
    setBar([
      { label: "Prev", disabled: i === 0, on: actions.prev },
      { label: "Next", primary: true, disabled: i === cards.length - 1, on: actions.next },
    ]);
  }

  /* ---------- Draw the Symbols ---------- */

  function startSymbols() {
    state.symbols = {
      round: shuffle(STUDY.find.map((item) => item.s)).slice(0, 8),
      i: 0,
      slots: null,
      palette: "",
      checked: false,
      marks: null,
      pnNote: "",
      correct: 0,
      missed: [],
      phase: "ask",
    };
  }

  function renderSymbols(view) {
    if (!state.symbols) startSymbols();
    const st = state.symbols;
    if (st.phase === "done") {
      const blocks = st.missed.map((tagged) => {
        const card = h("div", { class: "miss-card" });
        card.appendChild(sentenceView(tagged, { symbols: true, labels: true, groupLabel: "Answer" }));
        return card;
      });
      endScreen(view, {
        title: "Draw the Symbols",
        correct: st.correct,
        total: st.round.length,
        blocks: blocks,
        missedTitle: "Sentences to mark again",
        again: () => {
          startSymbols();
          render();
        },
      });
      return;
    }

    const tagged = st.round[st.i];
    const words = parseTagged(tagged);
    if (!st.slots || st.slots.length !== words.length) {
      st.slots = words.map(() => "");
      st.checked = false;
      st.marks = null;
      st.pnNote = "";
    }
    chrome("Draw the Symbols", st.i + 1 + " / " + st.round.length);

    if (!st.checked) {
      view.appendChild(para("Tap a stamp, then tap a word. Or tap a word to cycle noun, adjective, article, verb.", "quiet"));
      const palette = h("div", { class: "palette", role: "group", "aria-label": "Symbol stamps" });
      STUDY.symbols.forEach((sym) => {
        const pressed = st.palette === sym.tag;
        const button = h("button", {
          type: "button",
          class: "stamp" + (pressed ? " is-on" : ""),
          "aria-pressed": pressed ? "true" : "false",
          "data-focus": "palette-" + sym.tag,
        });
        const icon = h("span", { class: "stamp-icon", "aria-hidden": "true" });
        icon.appendChild(symbolSvg(sym.tag));
        button.appendChild(icon);
        button.appendChild(h("span", { class: "stamp-name" }, sym.name));
        button.addEventListener("click", () => {
          st.palette = pressed ? "" : sym.tag;
          say(st.palette ? sym.name + " stamp selected." : "Stamp turned off. Tapping a word cycles the symbols.");
          render();
        });
        palette.appendChild(button);
      });
      view.appendChild(palette);
    } else {
      view.appendChild(banner(!!st.ok, st.ok ? "Correct" : "Not quite"));
    }

    view.appendChild(sentenceView(tagged, {
      slots: st.slots,
      tappable: !st.checked,
      marks: st.marks,
      onTap: (index) => stampWord(index),
      groupLabel: st.checked ? "Your marks" : "Mark each word",
    }));

    if (st.checked && st.pnNote) view.appendChild(h("p", { class: "callout" }, st.pnNote));
    if (st.checked) {
      view.appendChild(h("p", { class: "answer-label" }, "Answer"));
      view.appendChild(sentenceView(tagged, { symbols: true, labels: true, groupLabel: "Answer" }));
    }

    const check = () => checkSymbols();
    const next = () => {
      if (st.i + 1 >= st.round.length) {
        st.phase = "done";
        say("Round done. " + st.correct + " out of " + st.round.length + ".");
      } else {
        st.i += 1;
        st.slots = null;
      }
      render();
    };
    actions.primary = st.checked ? next : check;
    actions.next = st.checked ? next : null;
    setBar(st.checked
      ? [{ label: st.i === st.round.length - 1 ? "Finish" : "Next", primary: true, on: next }]
      : [{ label: "Check", primary: true, on: check }]);
  }

  function stampWord(index) {
    const st = state.symbols;
    if (!st || st.checked) return;
    const words = parseTagged(st.round[st.i]);
    if (!takesSymbol(words[index])) return;
    if (st.palette) st.slots[index] = st.slots[index] === st.palette ? "" : st.palette;
    else st.slots[index] = cycleTag(st.slots[index]);
    render();
  }

  function checkSymbols() {
    const st = state.symbols;
    if (!st || st.checked) return;
    const words = parseTagged(st.round[st.i]);
    const named = [];
    let allRight = true;
    st.marks = words.map((word, index) => {
      if (!takesSymbol(word)) return "";
      const placed = st.slots[index] || "";
      const ok = placed === word.tag;
      if (!ok) allRight = false;
      /* Possessive nouns are tagged j. A black triangle on one gets a direct note. */
      if (word.role === "PN" && placed === "n") named.push(pretty(word.text));
      return ok ? "right" : "wrong";
    });
    st.checked = true;
    st.ok = allRight;
    st.pnNote = named.length
      ? named.join(", ") + ". Possessive nouns are really adjectives, so they get a blue triangle."
      : "";
    if (allRight) st.correct += 1;
    else st.missed.push(st.round[st.i]);
    say(allRight ? "Correct. Every symbol matches." : "Not quite. " + (st.pnNote || "Compare your marks with the answer."));
    render();
  }

  /* ---------- Find It ---------- */

  function startFind() {
    const all = [];
    STUDY.find.forEach((item) => {
      item.asks.forEach((ask) => all.push({ s: item.s, ask: ask }));
    });
    const round = shuffle(all).slice(0, 12);
    state.find = {
      round: round,
      original: round.length,
      i: 0,
      selected: new Set(),
      none: false,
      hint: false,
      checked: false,
      ok: false,
      correct: 0,
      redoCorrect: 0,
      missed: [],
      phase: "ask",
    };
  }

  function renderFind(view) {
    if (!state.find) startFind();
    const st = state.find;
    if (st.phase === "done") {
      const extra = st.missed.length
        ? h("p", null, "Second try: " + st.redoCorrect + " / " + st.missed.length + ".")
        : null;
      const blocks = st.missed.map((item) => {
        const card = h("div", { class: "miss-card" });
        card.appendChild(h("p", { class: "prompt" }, pretty(STUDY.askText[item.ask])));
        card.appendChild(sentenceView(item.s, { symbols: true, labels: true, groupLabel: "Answer" }));
        card.appendChild(h("p", { class: "why" }, pretty(STUDY.askHelp[item.ask])));
        return card;
      });
      endScreen(view, {
        title: "Find It",
        correct: st.correct,
        total: st.original,
        extra: extra,
        blocks: blocks,
        missedTitle: "Missed sentences",
        again: () => {
          startFind();
          render();
        },
      });
      return;
    }

    const q = st.round[st.i];
    const words = parseTagged(q.s);
    const target = targetIndexes(words, q.ask);
    chrome("Find It", st.i + 1 + " / " + st.round.length);
    if (st.i === 0 && !st.checked) view.appendChild(para("Missed questions come back once at the end.", "quiet"));
    view.appendChild(h("p", { class: "prompt" }, pretty(STUDY.askText[q.ask])));

    if (!st.checked) {
      const hint = h("button", {
        type: "button",
        class: "chip",
        "aria-pressed": st.hint ? "true" : "false",
        "aria-expanded": st.hint ? "true" : "false",
      }, "Hint");
      hint.addEventListener("click", () => {
        st.hint = !st.hint;
        render();
      });
      view.appendChild(h("div", { class: "row-actions" }, hint));
      if (st.hint) view.appendChild(h("p", { class: "help" }, pretty(STUDY.askHelp[q.ask])));
    }

    const marks = st.checked ? findMarks(words, target, st.selected) : null;
    view.appendChild(sentenceView(q.s, {
      chips: true,
      tappable: !st.checked,
      selected: st.selected,
      marks: marks,
      onTap: (index) => toggleFind(index),
      groupLabel: plainSentence(q.s),
    }));

    if (q.ask === "DO" || q.ask === "NDA") {
      const label = q.ask === "DO" ? "No direct object" : "None";
      let noneClass = "chip";
      if (st.checked) {
        if (st.none && target.size === 0) noneClass += " is-right";
        else if (st.none && target.size > 0) noneClass += " is-wrong";
        else if (!st.none && target.size === 0 && !st.ok) noneClass += " is-miss";
      }
      const none = h("button", {
        type: "button",
        class: noneClass,
        "aria-pressed": st.none ? "true" : "false",
        disabled: st.checked,
      }, label);
      none.addEventListener("click", () => {
        st.none = !st.none;
        if (st.none) st.selected = new Set();
        render();
      });
      view.appendChild(h("div", { class: "row-actions" }, none));
    }

    if (st.checked) {
      view.appendChild(banner(st.ok, st.ok ? "Correct" : "Not quite"));
      view.appendChild(h("p", { class: "why" }, pretty(STUDY.askHelp[q.ask])));
      view.appendChild(h("p", { class: "answer-label" }, "Answer"));
      view.appendChild(sentenceView(q.s, { symbols: true, labels: true, groupLabel: "Answer" }));
    }

    const check = () => checkFind();
    const next = () => advance(st);
    actions.primary = st.checked ? next : check;
    actions.next = st.checked ? next : null;
    setBar(st.checked
      ? [{ label: st.i === st.round.length - 1 ? "Finish" : "Next", primary: true, on: next }]
      : [{ label: "Check", primary: true, on: check }]);
  }

  function findMarks(words, target, selected) {
    return words.map((word, index) => {
      const picked = selected.has(index);
      const hit = target.has(index);
      if (picked && hit) return "right";
      if (picked && !hit) return "wrong";
      if (!picked && hit) return "miss";
      return "";
    });
  }

  function toggleFind(index) {
    const st = state.find;
    if (!st || st.checked) return;
    st.none = false;
    if (st.selected.has(index)) st.selected.delete(index);
    else st.selected.add(index);
    render();
  }

  function checkFind() {
    const st = state.find;
    if (!st || st.checked) return;
    const q = st.round[st.i];
    const words = parseTagged(q.s);
    const target = targetIndexes(words, q.ask);
    /* Empty selection matches an empty target. The none-toggle is the explicit way, and it is required in the prompt. */
    const ok = sameSet(st.selected, target) || (st.none && target.size === 0);
    st.checked = true;
    st.ok = ok;
    if (q.redo) {
      if (ok) st.redoCorrect += 1;
    } else if (ok) {
      st.correct += 1;
    } else {
      st.missed.push({ s: q.s, ask: q.ask });
      st.round.push({ s: q.s, ask: q.ask, redo: true });
    }
    say((ok ? "Correct. " : "Not quite. ") + STUDY.askHelp[q.ask]);
    render();
  }

  function advance(st) {
    if (st.i + 1 >= st.round.length) {
      st.phase = "done";
      const total = st.original || st.round.length;
      say("Round done. " + st.correct + " out of " + total + ".");
    } else {
      st.i += 1;
      st.selected = new Set();
      st.none = false;
      st.hint = false;
      st.checked = false;
      st.ok = false;
    }
    render();
  }

  /* ---------- Commas ---------- */

  function startCommas() {
    const round = pickCommaRound();
    state.commas = {
      round: round,
      original: round.length,
      i: 0,
      picks: new Set(),
      checked: false,
      ok: false,
      correct: 0,
      redoCorrect: 0,
      missed: [],
      phase: "ask",
    };
  }

  function renderCommas(view) {
    if (!state.commas) startCommas();
    const st = state.commas;
    if (st.phase === "done") {
      const extra = st.missed.length
        ? h("p", null, "Second try: " + st.redoCorrect + " / " + st.missed.length + ".")
        : null;
      const blocks = st.missed.map((item) => {
        const card = h("div", { class: "miss-card" });
        card.appendChild(commaAnswer(item));
        card.appendChild(h("p", { class: "rule-line" }, pretty(STUDY.ruleText[item.rule])));
        if (item.why) card.appendChild(h("p", { class: "why" }, pretty(item.why)));
        return card;
      });
      endScreen(view, {
        title: "Commas",
        correct: st.correct,
        total: st.original,
        extra: extra,
        blocks: blocks,
        missedTitle: "Sentences to try again",
        again: () => {
          startCommas();
          render();
        },
      });
      return;
    }

    const item = st.round[st.i];
    const split = splitCommas(item.s);
    chrome("Commas", st.i + 1 + " / " + st.round.length);
    if (st.i === 0 && !st.checked) {
      view.appendChild(para("Tap the gaps where a comma belongs. No commas is a real answer. Misses come back once.", "quiet"));
    }
    view.appendChild(commaLine(split, st));
    if (st.checked) {
      view.appendChild(banner(st.ok, st.ok ? "Correct" : "Not quite"));
      view.appendChild(h("p", { class: "answer-label" }, "Answer"));
      view.appendChild(commaAnswer(item));
      view.appendChild(h("p", { class: "rule-line" }, pretty(STUDY.ruleText[item.rule])));
      if (item.why) view.appendChild(h("p", { class: "why" }, pretty(item.why)));
    }

    const check = () => checkCommas();
    const next = () => {
      if (st.i + 1 >= st.round.length) {
        st.phase = "done";
        say("Round done. " + st.correct + " out of " + st.original + ".");
      } else {
        st.i += 1;
        st.picks = new Set();
        st.checked = false;
        st.ok = false;
      }
      render();
    };
    actions.primary = st.checked ? next : check;
    actions.next = st.checked ? next : null;
    setBar(st.checked
      ? [{ label: st.i === st.round.length - 1 ? "Finish" : "Next", primary: true, on: next }]
      : [{ label: "Check", primary: true, on: check }]);
  }

  function commaLine(split, st) {
    const line = h("div", { class: "comma-line", role: "group", "aria-label": "Put commas in the gaps" });
    split.words.forEach((word, index) => {
      line.appendChild(h("span", { class: "c-word" }, pretty(word)));
      if (index >= split.words.length - 1) return;
      const on = st.picks.has(index);
      const should = split.correct.indexOf(index) !== -1;
      let cls = "gap";
      let note = "";
      if (st.checked) {
        if (on && should) {
          cls += " is-right";
          note = "Right";
        } else if (on && !should) {
          cls += " is-wrong";
          note = "Wrong";
        } else if (!on && should) {
          cls += " is-miss";
          note = "Missed";
        }
      }
      const button = h("button", {
        type: "button",
        class: cls,
        "aria-pressed": on ? "true" : "false",
        "data-focus": "gap-" + index,
        disabled: st.checked,
      });
      const spoken = (on ? "Comma after " : "No comma after ") + pretty(word) + (note ? ", " + note.toLowerCase() : "");
      button.setAttribute("aria-label", spoken);
      const slot = h("span", { class: "gap-slot", "aria-hidden": "true" });
      if (on) slot.appendChild(h("span", { class: "gap-comma" }, ","));
      button.appendChild(slot);
      if (note) {
        button.appendChild(h("span", { class: "gap-note", "aria-hidden": "true" }, note === "Right" ? "\u2713" : note === "Wrong" ? "\u2717" : "miss"));
      }
      button.addEventListener("click", () => {
        if (st.checked) return;
        if (st.picks.has(index)) st.picks.delete(index);
        else st.picks.add(index);
        render();
      });
      line.appendChild(button);
    });
    return line;
  }

  function commaAnswer(item) {
    const p = h("p", { class: "answer-sentence" });
    const sentence = pretty(item.s);
    const nda = item.nda ? pretty(item.nda) : "";
    const start = nda ? sentence.indexOf(nda) : -1;
    const chunks = [];
    if (start < 0) chunks.push([sentence, false]);
    else {
      chunks.push([sentence.slice(0, start), false]);
      chunks.push([sentence.slice(start, start + nda.length), true]);
      chunks.push([sentence.slice(start + nda.length), false]);
    }
    chunks.forEach((chunk) => {
      const parts = chunk[0].split(",");
      parts.forEach((part, index) => {
        if (part && chunk[1]) {
          const wrap = h("span", { class: "nda-hit" });
          wrap.appendChild(document.createTextNode(part));
          wrap.appendChild(h("span", { class: "nda-label" }, STUDY.roles.NDA.label));
          p.appendChild(wrap);
        } else if (part) {
          p.appendChild(document.createTextNode(part));
        }
        if (index < parts.length - 1) p.appendChild(h("span", { class: "comma-hit" }, ","));
      });
    });
    return p;
  }

  function checkCommas() {
    const st = state.commas;
    if (!st || st.checked) return;
    const item = st.round[st.i];
    const correct = new Set(splitCommas(item.s).correct);
    const ok = sameSet(st.picks, correct);
    st.checked = true;
    st.ok = ok;
    if (item.redo) {
      if (ok) st.redoCorrect += 1;
    } else if (ok) {
      st.correct += 1;
    } else {
      st.missed.push(item);
      st.round.push(Object.assign({}, item, { redo: true }));
    }
    say((ok ? "Correct. " : "Not quite. ") + STUDY.ruleText[item.rule]);
    render();
  }

  /* ---------- The Chart ---------- */

  function chartPool() {
    const rows = STUDY.chart.filter((row) => !state.chart.notesOnly || row.notes);
    return shuffle(rows);
  }

  function startChartRound() {
    const chart = state.chart;
    chart.round = chartPool();
    chart.i = 0;
    chart.answers = ["", "", ""];
    chart.checked = false;
    chart.results = null;
    chart.correct = 0;
    chart.missed = [];
    chart.phase = chart.round.length ? "ask" : "done";
    chart.focusedOnce = false;
  }

  function renderChart(view) {
    const chart = state.chart;
    if (chart.view === "practice" && !chart.round) startChartRound();
    const asking = chart.view === "practice" && chart.phase !== "done" && chart.round;
    chrome("The Chart", asking ? chart.i + 1 + " / " + chart.round.length : "");

    if (chart.view === "all") {
      view.appendChild(chartSegment());
      renderChartTable(view);
      setBar(null);
      return;
    }

    if (chart.phase === "done") {
      const blocks = chart.missed.map((row) => {
        const card = h("div", { class: "miss-card" });
        card.appendChild(h("p", { class: "prompt" }, pretty(row.sing)));
        card.appendChild(para(
          "Plural: " + showAnswers(row.plural)
          + ". Singular possessive: " + showAnswers(row.singPoss)
          + ". Plural possessive: " + showAnswers(row.pluralPoss)
          + "."
        ));
        card.appendChild(h("p", { class: "tip" }, pretty(row.tip)));
        return card;
      });
      endScreen(view, {
        title: "The Chart",
        correct: chart.correct,
        total: chart.round.length,
        blocks: blocks,
        missedTitle: "Words to practice",
        again: () => {
          startChartRound();
          render();
        },
      });
      view.insertBefore(notesToggle(), view.firstChild);
      view.insertBefore(chartSegment(), view.firstChild);
      return;
    }

    view.appendChild(chartSegment());
    view.appendChild(notesToggle());
    renderChartAsk(view);
  }

  function chartSegment() {
    const bar = h("div", { class: "segment", role: "tablist", "aria-label": "Chart view" });
    [["practice", "Practice"], ["all", "Whole chart"]].forEach((item) => {
      const on = state.chart.view === item[0];
      const button = h("button", {
        type: "button",
        role: "tab",
        "aria-selected": on ? "true" : "false",
        "data-focus": "chart-" + item[0],
      }, item[1]);
      button.addEventListener("click", () => {
        state.chart.view = item[0];
        render();
      });
      bar.appendChild(button);
    });
    return bar;
  }

  function notesToggle() {
    const label = h("label", { class: "notes-toggle" });
    const input = h("input", {
      type: "checkbox",
      checked: state.chart.notesOnly,
      "data-focus": "notes-only",
    });
    input.addEventListener("change", () => {
      state.chart.notesOnly = input.checked;
      startChartRound();
      say(input.checked ? "Only words from your notes." : "Every word on the chart.");
      render();
    });
    label.appendChild(input);
    label.appendChild(document.createTextNode("Only words from my notes"));
    return label;
  }

  function renderChartAsk(view) {
    const chart = state.chart;
    const row = chart.round[chart.i];
    chartInputs = [];
    view.appendChild(h("p", { class: "sing-label" }, "Singular"));
    view.appendChild(h("p", { class: "sing-word hand" }, pretty(row.sing)));

    CHART_FIELDS.forEach((field, index) => {
      const wrap = h("div", { class: "field" });
      const id = "chart-" + field[0];
      wrap.appendChild(h("label", { for: id }, field[1]));
      const input = h("input", {
        id: id,
        type: "text",
        value: chart.answers[index] || "",
        autocapitalize: "off",
        autocorrect: "off",
        spellcheck: "false",
        autocomplete: "off",
        readonly: chart.checked,
      });
      if (chart.checked && chart.results) {
        input.classList.add(chart.results[index].ok ? "is-right" : "is-wrong");
        input.setAttribute("aria-invalid", chart.results[index].ok ? "false" : "true");
        input.setAttribute("aria-describedby", id + "-result");
      }
      input.addEventListener("focus", () => {
        chart.focusIndex = index;
        chart.focusedOnce = true;
      });
      input.addEventListener("blur", () => {
        chart.focusIndex = index;
        chart.caret = input.selectionStart || 0;
        chart.caretEnd = input.selectionEnd || 0;
        chart.focusedOnce = true;
        chart.answers[index] = input.value;
      });
      input.addEventListener("input", () => {
        chart.answers[index] = input.value;
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          checkChart();
        }
      });
      chartInputs[index] = input;
      wrap.appendChild(input);
      if (chart.checked && chart.results) {
        const result = chart.results[index];
        wrap.appendChild(h("p", {
          id: id + "-result",
          class: "field-result " + (result.ok ? "is-right" : "is-wrong"),
        }, (result.ok ? "\u2713 Right. " : "\u2717 Wrong. ") + result.shown));
      }
      view.appendChild(wrap);
    });

    if (!chart.checked) {
      const key = h("button", { type: "button", class: "apos-key" }, "Insert \u2019");
      key.setAttribute("aria-label", "Insert apostrophe");
      /* Keep the caret in the field. The click still inserts. */
      key.addEventListener("mousedown", (event) => event.preventDefault());
      key.addEventListener("click", insertApostrophe);
      view.appendChild(key);
    } else {
      view.appendChild(h("p", { class: "tip" }, pretty(row.tip)));
    }

    const next = () => {
      if (chart.i + 1 >= chart.round.length) {
        chart.phase = "done";
        say("Round done. " + chart.correct + " out of " + chart.round.length + ".");
      } else {
        chart.i += 1;
        chart.answers = ["", "", ""];
        chart.checked = false;
        chart.results = null;
        chart.focusedOnce = false;
      }
      render();
    };
    actions.primary = chart.checked ? next : () => checkChart();
    actions.next = chart.checked ? next : null;
    setBar(chart.checked
      ? [{ label: chart.i === chart.round.length - 1 ? "Finish" : "Next", primary: true, on: next }]
      : [{ label: "Check", primary: true, on: () => checkChart() }]);
  }

  function insertApostrophe() {
    const chart = state.chart;
    if (chart.checked) return;
    const index = chart.focusIndex || 0;
    const input = chartInputs[index] || chartInputs[0];
    if (!input) return;
    const value = input.value;
    let start;
    let end;
    if (document.activeElement === input && input.selectionStart != null) {
      start = input.selectionStart;
      end = input.selectionEnd;
    } else if (chart.focusedOnce) {
      start = chart.caret;
      end = chart.caretEnd;
    } else {
      start = value.length;
      end = value.length;
    }
    if (start == null) start = value.length;
    if (end == null) end = start;
    const mark = "\u2019";
    input.value = value.slice(0, start) + mark + value.slice(end);
    const pos = start + mark.length;
    chart.answers[index] = input.value;
    chart.caret = pos;
    chart.caretEnd = pos;
    chart.focusedOnce = true;
    chart.focusIndex = index;
    input.focus();
    input.setSelectionRange(pos, pos);
  }

  function checkChart() {
    const chart = state.chart;
    if (chart.view !== "practice" || chart.phase === "done" || chart.checked) return;
    const row = chart.round[chart.i];
    const values = CHART_FIELDS.map((field, index) => {
      const input = chartInputs[index];
      return input && input.isConnected ? input.value : chart.answers[index] || "";
    });
    chart.answers = values.slice();
    chart.results = CHART_FIELDS.map((field, index) => {
      const ok = answersMatch(values[index], row[field[0]]);
      return { ok: ok, shown: showAnswers(row[field[0]]) };
    });
    chart.checked = true;
    const allRight = chart.results.every((result) => result.ok);
    if (allRight) chart.correct += 1;
    else chart.missed.push(row);
    say((allRight ? "Correct. " : "Not quite. ") + row.tip);
    render();
  }

  function renderChartTable(view) {
    const scroller = h("div", { class: "chart-scroll" });
    const table = h("table");
    const caption = h("caption", { class: "visually-hidden" }, "Plurals and possessives");
    table.appendChild(caption);
    const head = h("thead");
    head.appendChild(h("tr", null, [
      h("th", { scope: "col" }, "Singular"),
      h("th", { scope: "col" }, "Plural"),
      h("th", { scope: "col" }, "Singular possessive"),
      h("th", { scope: "col" }, "Plural possessive"),
    ]));
    table.appendChild(head);
    const body = h("tbody");
    STUDY.chart.forEach((row) => {
      const singular = h("td");
      singular.appendChild(document.createTextNode(pretty(row.sing)));
      if (row.notes) singular.appendChild(h("span", { class: "in-notes" }, "in notes"));
      body.appendChild(h("tr", null, [
        singular,
        answerCell(row.plural),
        answerCell(row.singPoss),
        answerCell(row.pluralPoss),
      ]));
    });
    table.appendChild(body);
    scroller.appendChild(table);
    view.appendChild(scroller);
    view.appendChild(h(
      "p",
      { class: "rule-card" },
      "Make it singular or plural first, then possessive. One owner: \u2019s. Plural ending in s: \u2019. Plural not ending in s: \u2019s."
    ));
  }

  function answerCell(list) {
    const cell = h("td");
    cell.appendChild(h("span", { class: "main-ans" }, pretty(list[0])));
    if (list.length > 1) cell.appendChild(h("span", { class: "alt" }, "or " + list.slice(1).map(pretty).join(" or ")));
    return cell;
  }

  /* ---------- Sort It ---------- */

  function binById(id) {
    return STUDY.sortBins.find((bin) => bin[0] === id);
  }

  function startSort() {
    state.sort = {
      round: shuffle(STUDY.sort).slice(0, 15),
      i: 0,
      pick: "",
      correct: 0,
      missed: [],
      phase: "ask",
    };
  }

  function renderSort(view) {
    if (!state.sort) startSort();
    const st = state.sort;
    if (st.phase === "done") {
      const blocks = st.missed.map((item) => {
        const bin = binById(item.bin);
        const card = h("div", { class: "miss-card" });
        card.appendChild(h("p", { class: "prompt" }, pretty(item.w) + " \u2014 " + bin[1]));
        card.appendChild(h("p", null, pretty(item.why)));
        return card;
      });
      endScreen(view, {
        title: "Sort It",
        correct: st.correct,
        total: st.round.length,
        blocks: blocks,
        missedTitle: "Missed words",
        again: () => {
          startSort();
          render();
        },
      });
      return;
    }

    const item = st.round[st.i];
    chrome("Sort It", st.i + 1 + " / " + st.round.length);
    view.appendChild(h("p", { class: "sort-word hand" }, pretty(item.w)));
    const bins = h("div", { class: "bins" });
    STUDY.sortBins.forEach((bin) => {
      const picked = st.pick === bin[0];
      const right = st.pick && item.bin === bin[0];
      let cls = "bin";
      if (st.pick && right) cls += " is-right";
      else if (picked) cls += " is-wrong";
      const button = h("button", { type: "button", class: cls, disabled: !!st.pick });
      button.appendChild(h("strong", null, bin[1]));
      button.appendChild(h("span", null, bin[2]));
      if (st.pick && right) button.appendChild(h("span", { class: "mark-text mark-right" }, "\u2713 Right"));
      else if (picked) button.appendChild(h("span", { class: "mark-text mark-wrong" }, "\u2717 Wrong"));
      button.addEventListener("click", () => pickSort(bin[0]));
      bins.appendChild(button);
    });
    view.appendChild(bins);
    if (st.pick) {
      const ok = st.pick === item.bin;
      view.appendChild(banner(ok, ok ? "Correct" : "Not quite"));
      view.appendChild(h("p", { class: "why" }, pretty(item.why)));
    }
    const next = () => {
      if (st.i + 1 >= st.round.length) {
        st.phase = "done";
        say("Round done. " + st.correct + " out of " + st.round.length + ".");
      } else {
        st.i += 1;
        st.pick = "";
      }
      render();
    };
    actions.next = st.pick ? next : null;
    actions.primary = actions.next;
    setBar([{
      label: st.i === st.round.length - 1 ? "Finish" : "Next",
      primary: true,
      disabled: !st.pick,
      on: next,
    }]);
  }

  function pickSort(id) {
    const st = state.sort;
    if (!st || st.pick) return;
    const item = st.round[st.i];
    st.pick = id;
    const ok = id === item.bin;
    if (ok) st.correct += 1;
    else st.missed.push(item);
    say((ok ? "Correct. " : "Not quite. ") + item.why);
    render();
  }

  /* ---------- True or False ---------- */

  function startTf() {
    const round = shuffle(STUDY.tf).slice(0, 15).map((item) => ({ t: item.t, a: item.a, why: item.why }));
    state.tf = {
      round: round,
      original: round.length,
      i: 0,
      pick: null,
      correct: 0,
      redoCorrect: 0,
      missed: [],
      phase: "ask",
    };
  }

  function renderTf(view) {
    if (!state.tf) startTf();
    const st = state.tf;
    if (st.phase === "done") {
      const extra = st.missed.length
        ? h("p", null, "Second try: " + st.redoCorrect + " / " + st.missed.length + ".")
        : null;
      const blocks = st.missed.map((item) => {
        const card = h("div", { class: "miss-card" });
        card.appendChild(h("p", { class: "prompt" }, pretty(item.t)));
        card.appendChild(h("p", null, (item.a ? "True. " : "False. ") + pretty(item.why)));
        return card;
      });
      endScreen(view, {
        title: "True or False",
        correct: st.correct,
        total: st.original,
        extra: extra,
        blocks: blocks,
        missedTitle: "Missed statements",
        again: () => {
          startTf();
          render();
        },
      });
      return;
    }

    const item = st.round[st.i];
    chrome("True or False", st.i + 1 + " / " + st.round.length);
    if (st.i === 0 && st.pick == null) view.appendChild(para("Missed ones come back once at the end.", "quiet"));
    view.appendChild(h("p", { class: "tf-line" }, pretty(item.t)));
    const row = h("div", { class: "tf-row" });
    [true, false].forEach((value) => {
      const label = value ? "True" : "False";
      let cls = "tf-btn";
      let tag = "";
      if (st.pick != null) {
        if (value === item.a) {
          cls += " is-right";
          tag = "\u2713 Right";
        } else if (value === st.pick) {
          cls += " is-wrong";
          tag = "\u2717 Wrong";
        }
      }
      const button = h("button", { type: "button", class: cls, disabled: st.pick != null }, label);
      if (tag) button.appendChild(h("span", { class: "mark-text" }, " " + tag));
      button.addEventListener("click", () => pickTf(value));
      row.appendChild(button);
    });
    view.appendChild(row);
    if (st.pick != null) {
      const ok = st.pick === item.a;
      view.appendChild(banner(ok, ok ? "Correct" : "Not quite"));
      view.appendChild(h("p", { class: "why" }, pretty(item.why)));
    }
    const next = () => {
      if (st.i + 1 >= st.round.length) {
        st.phase = "done";
        say("Round done. " + st.correct + " out of " + st.original + ".");
      } else {
        st.i += 1;
        st.pick = null;
      }
      render();
    };
    actions.next = st.pick != null ? next : null;
    actions.primary = actions.next;
    setBar([{
      label: st.i === st.round.length - 1 ? "Finish" : "Next",
      primary: true,
      disabled: st.pick == null,
      on: next,
    }]);
  }

  function pickTf(value) {
    const st = state.tf;
    if (!st || st.pick != null) return;
    const item = st.round[st.i];
    st.pick = value;
    const ok = value === item.a;
    if (item.redo) {
      if (ok) st.redoCorrect += 1;
    } else if (ok) {
      st.correct += 1;
    } else {
      st.missed.push({ t: item.t, a: item.a, why: item.why });
      st.round.push({ t: item.t, a: item.a, why: item.why, redo: true });
    }
    say((ok ? "Correct. " : "Not quite. ") + item.why);
    render();
  }

  /* ---------- Write It ---------- */

  function writeNotes(text) {
    const trimmed = text.trim();
    if (!trimmed) return ["Try writing one first, then check it."];
    const notes = [];
    if (!/^[A-Z]/.test(trimmed)) notes.push("Start with a capital letter.");
    if (!/[.!?]$/.test(trimmed)) notes.push("End with . ! or ?");
    return notes;
  }

  function renderWrite(view) {
    const items = STUDY.write;
    const i = Math.max(0, Math.min(state.write.i, items.length - 1));
    state.write.i = i;
    const item = items[i];
    chrome("Write It", i + 1 + " / " + items.length);
    view.appendChild(h("h2", null, item.p));

    if (!state.write.revealed) {
      const area = h("textarea", {
        class: "write-box",
        "aria-label": "Your sentence",
      });
      area.value = state.write.draft;
      area.addEventListener("input", () => {
        state.write.draft = area.value;
      });
      view.appendChild(area);
    } else {
      const notes = writeNotes(state.write.draft);
      if (state.write.draft.trim()) {
        const echo = h("blockquote", { class: "echo" });
        echo.appendChild(h("span", { class: "echo-label" }, "What you wrote"));
        echo.appendChild(h("p", null, state.write.draft));
        view.appendChild(echo);
      }
      notes.forEach((note) => view.appendChild(h("p", { class: "advice" }, note)));
      const box = h("fieldset", { class: "checks" });
      box.appendChild(h("legend", null, "Check it yourself"));
      item.checks.forEach((line) => {
        const label = h("label", { class: "check" });
        label.appendChild(h("input", { type: "checkbox" }));
        label.appendChild(h("span", null, pretty(line)));
        box.appendChild(label);
      });
      view.appendChild(box);
      view.appendChild(h("h3", null, "Examples"));
      item.models.forEach((model) => view.appendChild(h("p", { class: "model" }, pretty(model))));
      if (item.modelTagged) {
        view.appendChild(sentenceView(item.modelTagged, {
          symbols: true,
          labels: true,
          groupLabel: "Example with symbols",
        }));
      }
    }

    const go = (delta) => {
      const next = state.write.i + delta;
      if (next < 0 || next >= items.length) return;
      state.write.i = next;
      state.write.revealed = false;
      state.write.draft = "";
      render();
    };
    const reveal = () => {
      state.write.revealed = true;
      const notes = writeNotes(state.write.draft);
      say(notes.join(" "));
      render();
    };
    actions.prev = () => go(-1);
    actions.next = () => go(1);
    actions.primary = state.write.revealed ? (i === items.length - 1 ? null : actions.next) : reveal;
    const buttons = [{ label: "Prev", disabled: i === 0, on: actions.prev }];
    if (!state.write.revealed) buttons.push({ label: "Check it", primary: true, on: reveal });
    buttons.push({ label: "Next", primary: state.write.revealed, disabled: i === items.length - 1, on: actions.next });
    setBar(buttons);
  }

  /* ---------- Cram Sheet ---------- */

  function renderCram(view) {
    chrome("Cram Sheet", "");
    view.appendChild(legendEl());
    const grid = h("div", { class: "cram" });
    STUDY.cram.forEach((section) => {
      const block = h("section", { class: "cram-sec" });
      block.appendChild(h("h2", null, section.h));
      const list = h("ul");
      section.lines.forEach((line) => list.appendChild(liRich(line)));
      block.appendChild(list);
      grid.appendChild(block);
    });
    view.appendChild(grid);
    const fixes = h("section", { class: "fixes" });
    fixes.appendChild(h("h2", null, "Fixes to the notes"));
    const list = h("ul");
    STUDY.fixes.forEach((line) => list.appendChild(liRich(line)));
    fixes.appendChild(list);
    view.appendChild(fixes);
    setBar(null);
  }

  function renderMissing(view) {
    chrome(STUDY.test.name, "");
    view.appendChild(para("That page isn\u2019t in the notebook."));
    view.appendChild(h("a", { class: "mode-card", href: "#/" }, "Back to Nouns Quiz #2"));
    setBar(null);
  }

  const routes = {
    "/": renderHome,
    "/learn": renderLearn,
    "/symbols": renderSymbols,
    "/find": renderFind,
    "/commas": renderCommas,
    "/chart": renderChart,
    "/sort": renderSort,
    "/tf": renderTf,
    "/write": renderWrite,
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
    const firstPaint = lastPath == null;
    lastPath = path;
    const active = document.activeElement;
    const focusKey = !changed && active && active.getAttribute ? active.getAttribute("data-focus") : "";
    actions = { prev: null, next: null, primary: null };
    const view = $("view");
    view.textContent = "";
    setBar(null);
    (routes[path] || renderMissing)(view);
    if (changed || toTop) {
      window.scrollTo(0, 0);
      if (!firstPaint) {
        const title = $("top-title");
        title.setAttribute("tabindex", "-1");
        title.focus();
      }
    } else if (focusKey) {
      const next = document.querySelector('[data-focus="' + focusKey + '"]');
      if (next) next.focus();
    }
  }

  function onKey(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (event.key === "ArrowLeft") {
      if (!actions.prev) return;
      event.preventDefault();
      run(actions.prev);
    } else if (event.key === "ArrowRight") {
      if (!actions.next) return;
      event.preventDefault();
      run(actions.next);
    } else if (event.key === " " || event.key === "Enter") {
      if (event.target && event.target.closest && event.target.closest("button, a, summary")) return;
      if (!actions.primary) return;
      event.preventDefault();
      run(actions.primary);
    }
  }

  buildNav();
  try {
    selfCheck();
  } catch (err) {
    $("view").textContent = "Study page hit a problem: " + (err && err.message ? err.message : "check failed");
    throw err;
  }
  document.addEventListener("keydown", onKey);
  window.addEventListener("hashchange", render);
  render();
})();
