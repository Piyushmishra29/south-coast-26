/* 01 · CHROME — preloader reveal + mobile nav drawer */
(function () {
  "use strict";

  var docEl = document.documentElement;

  /* ---- lock scroll while the preloader is showing ---- */
  docEl.classList.add("chrome-locked");

  /* ---- PRELOADER ---- */
  var preloader = document.getElementById("chrome-preloader");
  var START = Date.now();
  var MIN_MS = 500;

  function revealPage() {
    if (!preloader || preloader.classList.contains("chrome-preloader--hidden")) return;
    var wait = Math.max(0, MIN_MS - (Date.now() - START));
    setTimeout(function () {
      preloader.classList.add("chrome-preloader--hidden");
      docEl.classList.remove("chrome-locked");
      var done = function () { if (preloader && preloader.parentNode) preloader.remove(); };
      preloader.addEventListener("transitionend", done, { once: true });
      setTimeout(done, 1200); /* safety net if transitionend never fires */
    }, wait);
  }

  if (document.readyState === "complete") {
    revealPage();
  } else {
    window.addEventListener("load", revealPage);
  }

  /* ---- MOBILE NAV DRAWER ---- */
  var burger = document.getElementById("chrome-burger");
  var drawer = document.getElementById("chrome-drawer");

  if (burger && drawer) {
    var setOpen = function (open) {
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (open) { drawer.hidden = false; }
      else { drawer.hidden = true; }
    };

    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });

    /* close after picking a destination */
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    /* close on escape */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        burger.focus();
      }
    });
  }
})();
