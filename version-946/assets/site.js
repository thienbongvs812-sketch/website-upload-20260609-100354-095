(function () {
  var toggle = document.querySelector('.nav-toggle');
  var mobileNav = document.querySelector('.mobile-nav');

  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function setSlide(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        setSlide(index + 1);
      }, 6200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        setSlide(i);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        setSlide(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        setSlide(index + 1);
        restart();
      });
    }

    setSlide(0);
    restart();
  }

  var list = document.querySelector('[data-card-list]');
  var input = document.querySelector('[data-filter-input]');
  var typeFilter = document.querySelector('[data-type-filter]');
  var sortSelect = document.querySelector('[data-sort-select]');
  var emptyState = document.querySelector('[data-empty-state]');

  if (list) {
    var cards = Array.prototype.slice.call(list.querySelectorAll('[data-card]'));

    function textOf(card) {
      return [
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-type'),
        card.getAttribute('data-genre')
      ].join(' ').toLowerCase();
    }

    function applyQueryFromUrl() {
      if (!input) {
        return;
      }
      var params = new URLSearchParams(window.location.search);
      var query = params.get('q');
      if (query) {
        input.value = query;
      }
    }

    function applyFilter() {
      var query = input ? input.value.trim().toLowerCase() : '';
      var typeValue = typeFilter ? typeFilter.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var textMatch = !query || textOf(card).indexOf(query) !== -1;
        var typeMatch = !typeValue || (card.getAttribute('data-type') || '').indexOf(typeValue) !== -1;
        var show = textMatch && typeMatch;
        card.hidden = !show;
        if (show) {
          visible += 1;
        }
      });

      if (emptyState) {
        emptyState.hidden = visible !== 0;
      }
    }

    function applySort() {
      if (!sortSelect) {
        return;
      }
      var mode = sortSelect.value;
      var sorted = cards.slice().sort(function (a, b) {
        var ay = Number(a.getAttribute('data-year') || 0);
        var by = Number(b.getAttribute('data-year') || 0);
        var at = a.getAttribute('data-title') || '';
        var bt = b.getAttribute('data-title') || '';

        if (mode === 'year-asc') {
          return ay - by || at.localeCompare(bt, 'zh-Hans-CN');
        }
        if (mode === 'title-asc') {
          return at.localeCompare(bt, 'zh-Hans-CN') || by - ay;
        }
        return by - ay || at.localeCompare(bt, 'zh-Hans-CN');
      });

      sorted.forEach(function (card) {
        list.appendChild(card);
      });
      cards = sorted;
      applyFilter();
    }

    applyQueryFromUrl();
    applySort();
    applyFilter();

    if (input) {
      input.addEventListener('input', applyFilter);
    }
    if (typeFilter) {
      typeFilter.addEventListener('change', applyFilter);
    }
    if (sortSelect) {
      sortSelect.addEventListener('change', applySort);
    }
  }
})();
