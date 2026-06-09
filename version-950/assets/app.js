(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function () {
    var menuButton = document.querySelector("[data-mobile-menu-button]");
    var mobilePanel = document.querySelector("[data-mobile-panel]");

    if (menuButton && mobilePanel) {
      menuButton.addEventListener("click", function () {
        mobilePanel.classList.toggle("is-open");
      });
    }

    document.querySelectorAll("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input[name='q']");
        var query = input ? input.value.trim() : "";
        var target = form.getAttribute("action") || "./all-videos.html";
        if (query) {
          window.location.href = target + "?q=" + encodeURIComponent(query);
        } else {
          window.location.href = target;
        }
      });
    });

    setupHero();
    setupFilters();
    setupPlayers();
  });

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    if (slides.length <= 1) {
      return;
    }

    var index = 0;
    var timer = null;

    function activate(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        activate(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        activate(i);
        start();
      });
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    start();
  }

  function setupFilters() {
    var input = document.querySelector("[data-page-filter]");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".video-card[data-meta]"));
    var empty = document.querySelector("[data-no-results]");
    if (!input || !cards.length) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    if (initial) {
      input.value = initial;
    }

    function normalize(value) {
      return String(value || "").toLowerCase().replace(/\s+/g, "");
    }

    function apply() {
      var query = normalize(input.value);
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = normalize(card.getAttribute("data-meta") || card.textContent);
        var matched = !query || haystack.indexOf(query) !== -1;
        card.classList.toggle("hidden-card", !matched);
        if (matched) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }

    input.addEventListener("input", apply);
    document.querySelectorAll("[data-filter-chip]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        input.value = chip.getAttribute("data-filter-chip") || chip.textContent.trim();
        apply();
        input.focus();
      });
    });
    apply();
  }

  function setupPlayers() {
    document.querySelectorAll("[data-player]").forEach(function (frame) {
      var video = frame.querySelector("video");
      var layer = frame.querySelector(".play-layer");
      var trigger = frame.querySelector(".play-trigger");
      var src = video ? video.getAttribute("data-stream-url") : "";
      var started = false;
      var hlsInstance = null;

      if (!video || !src) {
        return;
      }

      function play() {
        if (!started) {
          started = true;
          if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hlsInstance.loadSource(src);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
              video.play().catch(function () {});
            });
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = src;
            video.addEventListener("loadedmetadata", function () {
              video.play().catch(function () {});
            }, { once: true });
          } else {
            video.src = src;
            video.play().catch(function () {});
          }
        } else {
          video.play().catch(function () {});
        }

        video.setAttribute("controls", "controls");
        if (layer) {
          layer.classList.add("is-hidden");
        }
      }

      frame.addEventListener("click", function (event) {
        if (event.target === video && started) {
          return;
        }
        play();
      });

      if (trigger) {
        trigger.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          play();
        });
      }

      video.addEventListener("play", function () {
        if (layer) {
          layer.classList.add("is-hidden");
        }
      });

      video.addEventListener("ended", function () {
        if (hlsInstance) {
          hlsInstance.stopLoad();
        }
      });
    });
  }
})();
