(function () {
  "use strict";

  function safe(fn, label) {
    try {
      fn();
    } catch (err) {
      console.error('[script.js] ' + label + ' failed:', err);
    }
  }

  /* ── Scroll glass navbar ─────────────────────────────────────── */
  safe(function () {
    var nav = document.getElementById('gsmNav');
    if (!nav) return;
    var THRESHOLD = 30;

    function onScroll() {
      nav.classList.toggle('gsm-scrolled', window.scrollY > THRESHOLD);
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, {
      passive: true
    });

    onScroll();
  }, 'scroll navbar');

  /* ── Active nav link + auto-close mobile menu ────────────────── */
  safe(function () {
    var navMenu = document.getElementById('gsmNavMenu');
    if (!navMenu) return;
    var links = document.querySelectorAll('.gsm-nav-link');
    var bsCollapse = window.bootstrap ? bootstrap.Collapse.getOrCreateInstance(navMenu, {
      toggle: false
    }) : null;

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        links.forEach(function (l) {
          l.classList.remove('active');
        });
        this.classList.add('active');
        if (bsCollapse && window.innerWidth < 992 && navMenu.classList.contains('show')) {
          bsCollapse.hide();
        }
      });
    });
  }, 'nav links');

  /* ── Mockup image slider — directional fade-drift ─────────────── */
  safe(function () {
    var track = document.getElementById('gsmMockupTrack');
    var wrap = document.getElementById('gsmMockupWrap');
    var dotsWrap = document.getElementById('gsmDots');
    if (!track || !wrap || !dotsWrap) return;

    var slides = Array.prototype.slice.call(track.querySelectorAll('.gsm-mockup-slide'));
    if (!slides.length) return;

    var total = slides.length;
    var current = 0;
    var AUTOPLAY_MS = 4500;
    var TRANSITION_MS = 280;
    var timer = null;
    var animating = false;

    /* activate first slide */
    slides[0].classList.add('active');

    /* build dots */
    dotsWrap.innerHTML = '';
    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'gsm-dot' + (i === 0 ? ' active' : '');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      dot.addEventListener('click', function () {
        goTo(i);
        resetTimer();
      });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll('.gsm-dot'));

    function goTo(index, dir) {
      if (animating) return;
      var next = (index + total) % total;
      if (next === current) return;

      animating = true;

      /* direction: 1 = forward (slide left), -1 = backward (slide right) */
      if (dir === undefined) dir = next > current ? 1 : -1;

      /* incoming slide: snap to start position without transition */
      slides[next].style.transition = 'none';
      slides[next].style.transform = 'scale(0.97)';
      slides[next].style.opacity = '0';

      /* force reflow so the start state registers */
      void slides[next].offsetWidth;

      /* restore transition and let CSS take over */
      slides[next].style.transition = '';
      slides[next].style.transform = '';
      slides[next].style.opacity = '';

      /* outgoing slide exits to the opposite side */
      slides[current].classList.remove('active');
      slides[current].classList.add(dir > 0 ? 'slide-out-left' : 'slide-out-right');

      /* incoming slide fades in from its start position to centre */
      slides[next].classList.add('active');

      dots[current].classList.remove('active');
      dots[next].classList.add('active');

      var prev = current;
      current = next;

      setTimeout(function () {
        slides[prev].classList.remove('slide-out-left', 'slide-out-right');
        animating = false;
      }, TRANSITION_MS);
    }

    function resetTimer() {
      clearInterval(timer);
      timer = setInterval(function () {
        goTo(current + 1, 1);
      }, AUTOPLAY_MS);
    }

    wrap.addEventListener('mouseenter', function () {
      clearInterval(timer);
    });
    wrap.addEventListener('mouseleave', resetTimer);

    var touchStartX = 0;
    var touchStartY = 0;
    wrap.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      clearInterval(timer);
    }, {
      passive: true
    });

    wrap.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        dx < 0 ? goTo(current + 1, 1) : goTo(current - 1, -1);
      }
      resetTimer();
    }, {
      passive: true
    });

    resetTimer();
  }, 'mockup slider');

  safe(function () {
    var sections = document.querySelectorAll('.anim-section');
    if (!sections.length) return;

    sections.forEach(function (section) {
      var browser = section.querySelector('.gsm-browser');
      var heading = section.querySelector('.gsm-showcase-heading');
      var browserCol = section.querySelector('.gsm-showcase-browser-col');

      section.classList.add('gsm-anim-start');

      if (browser && browserCol) {
        var isLeft = browserCol === browserCol.parentElement.firstElementChild;
        browser.classList.add(isLeft ? 'gsm-slide-left' : 'gsm-slide-right');
      }

      if (heading) {
        var raw = heading.innerHTML.replace(/<br\s*\/?>/gi, ' |||BR||| ');
        var parts = raw.trim().split(/\s+/);
        var idx = 0;
        var built = '';
        parts.forEach(function (part) {
          if (part === '|||BR|||') {
            built += '<br>';
          } else if (part) {
            if (built && !built.endsWith('<br>')) built += ' ';
            built += '<span class="gsm-word" style="--word-delay:' + (0.3 + idx * 0.18).toFixed(2) + 's">' + part + '</span>';
            idx++;
          }
        });
        heading.innerHTML = built;
      }

      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;

        if (browser) browser.classList.add('gsm-revealed');

        if (heading) {
          heading.querySelectorAll('.gsm-word').forEach(function (w) {
            w.classList.add('gsm-revealed');
          });
        }

        io.unobserve(section);
      }, {
        threshold: 0.15
      });

      io.observe(section);
    });
  }, 'showcase animations');


  /* ── Hosting card stagger animation ───────────────────────────────
   Add this safe() block to script.js after the
   existing 'showcase animations' safe() block.
   ────────────────────────────────────────────────────────────── */
  safe(function () {
    var sections = document.querySelectorAll('.gsm-host-grid');
    if (!sections.length) return;

    sections.forEach(function (grid) {
      var cards = Array.prototype.slice.call(grid.querySelectorAll('.gsm-host-card'));
      if (!cards.length) return;

      /* arm all cards hidden */
      cards.forEach(function (card, i) {
        card.classList.add('gsm-card-hidden');
        card.style.setProperty('--card-delay', (0.15 + i * 0.1).toFixed(2) + 's');
      });

      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;

        cards.forEach(function (card) {
          card.classList.remove('gsm-card-hidden');
          card.classList.add('gsm-card-visible');
        });

        io.unobserve(grid);
      }, {
        threshold: 0.12
      });

      io.observe(grid);
    });
  }, 'hosting card animation');


  /* ── FAQ accordion + entrance animation ───────────────────────────
   Add both safe() blocks to script.js.
   ────────────────────────────────────────────────────────────── */

  /* 1. Accordion open / close */
  safe(function () {
    var lists = document.querySelectorAll('.gsm-faq-list');
    if (!lists.length) return;

    lists.forEach(function (list) {
      list.querySelectorAll('.gsm-faq-item').forEach(function (item) {
        var btn = item.querySelector('.gsm-faq-q');
        if (!btn) return;

        btn.addEventListener('click', function () {
          var isOpen = item.classList.contains('open');

          /* close all siblings first */
          list.querySelectorAll('.gsm-faq-item.open').forEach(function (other) {
            other.classList.remove('open');
          });

          /* toggle clicked item */
          if (!isOpen) {
            item.classList.add('open');
          }
        });
      });
    });
  }, 'faq accordion');


  /* 2. Stagger entrance when FAQ list scrolls into view */
  safe(function () {
    var lists = document.querySelectorAll('.gsm-faq-list');
    if (!lists.length) return;

    lists.forEach(function (list) {
      var items = Array.prototype.slice.call(list.querySelectorAll('.gsm-faq-item'));
      if (!items.length) return;

      /* arm hidden state */
      items.forEach(function (item, i) {
        item.classList.add('gsm-faq-hidden');
        item.style.setProperty('--faq-delay', (0.1 + i * 0.1).toFixed(2) + 's');
      });

      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;

        items.forEach(function (item) {
          item.classList.remove('gsm-faq-hidden');
          item.classList.add('gsm-faq-visible');
        });

        io.unobserve(list);
      }, {
        threshold: 0.12
      });

      io.observe(list);
    });
  }, 'faq entrance');


  /* ── Order Engine Workflow Animation ─────────────────────────────
     Sequential: one package at a time.
     CO→OE → OE→DI → DI→CN (bell) → OE→SA → SA→CN (bell) → repeat
     ────────────────────────────────────────────────────────────── */
  safe(function () {

    var diagram = document.getElementById('gsmWfDiagram');
    if (!diagram) return;

    var NODES = {
      co: document.getElementById('wf-node-co'),
      oe: document.getElementById('wf-node-oe'),
      di: document.getElementById('wf-node-di'),
      sa: document.getElementById('wf-node-sa'),
      cn: document.getElementById('wf-node-cn')
    };

    var LINES = {
      'co-oe': document.getElementById('wf-path-co-oe'),
      'oe-di': document.getElementById('wf-path-oe-di'),
      'oe-sa': document.getElementById('wf-path-oe-sa'),
      'di-cn': document.getElementById('wf-path-di-cn'),
      'sa-cn': document.getElementById('wf-path-sa-cn')
    };

    var PKGS = {
      'co-oe': {
        mot: document.getElementById('mot-co-oe'),
        icon: document.getElementById('wf-pkg-co-oe')
      },
      'oe-di': {
        mot: document.getElementById('mot-oe-di'),
        icon: document.getElementById('wf-pkg-oe-di')
      },
      'oe-sa': {
        mot: document.getElementById('mot-oe-sa'),
        icon: document.getElementById('wf-pkg-oe-sa')
      },
      'di-cn': {
        mot: document.getElementById('mot-di-cn'),
        icon: document.getElementById('wf-pkg-di-cn')
      },
      'sa-cn': {
        mot: document.getElementById('mot-sa-cn'),
        icon: document.getElementById('wf-pkg-sa-cn')
      }
    };

    var connA = document.querySelector('.gsm-wf-conn-a');
    var connB = document.querySelector('.gsm-wf-conn-b');
    var connC = document.querySelector('.gsm-wf-conn-c');

    function activateNode(id) {
      var n = NODES[id];
      if (n) n.classList.add('gsm-wf-active');
    }

    function deactivateNode(id) {
      var n = NODES[id];
      if (n) n.classList.remove('gsm-wf-active');
    }

    function flowLine(id) {
      var l = LINES[id];
      if (!l) return;
      l.classList.remove('gsm-wf-used');
      l.classList.add('gsm-wf-flowing');
    }

    function usedLine(id) {
      var l = LINES[id];
      if (!l) return;
      l.classList.remove('gsm-wf-flowing');
      l.classList.add('gsm-wf-used');
    }

    function setConn(el, active) {
      if (el) el.classList.toggle('gsm-wf-conn-active', active);
    }

    function setConnBranch(el, branch, active) {
      if (!el) return;
      el.classList.toggle('gsm-wf-conn-left', branch === 'left' && active);
      el.classList.toggle('gsm-wf-conn-right', branch === 'right' && active);
    }

    function drive(id, cb) {
      var p = PKGS[id];
      if (!p || !p.mot) {
        if (cb) cb();
        return;
      }
      if (p.icon) p.icon.style.opacity = '1';

      function onEnd() {
        p.mot.removeEventListener('endEvent', onEnd);
        if (p.icon) p.icon.style.opacity = '0';
        setTimeout(function () {
          if (cb) cb();
        }, 60);
      }
      p.mot.addEventListener('endEvent', onEnd);
      p.mot.beginElement();
    }

    function resetAll() {
      Object.keys(NODES).forEach(function (k) {
        if (NODES[k]) NODES[k].classList.remove('gsm-wf-active');
      });
      Object.keys(LINES).forEach(function (k) {
        if (LINES[k]) LINES[k].classList.remove('gsm-wf-flowing', 'gsm-wf-used');
      });
      Object.keys(PKGS).forEach(function (k) {
        if (PKGS[k].icon) PKGS[k].icon.style.opacity = '0';
      });
      setConn(connA, false);
      setConn(connB, false);
      setConn(connC, false);
      if (connC) {
        connC.classList.remove('gsm-wf-conn-left', 'gsm-wf-conn-right');
      }
    }

    function runSeq(steps) {
      var i = 0;

      function next() {
        if (i >= steps.length) return;
        var s = steps[i++];
        if (typeof s === 'number') {
          setTimeout(next, s);
        } else {
          s(next);
        }
      }
      next();
    }

    var loopTimer = null;

    function run() {
      clearTimeout(loopTimer);
      resetAll();

      runSeq([

        280,
        function (n) {
          activateNode('co');
          n();
        },
        450,

        function (n) {
          flowLine('co-oe');
          setConn(connA, true);
          drive('co-oe', n);
        },
        function (n) {
          usedLine('co-oe');
          setConn(connA, false);
          deactivateNode('co');
          activateNode('oe');
          n();
        },
        400,

        function (n) {
          flowLine('oe-di');
          setConn(connB, true);
          drive('oe-di', n);
        },
        function (n) {
          usedLine('oe-di');
          setConn(connB, false);
          activateNode('di');
          n();
        },
        320,

        function (n) {
          flowLine('di-cn');
          setConnBranch(connC, 'left', true);
          drive('di-cn', n);
        },
        function (n) {
          usedLine('di-cn');
          setConnBranch(connC, 'left', false);
          deactivateNode('di');
          activateNode('cn');
          n();
        },
        900,
        function (n) {
          deactivateNode('cn');
          n();
        },
        500,

        function (n) {
          flowLine('oe-sa');
          setConn(connB, true);
          drive('oe-sa', n);
        },
        function (n) {
          usedLine('oe-sa');
          setConn(connB, false);
          activateNode('sa');
          n();
        },
        320,

        function (n) {
          flowLine('sa-cn');
          setConnBranch(connC, 'right', true);
          drive('sa-cn', n);
        },
        function (n) {
          usedLine('sa-cn');
          setConnBranch(connC, 'right', false);
          deactivateNode('oe');
          deactivateNode('sa');
          activateNode('cn');
          n();
        },
        900,
        function (n) {
          deactivateNode('cn');
          n();
        },

        700,
        function (n) {
          loopTimer = setTimeout(run, 0);
        }

      ]);
    }

    var started = false;
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        if (!started) {
          started = true;
          run();
        }
      } else {
        started = false;
        clearTimeout(loopTimer);
        resetAll();
      }
    }, {
      threshold: 0.2
    });

    io.observe(diagram);

  }, 'workflow animation');

}());