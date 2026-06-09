(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name) || "";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cardTemplate(movie) {
    var tags = (movie.tags || []).slice(0, 2).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");

    return "<article class=\"movie-card\">" +
      "<a class=\"card-cover\" href=\"" + escapeHtml(movie.url) + "\">" +
      "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">" +
      "<span class=\"card-type\">" + escapeHtml(movie.type) + "</span>" +
      "<span class=\"card-year\">" + escapeHtml(movie.year) + "</span>" +
      "<span class=\"card-play\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M8 5v14l11-7L8 5Z\"></path></svg></span>" +
      "</a>" +
      "<div class=\"card-body\">" +
      "<div class=\"card-tags\"><a href=\"" + escapeHtml(movie.categoryUrl) + "\">" + escapeHtml(movie.categoryName) + "</a>" + tags + "</div>" +
      "<h3><a href=\"" + escapeHtml(movie.url) + "\">" + escapeHtml(movie.title) + "</a></h3>" +
      "<p>" + escapeHtml(movie.oneLine) + "</p>" +
      "<div class=\"card-meta\">" + escapeHtml(movie.region) + " · " + escapeHtml(movie.genre) + "</div>" +
      "</div>" +
      "</article>";
  }

  function initMobileMenu() {
    var toggle = document.querySelector("[data-mobile-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function initHero() {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll(".hero-dot"));
    var prev = slider.querySelector("[data-hero-prev]");
    var next = slider.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function restart() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-slide")) || 0);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }

    show(0);
    restart();
  }

  function initFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
    panels.forEach(function (panel) {
      var search = panel.querySelector("[data-filter-search]");
      var year = panel.querySelector("[data-filter-year]");
      var genre = panel.querySelector("[data-filter-genre]");
      var grid = document.querySelector("[data-filter-grid]");
      if (!grid) {
        return;
      }
      var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));

      function apply() {
        var query = search ? search.value.trim().toLowerCase() : "";
        var yearValue = year ? year.value : "";
        var genreValue = genre ? genre.value.toLowerCase() : "";
        cards.forEach(function (card) {
          var title = (card.getAttribute("data-title") || "").toLowerCase();
          var keywords = (card.getAttribute("data-keywords") || "").toLowerCase();
          var cardYear = card.getAttribute("data-year") || "";
          var okQuery = !query || title.indexOf(query) > -1 || keywords.indexOf(query) > -1;
          var okYear = !yearValue || cardYear === yearValue;
          var okGenre = !genreValue || keywords.indexOf(genreValue) > -1;
          card.classList.toggle("is-hidden-card", !(okQuery && okYear && okGenre));
        });
      }

      [search, year, genre].forEach(function (item) {
        if (item) {
          item.addEventListener("input", apply);
          item.addEventListener("change", apply);
        }
      });
    });
  }

  function initSearchPage() {
    var input = document.getElementById("searchPageInput");
    var button = document.getElementById("searchPageButton");
    var results = document.getElementById("searchResults");
    var title = document.getElementById("searchTitle");
    if (!input || !results || !window.SEARCH_MOVIES) {
      return;
    }

    function render() {
      var query = input.value.trim().toLowerCase();
      if (!query) {
        title.textContent = "热门搜索推荐";
        return;
      }
      var matched = window.SEARCH_MOVIES.filter(function (movie) {
        var text = [movie.title, movie.region, movie.year, movie.genre, movie.categoryName, (movie.tags || []).join(" "), movie.oneLine].join(" ").toLowerCase();
        return text.indexOf(query) > -1;
      }).slice(0, 80);
      title.textContent = "搜索结果";
      results.innerHTML = matched.length ? matched.map(cardTemplate).join("") : "<div class=\"empty-result\">没有找到匹配影片</div>";
    }

    input.value = getParam("q");
    if (button) {
      button.addEventListener("click", render);
    }
    input.addEventListener("input", render);
    render();
  }

  window.initMoviePlayer = function (streamUrl) {
    ready(function () {
      var video = document.getElementById("moviePlayer");
      var layer = document.querySelector("[data-play-layer]");
      if (!video || !layer || !streamUrl) {
        return;
      }
      var attached = false;
      var hlsInstance = null;

      function attach() {
        if (attached) {
          return;
        }
        attached = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(streamUrl);
          hlsInstance.attachMedia(video);
        } else {
          video.src = streamUrl;
        }
      }

      function play() {
        attach();
        layer.classList.add("is-hidden");
        video.setAttribute("controls", "controls");
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {});
        }
      }

      layer.addEventListener("click", play);
      video.addEventListener("click", function () {
        if (!attached || video.paused) {
          play();
        }
      });
      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  };

  ready(function () {
    initMobileMenu();
    initHero();
    initFilters();
    initSearchPage();
  });
})();
