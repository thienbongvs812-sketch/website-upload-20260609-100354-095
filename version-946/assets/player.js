(function () {
  var players = Array.prototype.slice.call(document.querySelectorAll('.player'));

  players.forEach(function (stage) {
    var video = stage.querySelector('video');
    var button = stage.querySelector('.player-start');
    var source = video ? video.querySelector('source') : null;
    var src = source ? source.getAttribute('src') : '';
    var ready = false;
    var hls = null;

    function attach() {
      if (!video || !src || ready) {
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else {
        video.src = src;
      }

      ready = true;
    }

    function play() {
      attach();
      stage.classList.add('is-playing');
      video.controls = true;
      var request = video.play();
      if (request && typeof request.catch === 'function') {
        request.catch(function () {});
      }
    }

    if (button && video) {
      button.addEventListener('click', play);
      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        }
      });
      video.addEventListener('play', function () {
        stage.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        if (!video.ended) {
          stage.classList.remove('is-playing');
        }
      });
      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });
    }
  });
})();
