(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function normalize(value) {
        return (value || "").toString().trim().toLowerCase();
    }

    ready(function () {
        var toggle = document.querySelector("[data-menu-toggle]");
        var mobileNav = document.querySelector("[data-mobile-nav]");
        if (toggle && mobileNav) {
            toggle.addEventListener("click", function () {
                mobileNav.classList.toggle("is-open");
            });
        }

        var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
        if (slides.length > 1) {
            var active = 0;
            var showSlide = function (index) {
                active = index % slides.length;
                slides.forEach(function (slide, i) {
                    slide.classList.toggle("is-active", i === active);
                });
                dots.forEach(function (dot, i) {
                    dot.classList.toggle("is-active", i === active);
                });
            };
            dots.forEach(function (dot, i) {
                dot.addEventListener("click", function () {
                    showSlide(i);
                });
            });
            setInterval(function () {
                showSlide(active + 1);
            }, 5200);
        }

        var filterPanel = document.querySelector("[data-filters]");
        if (filterPanel) {
            var params = new URLSearchParams(window.location.search);
            var textInput = filterPanel.querySelector("[data-filter-text]");
            var yearSelect = filterPanel.querySelector("[data-filter-year]");
            var regionSelect = filterPanel.querySelector("[data-filter-region]");
            var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
            var empty = document.querySelector("[data-empty]");
            var query = params.get("q");
            if (query && textInput) {
                textInput.value = query;
            }
            var apply = function () {
                var text = normalize(textInput && textInput.value);
                var year = normalize(yearSelect && yearSelect.value);
                var region = normalize(regionSelect && regionSelect.value);
                var visible = 0;
                cards.forEach(function (card) {
                    var keywords = normalize(card.getAttribute("data-keywords"));
                    var cardYear = normalize(card.getAttribute("data-year"));
                    var cardRegion = normalize(card.getAttribute("data-region"));
                    var matched = (!text || keywords.indexOf(text) !== -1) && (!year || cardYear === year) && (!region || cardRegion === region);
                    card.style.display = matched ? "" : "none";
                    if (matched) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle("is-visible", visible === 0);
                }
            };
            [textInput, yearSelect, regionSelect].forEach(function (control) {
                if (control) {
                    control.addEventListener("input", apply);
                    control.addEventListener("change", apply);
                }
            });
            apply();
        }

        var frame = document.querySelector("[data-player]");
        if (frame) {
            var video = frame.querySelector("video");
            var mask = frame.querySelector("[data-play]");
            var label = frame.querySelector("[data-play-label]");
            var started = false;
            var start = function () {
                if (!video || started) {
                    if (video) {
                        video.play().catch(function () {});
                    }
                    return;
                }
                started = true;
                var source = video.getAttribute("data-m3u8");
                if (label) {
                    label.textContent = "正在加载";
                }
                video.controls = true;
                var playVideo = function () {
                    frame.classList.add("is-playing");
                    video.play().catch(function () {
                        frame.classList.remove("is-playing");
                        started = false;
                        if (label) {
                            label.textContent = "点击继续播放";
                        }
                    });
                };
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = source;
                    playVideo();
                } else if (window.Hls && window.Hls.isSupported()) {
                    var hls = new window.Hls({ enableWorker: true });
                    hls.loadSource(source);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
                    hls.on(window.Hls.Events.ERROR, function () {
                        if (label) {
                            label.textContent = "点击重试";
                        }
                        frame.classList.remove("is-playing");
                        started = false;
                    });
                } else {
                    if (label) {
                        label.textContent = "当前设备暂不支持此播放线路";
                    }
                    started = false;
                }
            };
            if (mask) {
                mask.addEventListener("click", start);
            }
            frame.addEventListener("click", function (event) {
                if (event.target === frame) {
                    start();
                }
            });
        }
    });
})();
