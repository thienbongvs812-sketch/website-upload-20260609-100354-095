(function () {
    function selectAll(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function initMenu() {
        var toggle = document.querySelector('[data-menu-toggle]');
        var nav = document.querySelector('[data-mobile-nav]');
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener('click', function () {
            var isOpen = nav.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }

    function initHero() {
        var slides = selectAll('[data-hero-slide]');
        var dots = selectAll('[data-hero-dot]');
        if (slides.length < 2) {
            return;
        }
        var index = 0;
        var timer = null;
        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === index);
            });
        }
        function start() {
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }
        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }
        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener('click', function () {
                stop();
                show(dotIndex);
                start();
            });
        });
        var hero = document.querySelector('.hero');
        if (hero) {
            hero.addEventListener('mouseenter', stop);
            hero.addEventListener('mouseleave', start);
        }
        show(0);
        start();
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function filterCards(input) {
        var targetSelector = input.getAttribute('data-filter-target') || '.movie-card';
        var cards = selectAll(targetSelector + ' .movie-card');
        if (!cards.length) {
            cards = selectAll(targetSelector);
        }
        var empty = document.querySelector(input.getAttribute('data-empty-target') || '.empty-filter');
        var q = normalize(input.value);
        var visible = 0;
        cards.forEach(function (card) {
            var text = normalize(card.getAttribute('data-search') || card.textContent);
            var matched = !q || text.indexOf(q) !== -1;
            card.hidden = !matched;
            if (matched) {
                visible += 1;
            }
        });
        if (empty) {
            empty.classList.toggle('is-visible', visible === 0);
        }
    }

    function initFilters() {
        var params = new URLSearchParams(window.location.search);
        var q = params.get('q') || '';
        selectAll('.js-filter').forEach(function (input) {
            if (q && input.classList.contains('search-query')) {
                input.value = q;
            }
            filterCards(input);
            input.addEventListener('input', function () {
                filterCards(input);
            });
        });
    }

    window.initMoviePlayer = function (video, source, overlay) {
        var loaded = false;
        function loadSource() {
            if (loaded) {
                return;
            }
            loaded = true;
            if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({
                    maxBufferLength: 30,
                    enableWorker: true
                });
                hls.loadSource(source);
                hls.attachMedia(video);
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
            } else {
                video.src = source;
            }
        }
        function playNow() {
            loadSource();
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function () {});
            }
        }
        if (overlay) {
            overlay.addEventListener('click', playNow);
        }
        video.addEventListener('click', function () {
            if (video.paused) {
                playNow();
            } else {
                video.pause();
            }
        });
        video.addEventListener('play', function () {
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        initMenu();
        initHero();
        initFilters();
    });
})();
