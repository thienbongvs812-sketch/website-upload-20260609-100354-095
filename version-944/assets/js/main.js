(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    ready(function () {
        setupMobileMenu();
        setupHeroCarousel();
        setupFilters();
        applyQuerySearch();
    });

    function setupMobileMenu() {
        var button = document.querySelector('[data-menu-button]');
        var menu = document.querySelector('[data-mobile-menu]');
        if (!button || !menu) {
            return;
        }
        button.addEventListener('click', function () {
            menu.classList.toggle('is-open');
        });
    }

    function setupHeroCarousel() {
        var carousel = document.querySelector('[data-hero-carousel]');
        if (!carousel) {
            return;
        }
        var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
        if (!slides.length) {
            return;
        }
        var current = 0;
        var timer = null;
        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
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
            dot.addEventListener('click', function () {
                show(index);
                start();
            });
        });
        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function textOf(card) {
        return (card.getAttribute('data-search') || '').toLowerCase();
    }

    function setupFilters() {
        var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]'));
        scopes.forEach(function (scope) {
            var input = scope.querySelector('[data-filter-input]');
            var clear = scope.querySelector('[data-filter-clear]');
            var category = scope.querySelector('[data-filter-category]');
            var type = scope.querySelector('[data-filter-type]');
            var sort = scope.querySelector('[data-sort-select]');
            var container = scope.querySelector('[data-card-container]');
            var empty = scope.querySelector('[data-empty-state]');
            if (!container) {
                return;
            }
            function update() {
                var query = input ? input.value.trim().toLowerCase() : '';
                var categoryValue = category ? category.value : '';
                var typeValue = type ? type.value : '';
                var cards = Array.prototype.slice.call(container.querySelectorAll('[data-search-card]'));
                var shown = 0;
                cards.forEach(function (card) {
                    var matchesQuery = !query || textOf(card).indexOf(query) !== -1;
                    var matchesCategory = !categoryValue || card.getAttribute('data-category') === categoryValue;
                    var cardType = card.getAttribute('data-type') || '';
                    var matchesType = !typeValue || cardType.indexOf(typeValue) !== -1;
                    var visible = matchesQuery && matchesCategory && matchesType;
                    card.hidden = !visible;
                    if (visible) {
                        shown += 1;
                    }
                });
                if (empty) {
                    empty.hidden = shown !== 0;
                }
            }
            function reorder() {
                if (!sort) {
                    update();
                    return;
                }
                var mode = sort.value;
                var cards = Array.prototype.slice.call(container.querySelectorAll('[data-search-card]'));
                cards.sort(function (a, b) {
                    if (mode === 'title') {
                        return (a.getAttribute('data-title') || '').localeCompare(b.getAttribute('data-title') || '', 'zh-Hans-CN');
                    }
                    if (mode === 'score') {
                        return Number(b.getAttribute('data-score') || 0) - Number(a.getAttribute('data-score') || 0);
                    }
                    return Number(b.getAttribute('data-year') || 0) - Number(a.getAttribute('data-year') || 0);
                });
                cards.forEach(function (card) {
                    container.appendChild(card);
                });
                update();
            }
            [input, category, type].forEach(function (control) {
                if (control) {
                    control.addEventListener('input', update);
                    control.addEventListener('change', update);
                }
            });
            if (sort) {
                sort.addEventListener('change', reorder);
            }
            if (clear && input) {
                clear.addEventListener('click', function () {
                    input.value = '';
                    update();
                    input.focus();
                });
            }
            reorder();
        });
    }

    function applyQuerySearch() {
        var params = new URLSearchParams(window.location.search);
        var query = params.get('q');
        if (!query) {
            return;
        }
        var input = document.querySelector('[data-filter-input]');
        if (input) {
            input.value = query;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    window.initializeMoviePlayer = function (options) {
        var video = document.getElementById(options.videoId);
        var overlay = document.getElementById(options.overlayId);
        if (!video || !options.source) {
            return;
        }
        var hlsReady = false;
        function attach() {
            if (hlsReady) {
                return;
            }
            hlsReady = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = options.source;
            } else if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(options.source);
                hls.attachMedia(video);
            } else {
                video.src = options.source;
            }
        }
        function play() {
            attach();
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
            var promise = video.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {});
            }
        }
        if (overlay) {
            overlay.addEventListener('click', play);
        }
        video.addEventListener('click', function () {
            if (video.paused) {
                play();
            }
        });
        video.addEventListener('play', function () {
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
        });
    };
})();
