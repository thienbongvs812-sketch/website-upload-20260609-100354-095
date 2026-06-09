(function () {
    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    function normalize(value) {
        return (value || "").toString().trim().toLowerCase();
    }

    ready(function () {
        var toggle = document.querySelector("[data-menu-toggle]");
        var mobilePanel = document.querySelector("[data-mobile-panel]");

        if (toggle && mobilePanel) {
            toggle.addEventListener("click", function () {
                mobilePanel.classList.toggle("is-open");
            });
        }

        document.querySelectorAll("[data-search-form]").forEach(function (form) {
            form.addEventListener("submit", function (event) {
                var input = form.querySelector("input[name='q']");
                if (input && input.value.trim()) {
                    event.preventDefault();
                    window.location.href = "./search.html?q=" + encodeURIComponent(input.value.trim());
                }
            });
        });

        var params = new URLSearchParams(window.location.search);
        var query = params.get("q") || "";
        var textFilter = document.querySelector("[data-text-filter]");

        if (textFilter && query) {
            textFilter.value = query;
        }

        function applyFilters() {
            var cards = document.querySelectorAll(".filter-grid .movie-card");
            var text = normalize(document.querySelector("[data-text-filter]") ? document.querySelector("[data-text-filter]").value : "");
            var category = normalize(document.querySelector("[data-category-filter]") ? document.querySelector("[data-category-filter]").value : "");
            var type = normalize(document.querySelector("[data-type-filter]") ? document.querySelector("[data-type-filter]").value : "");
            var visible = 0;

            cards.forEach(function (card) {
                var haystack = normalize([
                    card.dataset.title,
                    card.dataset.category,
                    card.dataset.type,
                    card.dataset.region,
                    card.dataset.genre,
                    card.dataset.year,
                    card.textContent
                ].join(" "));
                var ok = true;

                if (text && haystack.indexOf(text) === -1) {
                    ok = false;
                }

                if (category && normalize(card.dataset.category) !== category) {
                    ok = false;
                }

                if (type && normalize(card.dataset.type).indexOf(type) === -1) {
                    ok = false;
                }

                card.style.display = ok ? "" : "none";
                if (ok) {
                    visible += 1;
                }
            });

            var empty = document.querySelector("[data-empty-state]");
            if (empty) {
                empty.classList.toggle("is-visible", cards.length > 0 && visible === 0);
            }
        }

        document.querySelectorAll("[data-text-filter], [data-category-filter], [data-type-filter]").forEach(function (control) {
            control.addEventListener("input", applyFilters);
            control.addEventListener("change", applyFilters);
        });

        if (document.querySelector(".filter-grid")) {
            applyFilters();
        }

        var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
        var current = 0;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                showSlide(index);
            });
        });

        if (slides.length > 1) {
            window.setInterval(function () {
                showSlide(current + 1);
            }, 5200);
        }

        var video = document.querySelector("[data-player-video]");
        var startButton = document.querySelector("[data-player-start]");
        var mask = document.querySelector("[data-player-mask]");
        var hlsInstance = null;
        var playerLoaded = false;

        function beginPlayback() {
            if (!video) {
                return;
            }

            var url = video.getAttribute("data-video");
            if (!url) {
                return;
            }

            if (!playerLoaded) {
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = url;
                } else if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hlsInstance.loadSource(url);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        var parsedPlay = video.play();
                        if (parsedPlay && parsedPlay.catch) {
                            parsedPlay.catch(function () {});
                        }
                    });
                } else {
                    video.src = url;
                }
                playerLoaded = true;
            }

            if (mask) {
                mask.classList.add("is-hidden");
            }

            video.controls = true;
            var playPromise = video.play();
            if (playPromise && playPromise.catch) {
                playPromise.catch(function () {});
            }
        }

        if (startButton) {
            startButton.addEventListener("click", function (event) {
                event.preventDefault();
                beginPlayback();
            });
        }

        if (mask) {
            mask.addEventListener("click", function () {
                beginPlayback();
            });
        }

        if (video) {
            video.addEventListener("click", function () {
                if (!playerLoaded) {
                    beginPlayback();
                }
            });
        }

        window.addEventListener("beforeunload", function () {
            if (hlsInstance && hlsInstance.destroy) {
                hlsInstance.destroy();
            }
        });
    });
})();
