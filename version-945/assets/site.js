(function () {
    "use strict";

    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function closestFormAction(form) {
        var action = form.getAttribute("action") || "search.html";
        return action;
    }

    function bindMenus() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var panel = document.querySelector("[data-mobile-panel]");
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener("click", function () {
            panel.classList.toggle("is-open");
        });
    }

    function bindSearchForms() {
        document.querySelectorAll("[data-site-search]").forEach(function (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var input = form.querySelector("input[name='q']");
                var query = input ? input.value.trim() : "";
                if (!query) {
                    return;
                }
                window.location.href = closestFormAction(form) + "?q=" + encodeURIComponent(query);
            });
        });
    }

    function bindHero() {
        var carousel = document.querySelector("[data-hero-carousel]");
        if (!carousel) {
            return;
        }
        var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-dot]"));
        var prev = carousel.querySelector("[data-hero-prev]");
        var next = carousel.querySelector("[data-hero-next]");
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                show(index);
                start();
            });
        });

        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                start();
            });
        }

        carousel.addEventListener("mouseenter", stop);
        carousel.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function bindCategoryFilters() {
        var bar = document.querySelector("[data-filter-bar]");
        var grid = document.querySelector("[data-card-grid]");
        if (!bar || !grid) {
            return;
        }
        var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-card]"));
        var input = bar.querySelector("[data-filter-input]");
        var type = bar.querySelector("[data-filter-type]");
        var year = bar.querySelector("[data-filter-year]");

        function normalize(value) {
            return String(value || "").trim().toLowerCase();
        }

        function applyFilters() {
            var keyword = normalize(input && input.value);
            var selectedType = normalize(type && type.value);
            var selectedYear = normalize(year && year.value);

            cards.forEach(function (card) {
                var text = normalize(card.innerText + " " + card.getAttribute("data-title"));
                var cardType = normalize(card.getAttribute("data-type"));
                var cardYear = normalize(card.getAttribute("data-year"));
                var matchedKeyword = !keyword || text.indexOf(keyword) !== -1;
                var matchedType = !selectedType || cardType === selectedType;
                var matchedYear = !selectedYear || cardYear === selectedYear;
                card.classList.toggle("hidden-by-filter", !(matchedKeyword && matchedType && matchedYear));
            });
        }

        function sortCards(mode) {
            var sorted = cards.slice().sort(function (a, b) {
                if (mode === "popular") {
                    return Number(b.getAttribute("data-views")) - Number(a.getAttribute("data-views"));
                }
                return String(b.getAttribute("data-date")).localeCompare(String(a.getAttribute("data-date")));
            });
            sorted.forEach(function (card) {
                grid.appendChild(card);
            });
        }

        [input, type, year].forEach(function (control) {
            if (control) {
                control.addEventListener("input", applyFilters);
                control.addEventListener("change", applyFilters);
            }
        });

        bar.querySelectorAll("[data-sort]").forEach(function (button) {
            button.addEventListener("click", function () {
                sortCards(button.getAttribute("data-sort"));
                applyFilters();
            });
        });
    }

    function bindPlayer() {
        var video = document.querySelector("video[data-src]");
        var button = document.querySelector("[data-play-button]");
        if (!video) {
            return;
        }
        var source = video.getAttribute("data-src");
        var hlsInstance = null;
        var initialized = false;

        function initializePlayer() {
            if (initialized) {
                return Promise.resolve();
            }
            initialized = true;
            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);
                return new Promise(function (resolve) {
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        resolve();
                    });
                    window.setTimeout(resolve, 1200);
                });
            }
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
            } else {
                video.src = source;
            }
            return Promise.resolve();
        }

        function playVideo() {
            initializePlayer().then(function () {
                if (button) {
                    button.classList.add("is-hidden");
                }
                var promise = video.play();
                if (promise && typeof promise.catch === "function") {
                    promise.catch(function () {
                        if (button) {
                            button.classList.remove("is-hidden");
                        }
                    });
                }
            });
        }

        if (button) {
            button.addEventListener("click", playVideo);
        }
        video.addEventListener("play", function () {
            if (button) {
                button.classList.add("is-hidden");
            }
        });
        video.addEventListener("pause", function () {
            if (button && video.currentTime === 0) {
                button.classList.remove("is-hidden");
            }
        });
        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }

    function getQueryParam(name) {
        var params = new URLSearchParams(window.location.search);
        return params.get(name) || "";
    }

    function movieCard(movie) {
        var tagHtml = movie.tags.slice(0, 3).map(function (tag) {
            return "<span>" + escapeHtml(tag) + "</span>";
        }).join("");
        return "" +
            "<article class=\"movie-card default\">" +
            "<a class=\"movie-poster\" href=\"" + escapeHtml(movie.url) + "\" aria-label=\"观看" + escapeHtml(movie.title) + "\">" +
            "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">" +
            "<span class=\"poster-overlay\"></span>" +
            "<span class=\"play-badge\">播放</span>" +
            "<span class=\"duration\">" + escapeHtml(movie.duration) + "</span>" +
            "</a>" +
            "<div class=\"movie-body\">" +
            "<div class=\"movie-meta-line\"><a href=\"" + escapeHtml(movie.categoryUrl) + "\">" + escapeHtml(movie.category) + "</a><span>" + escapeHtml(movie.year) + "</span></div>" +
            "<h3><a href=\"" + escapeHtml(movie.url) + "\">" + escapeHtml(movie.title) + "</a></h3>" +
            "<p>" + escapeHtml(movie.oneLine) + "</p>" +
            "<div class=\"tag-row\">" + tagHtml + "</div>" +
            "<div class=\"card-foot\"><span>👁 " + escapeHtml(movie.viewsLabel) + "</span><span>⭐ " + escapeHtml(movie.rating) + "</span></div>" +
            "</div>" +
            "</article>";
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function bindSearchPage() {
        var form = document.querySelector("[data-search-page-form]");
        var results = document.querySelector("[data-search-results]");
        var status = document.querySelector("[data-search-status]");
        if (!form || !results || !status || !window.MOVIE_INDEX) {
            return;
        }
        var input = form.querySelector("input[name='q']");

        function render(query) {
            var q = String(query || "").trim().toLowerCase();
            if (!q) {
                return;
            }
            var matched = window.MOVIE_INDEX.filter(function (movie) {
                return movie.searchText.indexOf(q) !== -1;
            }).slice(0, 120);
            status.innerHTML = "<h2>搜索：" + escapeHtml(query) + "</h2><p>找到 " + matched.length + " 条匹配结果，最多展示前 120 条。</p>";
            if (!matched.length) {
                results.innerHTML = "<div class=\"content-card\"><h2>没有找到匹配影片</h2><p>请尝试更换关键词，例如：日韩、悬疑、爱情、电影、2025。</p></div>";
                return;
            }
            results.innerHTML = matched.map(movieCard).join("");
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            var query = input.value.trim();
            if (!query) {
                return;
            }
            var nextUrl = "search.html?q=" + encodeURIComponent(query);
            window.history.replaceState(null, "", nextUrl);
            render(query);
        });

        var initial = getQueryParam("q");
        if (initial) {
            input.value = initial;
            render(initial);
        }
    }

    ready(function () {
        bindMenus();
        bindSearchForms();
        bindHero();
        bindCategoryFilters();
        bindPlayer();
        bindSearchPage();
    });
})();
