/* ==========================================================================
   Mindful Guide — JavaScript
   File: assets/mindful-guide.js

   Lightweight, dependency-free JS for:
   - IntersectionObserver motion reveals
   - Reading progress bar
   
   Reads configuration from data attributes on the section element:
     data-motion-enabled="true|false"
     data-motion="fade|fade_up|gentle_reveal|none"
     data-progress-bar="true|false"
     data-progress-id="mgw-XXXXX-progress"
   
   Respects prefers-reduced-motion.
   Falls back gracefully if IntersectionObserver is unavailable.
   ========================================================================== */

(function () {
  'use strict';

  /**
   * Initialize a single Mindful Guide Week section.
   * @param {HTMLElement} section - The section DOM element.
   */
  function initSection(section) {
    var motionEnabled = section.getAttribute('data-motion-enabled') === 'true';
    var motionStyle = section.getAttribute('data-motion') || 'none';
    var progressEnabled = section.getAttribute('data-progress-bar') === 'true';
    var progressId = section.getAttribute('data-progress-id');

    /* --- Motion: IntersectionObserver reveal --- */
    if (motionEnabled && motionStyle !== 'none') {
      initMotion(section);
    }

    /* --- Progress Bar --- */
    if (progressEnabled && progressId) {
      initProgressBar(progressId);
    }
  }

  /**
   * Motion reveal via IntersectionObserver.
   * Adds 'is-visible' class when blocks scroll into view.
   * @param {HTMLElement} section
   */
  function initMotion(section) {
    var prefersReduced =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var blocks = section.querySelectorAll('.mgw__block[data-motion]');

    if (!blocks.length) return;

    // Respect reduced motion — make everything visible immediately
    if (prefersReduced) {
      forEachNode(blocks, function (b) {
        b.classList.add('is-visible');
      });
      return;
    }

    // Use IntersectionObserver if available
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              entries[i].target.classList.add('is-visible');
              observer.unobserve(entries[i].target);
            }
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );

      forEachNode(blocks, function (b) {
        observer.observe(b);
      });
    } else {
      // Fallback: show everything
      forEachNode(blocks, function (b) {
        b.classList.add('is-visible');
      });
    }
  }

  /**
   * Reading progress bar — tracks scroll position.
   * Throttled via requestAnimationFrame.
   * @param {string} barId - The DOM id of the progress bar element.
   */
  function initProgressBar(barId) {
    var bar = document.getElementById(barId);
    if (!bar) return;

    var ticking = false;

    // Find footer element — try common Shopify selectors
    function getFooterHeight() {
      var footer =
        document.querySelector('.footer') ||
        document.querySelector('#shopify-section-footer') ||
        document.querySelector('[class*="footer"]') ||
        document.querySelector('footer');
      return footer ? footer.offsetHeight : 0;
    }

    function updateProgress() {
      var scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      var footerHeight = getFooterHeight();
      var docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight -
        footerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = Math.min(progress, 100) + '%';
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          window.requestAnimationFrame(updateProgress);
          ticking = true;
        }
      },
      { passive: true }
    );

    // Initial calculation
    updateProgress();
  }

  /**
   * Utility: iterate NodeList safely (IE compat).
   * @param {NodeList} nodes
   * @param {Function} fn
   */
  function forEachNode(nodes, fn) {
    for (var i = 0; i < nodes.length; i++) {
      fn(nodes[i]);
    }
  }

  /* --- Auto-initialize all sections on the page --- */
  function init() {
    var sections = document.querySelectorAll(
      '[data-section-type="mindful-guide"]'
    );
    forEachNode(sections, initSection);
  }

  // Run on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-initialize on Shopify section events (Theme Editor live reload)
  if (window.Shopify && window.Shopify.designMode) {
    document.addEventListener('shopify:section:load', function (event) {
      var section = event.target.querySelector(
        '[data-section-type="mindful-guide"]'
      );
      if (section) initSection(section);
    });
  }
})();