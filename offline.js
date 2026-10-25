/* Shared offline shell. Registers the root service worker from any guide. */
(function () {
  "use strict";

  var scriptEl = document.currentScript;
  var root = new URL(".", scriptEl && scriptEl.src ? scriptEl.src : location.href);
  var supported = "serviceWorker" in navigator;
  var blocks = [];
  var hadController = supported && !!navigator.serviceWorker.controller;
  var reloading = false;

  function statusText() {
    if (!navigator.onLine) return "Offline. Using the saved copy.";
    if (navigator.serviceWorker.controller) {
      return "Ready offline. Updates download each time you open it.";
    }
    return "Saving for offline…";
  }

  function liveBlocks() {
    blocks = blocks.filter(function (block) {
      return block.status && block.status.isConnected;
    });
    return blocks;
  }

  function paintAll() {
    liveBlocks().forEach(function (block) {
      if (block.busy) return;
      block.status.textContent = statusText();
    });
  }

  function showFailure(block) {
    block.busy = false;
    block.button.disabled = false;
    block.status.textContent = "Couldn’t reach the internet. Using the saved copy.";
  }

  function onControllerChange() {
    if (hadController && !reloading) {
      reloading = true;
      window.location.reload();
      return;
    }
    hadController = !!navigator.serviceWorker.controller;
    paintAll();
  }

  function registerWorker() {
    var swUrl = new URL("sw.js", root).href;
    navigator.serviceWorker
      .register(swUrl, { scope: root.href })
      .then(function (registration) {
        return registration.update();
      })
      .catch(function () {});
  }

  function onRefresh(block) {
    var worker = navigator.serviceWorker.controller;
    if (!navigator.onLine || !worker) {
      showFailure(block);
      return;
    }
    block.busy = true;
    block.button.disabled = true;
    block.status.textContent = "Updating…";
    var channel = new MessageChannel();
    var done = false;
    var timer = window.setTimeout(function () {
      finish(false);
    }, 30000);

    function finish(success) {
      if (done || reloading) return;
      done = true;
      window.clearTimeout(timer);
      if (success) {
        block.status.textContent = "Updated. Reloading…";
        reloading = true;
        window.location.reload();
        return;
      }
      showFailure(block);
    }

    channel.port1.onmessage = function (event) {
      var data = event.data || {};
      var ok = typeof data.ok === "number" ? data.ok : 0;
      var failed = typeof data.failed === "number" ? data.failed : 1;
      finish(failed === 0 && ok > 0);
    };

    try {
      worker.postMessage({ type: "refresh" }, [channel.port2]);
    } catch (err) {
      finish(false);
    }
  }

  function mount(container) {
    if (!supported || !container) return;
    var status = document.createElement("p");
    status.className = "offline-status";
    status.textContent = statusText();
    var button = document.createElement("button");
    button.type = "button";
    button.className = "offline-refresh";
    button.textContent = "Check for updates";
    var block = { status: status, button: button, busy: false };
    button.addEventListener("click", function () {
      onRefresh(block);
    });
    container.appendChild(status);
    container.appendChild(button);
    blocks.push(block);
  }

  if (supported) {
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    window.addEventListener("online", paintAll);
    window.addEventListener("offline", paintAll);
    window.addEventListener("load", registerWorker);
  }

  window.StudyOffline = {
    mount: supported ? mount : function () {},
  };
})();
