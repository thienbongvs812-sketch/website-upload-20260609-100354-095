(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    ready(function () {
        var toggle = document.querySelector(".menu-toggle");
        var panel = document.getElementById("mobilePanel");
        if (toggle && panel) {
            toggle.addEventListener("click", function () {
                var open = panel.classList.toggle("is-open");
                toggle.setAttribute("aria-expanded", open ? "true" : "false");
            });
        }

        var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
        var controls = Array.prototype.slice.call(document.querySelectorAll("[data-hero-control]"));
        if (slides.length) {
            var current = 0;
            var show = function (index) {
                current = (index + slides.length) % slides.length;
                slides.forEach(function (slide, slideIndex) {
                    slide.classList.toggle("is-active", slideIndex === current);
                });
                controls.forEach(function (button, buttonIndex) {
                    button.classList.toggle("is-active", buttonIndex === current);
                });
            };
            controls.forEach(function (button, index) {
                button.addEventListener("click", function () {
                    show(index);
                });
            });
            setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
        var searchFields = Array.prototype.slice.call(document.querySelectorAll("[data-search-field]"));
        var yearFilter = document.querySelector("[data-year-filter]");
        var typeFilter = document.querySelector("[data-type-filter]");
        var emptyState = document.querySelector("[data-empty-state]");
        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get("q") || "";

        searchFields.forEach(function (field) {
            if (initialQuery && !field.value) {
                field.value = initialQuery;
            }
        });

        function applyFilters() {
            if (!cards.length) {
                return;
            }
            var query = normalize(searchFields[0] ? searchFields[0].value : "");
            var year = yearFilter ? normalize(yearFilter.value) : "";
            var type = typeFilter ? normalize(typeFilter.value) : "";
            var visible = 0;
            cards.forEach(function (card) {
                var haystack = normalize(card.getAttribute("data-haystack"));
                var cardYear = normalize(card.getAttribute("data-year"));
                var cardType = normalize(card.getAttribute("data-type"));
                var matched = (!query || haystack.indexOf(query) !== -1) && (!year || cardYear === year) && (!type || cardType === type);
                card.style.display = matched ? "" : "none";
                if (matched) {
                    visible += 1;
                }
            });
            if (emptyState) {
                emptyState.classList.toggle("is-visible", visible === 0);
            }
        }

        searchFields.forEach(function (field) {
            field.addEventListener("input", applyFilters);
        });
        if (yearFilter) {
            yearFilter.addEventListener("change", applyFilters);
        }
        if (typeFilter) {
            typeFilter.addEventListener("change", applyFilters);
        }
        applyFilters();
    });

    window.initMoviePlayer = function (videoId, overlayId, url) {
        var video = document.getElementById(videoId);
        var overlay = document.getElementById(overlayId);
        var loaded = false;
        if (!video || !url) {
            return;
        }
        function load() {
            if (!loaded) {
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = url;
                } else if (window.Hls && window.Hls.isSupported()) {
                    var hls = new window.Hls();
                    hls.loadSource(url);
                    hls.attachMedia(video);
                } else {
                    video.src = url;
                }
                loaded = true;
            }
            if (overlay) {
                overlay.classList.add("is-hidden");
            }
            var attempt = video.play();
            if (attempt && attempt.catch) {
                attempt.catch(function () {});
            }
        }
        if (overlay) {
            overlay.addEventListener("click", load);
        }
        video.addEventListener("click", function () {
            if (!loaded || video.paused) {
                load();
            }
        });
    };
})();
