/* The Skeletal System — one skeleton board.
   Progress lives only until the page is closed. */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const wide = () => window.matchMedia("(min-width: 900px)").matches;

  const state = {
    mode: "learn",
    selected: "cranium",
    order: null,
    step: 0,
    locked: false,
    picked: null,
    score: 0,
    over: false,
    choices: null,
    missed: [],
    tipsOpen: wide(),
  };

  let actions = { prev: null, next: null, primary: null };
  let toTop = false;
  let swallowClick = false;

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

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function boneById(id) {
    return STUDY.bones.find((bone) => bone.id === id);
  }

  function chrome(meta) {
    $("top-title").textContent = STUDY.title;
    $("top-meta").textContent = meta || "";
    const start = $("top-start");
    start.textContent = "";
    start.appendChild(h("a", { class: "back", href: "../" }, "All guides"));
  }

  function metaText() {
    if (state.mode === "learn" || !state.order) return "";
    const total = state.order.length;
    if (state.over) return state.score + " / " + total;
    return state.step + 1 + " / " + total;
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

  function teachBox(hook) {
    const box = h("div", { class: "teach" });
    const p = h("p", { class: "hook" });
    p.appendChild(h("span", { class: "label" }, "Memory hook"));
    p.appendChild(document.createTextNode(hook));
    box.appendChild(p);
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

  function show(id) {
    const node = document.getElementById(id);
    if (node && node.scrollIntoView) {
      node.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }

  function choicesFor(bone) {
    const picked = [bone.id];
    bone.confusers.forEach((id) => {
      if (picked.length < 3 && picked.indexOf(id) === -1 && boneById(id)) picked.push(id);
    });
    const rest = shuffle(
      STUDY.bones.map((item) => item.id).filter((id) => picked.indexOf(id) === -1)
    );
    while (picked.length < 4 && rest.length) picked.push(rest.pop());
    return shuffle(picked);
  }

  function resetRound(ids) {
    const list = ids && ids.length ? ids.slice() : STUDY.bones.map((bone) => bone.id);
    state.order = shuffle(list);
    state.step = 0;
    state.locked = false;
    state.picked = null;
    state.score = 0;
    state.over = false;
    state.missed = [];
    state.tipsOpen = false;
    state.choices = choicesFor(boneById(state.order[0]));
  }

  function mark(id, target) {
    state.locked = true;
    state.picked = id;
    if (id === target.id) state.score += 1;
    else state.missed.push(target.id);
  }

  function labelPlace(bone) {
    const parts = [];
    if (bone.y >= 88) parts.push("label-above");
    if (bone.x <= 30) parts.push("label-left");
    else if (bone.x >= 70) parts.push("label-right");
    return parts.join(" ");
  }

  /* ---------- board ---------- */

  function renderBoard(view) {
    chrome(metaText());
    view.appendChild(
      h(
        "p",
        { class: "intro" },
        "Learn the 19 bones on the skeleton sheet, then find them and name them."
      )
    );

    const segment = h("div", { class: "segment", role: "tablist", "aria-label": "Skeleton mode" });
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
          "aria-selected": state.mode === pair[0] ? "true" : "false",
        },
        pair[1]
      );
      button.addEventListener("click", () => {
        state.mode = pair[0];
        if (pair[0] === "learn") {
          state.over = false;
          state.locked = false;
          state.tipsOpen = wide();
        } else {
          resetRound(null);
        }
        toTop = true;
        render();
      });
      segment.appendChild(button);
    });
    view.appendChild(segment);

    const tips = h("details", { class: "tips panel", open: state.tipsOpen });
    tips.addEventListener("toggle", () => {
      state.tipsOpen = tips.open;
    });
    tips.appendChild(h("summary", null, "Tips"));
    const ol = h("ol");
    STUDY.tips.forEach((tip) => ol.appendChild(h("li", null, tip)));
    tips.appendChild(ol);

    const board = h("div", { class: "board" });
    board.appendChild(tips);
    view.appendChild(board);

    if (state.mode === "learn") renderLearn(board);
    else if (state.over) renderDone(board);
    else if (state.mode === "find") renderFind(board);
    else renderName(board);

    view.appendChild(creditLine());
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
        "On a keyboard: arrow keys move, and the space bar goes on."
      )
    );
  }

  function creditLine() {
    const credit = STUDY.image.credit;
    const line = h("p", { class: "quiet board-credit" });
    line.appendChild(document.createTextNode("Skeleton: "));
    line.appendChild(
      h("a", { href: credit.source, target: "_blank", rel: "noopener" }, credit.title)
    );
    line.appendChild(document.createTextNode(" by " + credit.creator + ", " + credit.license));
    return line;
  }

  function renderCanvas(options) {
    const image = STUDY.image;
    const wrap = h("div", { class: "board-wrap" });
    wrap.style.aspectRatio = image.width + " / " + image.height;
    const img = h("img", {
      class: "board-img",
      alt: image.alt,
      width: String(image.width),
      height: String(image.height),
    });
    const ready = () => img.classList.add("is-ready");
    img.addEventListener("load", ready);
    img.addEventListener("error", () => {
      img.remove();
      wrap.appendChild(h("div", { class: "board-missing" }, "Skeleton diagram"));
    });
    img.src = image.src;
    if (img.complete && img.naturalWidth > 0) ready();
    wrap.appendChild(img);

    const layer = h("div", { class: options.blind ? "pin-layer is-blind" : "pin-layer" });
    STUDY.bones.forEach((bone) => {
      const extras = options.classFor ? options.classFor(bone) : "";
      const place = labelPlace(bone);
      let cls = "pin";
      if (place) cls += " " + place;
      if (extras) cls += " " + extras;
      const button = h("button", { type: "button", class: cls, "data-id": bone.id });
      button.style.left = bone.x + "%";
      button.style.top = bone.y + "%";
      button.setAttribute("aria-label", options.labelFor ? options.labelFor(bone) : bone.name);
      if (options.currentFor && options.currentFor(bone)) {
        button.setAttribute("aria-current", "true");
      }
      const dot = h("span", { class: "pin-dot" });
      dot.appendChild(h("span", { class: "pin-num" }, String(bone.n)));
      button.appendChild(dot);
      if (options.showName && options.showName(bone)) {
        button.appendChild(h("span", { class: "pin-name" }, bone.name));
      }
      button.addEventListener("click", () => {
        if (swallowClick) return;
        options.onPin(bone);
      });
      layer.appendChild(button);
    });
    wrap.appendChild(layer);
    return wrap;
  }

  function renderLearn(view) {
    const selected = boneById(state.selected) || STUDY.bones[0];
    state.selected = selected.id;
    const lead = h("div", { class: "board-lead" });
    lead.appendChild(h("p", null, "Tap a numbered pin, or a name in the list."));
    const canvas = renderCanvas({
      labelFor: (bone) => bone.name,
      classFor: (bone) => (bone.id === selected.id ? "is-hot" : ""),
      currentFor: (bone) => bone.id === selected.id,
      showName: (bone) => bone.id === selected.id,
      onPin: (bone) => {
        state.selected = bone.id;
        render();
        show("bone-fact");
      },
    });
    const side = h("div", { class: "board-side" });
    const fact = h("div", { class: "panel", id: "bone-fact" });
    fact.appendChild(h("h2", null, selected.n + ". " + selected.name));
    fact.appendChild(h("p", null, "Everyday name: " + selected.common + "."));
    fact.appendChild(h("p", null, selected.where));
    fact.appendChild(h("p", null, selected.fact));
    if (selected.watch) fact.appendChild(watchBox(selected.watch));
    fact.appendChild(teachBox(selected.hook));
    side.appendChild(fact);
    side.appendChild(boneBank(selected));
    view.appendChild(h("div", { class: "board-split" }, [lead, canvas, side]));

    const order = STUDY.bones.map((bone) => bone.id);
    const index = Math.max(0, order.indexOf(selected.id));
    const go = (delta) => {
      const next = clamp(index + delta, 0, order.length - 1);
      state.selected = order[next];
      render();
      const pin = document.querySelector(".pin.is-hot");
      if (pin && pin.scrollIntoView) pin.scrollIntoView({ block: "nearest", inline: "nearest" });
    };
    actions.prev = () => go(-1);
    actions.next = () => go(1);
    actions.primary = actions.next;
    setBar([
      { label: "Prev", disabled: index === 0, on: actions.prev },
      { label: "Next", primary: true, disabled: index === order.length - 1, on: actions.next },
    ]);
  }

  function boneBank(selected) {
    const bank = h("div", { class: "bank", role: "group", "aria-label": "All 19 bones" });
    STUDY.bones.forEach((bone) => {
      const on = bone.id === selected.id;
      const button = h(
        "button",
        {
          type: "button",
          class: on ? "bank-btn is-on" : "bank-btn",
          "aria-pressed": on ? "true" : "false",
        },
        bone.n + " " + bone.name
      );
      button.addEventListener("click", () => {
        state.selected = bone.id;
        render();
        show("bone-fact");
      });
      bank.appendChild(button);
    });
    return bank;
  }

  function renderFind(view) {
    const target = boneById(state.order[state.step]);
    const lead = h("div", { class: "board-lead" });
    lead.appendChild(h("p", { class: "prompt" }, "Tap the " + target.name));
    lead.appendChild(
      h("p", { class: "quiet" }, "Question " + (state.step + 1) + " of " + state.order.length)
    );
    const canvas = renderCanvas({
      blind: !state.locked,
      labelFor: (bone) => (state.locked ? bone.name : "Unlabeled pin"),
      classFor: (bone) => pinClass(bone, target),
      onPin: (bone) => {
        if (state.locked) return;
        mark(bone.id, target);
        say(bone.id === target.id ? "Yes. " + target.name : "That is " + bone.name + ".");
        render();
        show("bone-feedback");
      },
    });
    const side = h("div", { class: "board-side" });
    if (state.locked) side.appendChild(feedback(target));
    view.appendChild(h("div", { class: "board-split" }, [lead, canvas, side]));
    questionBar();
  }

  function renderName(view) {
    const target = boneById(state.order[state.step]);
    if (!state.choices) state.choices = choicesFor(target);
    const lead = h("div", { class: "board-lead" });
    lead.appendChild(h("p", { class: "prompt" }, "Which bone is this?"));
    lead.appendChild(
      h("p", { class: "quiet" }, "Question " + (state.step + 1) + " of " + state.order.length)
    );
    const canvas = renderCanvas({
      blind: true,
      labelFor: (bone) => {
        if (!state.locked && bone.id === target.id) return "Highlighted bone";
        if (state.locked && (bone.id === target.id || bone.id === state.picked)) return bone.name;
        return "Bone pin";
      },
      classFor: (bone) => {
        if (!state.locked && bone.id === target.id) return "is-hot";
        return pinClass(bone, target);
      },
      currentFor: (bone) => !state.locked && bone.id === target.id,
      onPin: () => {},
    });
    const side = h("div", { class: "board-side" });
    state.choices.forEach((id) => {
      const bone = boneById(id);
      let cls = "choice";
      let tag = "";
      if (state.locked) {
        if (id === target.id) {
          cls += " is-correct";
          tag = "Answer";
        } else if (id === state.picked) {
          cls += " is-wrong";
          tag = "Not quite";
        }
      }
      const button = h("button", { type: "button", class: cls, disabled: state.locked }, bone.name);
      if (tag) button.appendChild(h("span", { class: "tag" }, tag));
      button.addEventListener("click", () => {
        if (state.locked) return;
        mark(id, target);
        say(id === target.id ? "Yes. " + target.name : "Not quite. It is " + target.name + ".");
        render();
        show("bone-feedback");
      });
      side.appendChild(button);
    });
    if (state.locked) side.appendChild(feedback(target));
    view.appendChild(h("div", { class: "board-split" }, [lead, canvas, side]));
    questionBar();
  }

  function pinClass(bone, target) {
    if (!state.locked) return "";
    if (bone.id === target.id) return "is-correct";
    if (bone.id === state.picked) return "is-wrong";
    return "";
  }

  function feedback(target) {
    const picked = boneById(state.picked);
    const box = h("div", { class: "teach", id: "bone-feedback" });
    if (picked && picked.id === target.id) {
      box.appendChild(h("p", null, "Yes. That is " + target.name + "."));
    } else if (picked) {
      box.appendChild(
        h(
          "p",
          null,
          "That is " +
            picked.name +
            ". " +
            picked.where +
            " " +
            target.name +
            " is the one to remember."
        )
      );
    }
    box.appendChild(h("p", null, target.where));
    box.appendChild(h("p", null, target.fact));
    box.appendChild(teachBox(target.hook));
    return box;
  }

  function questionBar() {
    const last = state.step === state.order.length - 1;
    const advance = () => {
      if (!state.locked) return;
      if (last) {
        state.over = true;
        render();
        return;
      }
      state.step += 1;
      state.locked = false;
      state.picked = null;
      state.choices = choicesFor(boneById(state.order[state.step]));
      render();
    };
    actions.prev = null;
    actions.next = advance;
    actions.primary = state.locked ? advance : null;
    setBar([
      {
        label: last ? "Finish" : "Next",
        primary: true,
        disabled: !state.locked,
        on: advance,
      },
    ]);
  }

  function renderDone(view) {
    const total = state.order.length;
    const missed = state.missed
      .map(boneById)
      .filter(Boolean)
      .sort((a, b) => a.n - b.n);
    view.appendChild(h("p", { class: "score" }, state.score + " / " + total));
    view.appendChild(
      h(
        "p",
        null,
        state.score === total
          ? total === STUDY.bones.length
            ? "You know every bone on the sheet. Do it once more so it stays."
            : "You got every one in this round. Do it once more so it stays."
          : "Look again at the ones that slipped. Start at the top of the skeleton and work down."
      )
    );
    if (missed.length) {
      const list = h("ul", { class: "missed-list" });
      missed.forEach((bone) => list.appendChild(h("li", null, bone.name)));
      view.appendChild(list);
    }
    const practice = () => {
      const ids = state.missed.slice();
      resetRound(ids);
      render();
    };
    const again = () => {
      resetRound(null);
      render();
    };
    actions.prev = null;
    actions.next = again;
    actions.primary = again;
    setBar([
      {
        label: "Practice the misses",
        disabled: !missed.length,
        top: true,
        on: practice,
      },
      {
        label: "Try again",
        primary: true,
        top: true,
        on: again,
      },
    ]);
  }

  function render() {
    const jump = toTop;
    toTop = false;
    if (typeof STUDY === "undefined") {
      $("view").textContent = "Study data did not load.";
      setBar(null);
      return;
    }
    document.body.dataset.mode = "board";
    actions = { prev: null, next: null, primary: null };
    const view = $("view");
    view.textContent = "";
    setBar(null);
    renderBoard(view);
    if (jump) {
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
  bindSwipe($("view"));
  render();
})();
