<?php
/**
 * Loads the editorial and shared-funnel GA4 destinations only after
 * CookieYes grants Analytics consent.
 *
 * WordPress deployment: Code Snippets, PHP, run everywhere.
 */
add_action('wp_head', function () {
    if (is_admin()) {
        return;
    }
    ?>
    <script>
    (function () {
      function hasAnalyticsConsent() {
        var match = document.cookie.match(/(?:^|;\s*)cookieyes-consent=([^;]+)/i);
        if (!match) return false;

        var value = decodeURIComponent(match[1]).toLowerCase();
        value = value.replace(/[;|]/g, ',');
        return /(?:^|,)analytics:(?:yes|true)(?:,|$)/.test(value);
      }

      function loadEditorialAnalytics() {
        if (!hasAnalyticsConsent() || window.__ammacGaLoaded) return;
        window.__ammacGaLoaded = true;

        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () {
          window.dataLayer.push(arguments);
        };

        window.gtag('consent', 'default', {
          ad_storage: 'denied',
          analytics_storage: 'granted',
          ad_user_data: 'denied',
          ad_personalization: 'denied'
        });

        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + 'G-' + '075JTS42RZ';
        document.head.appendChild(script);

        window.gtag('js', new Date());
        var privacyConfig = {
          allow_google_signals: false,
          allow_ad_personalization_signals: false
        };
        window.gtag('config', 'G-' + '075JTS42RZ', privacyConfig);
        window.gtag('config', 'G-' + 'P0CNEGW276', privacyConfig);
      }

      function getCtaPosition(link) {
        if (link.closest('header, nav')) return 'header';
        if (link.closest('footer')) return 'footer';
        return 'content';
      }

      function getSourceContentId() {
        var match = document.body.className.match(/\b(?:page|post)-id-(\d+)\b/);
        return match ? match[1] : '';
      }

      document.addEventListener('click', function (event) {
        var link = event.target.closest('a[href]');
        if (!link || !window.__ammacGaLoaded) return;

        var target;
        try {
          target = new URL(link.href, window.location.href);
        } catch (error) {
          return;
        }

        if (target.hostname.replace(/^www\./, '') !== 'certificacionmontessori.com') {
          return;
        }

        var pathProgram = target.pathname.replace(/^\/+|\/+$/g, '').split('/').pop();
        var params = {
          send_to: 'G-' + 'P0CNEGW276',
          transport_type: 'beacon',
          program_id: link.getAttribute('data-program-id') || pathProgram || 'guia-montessori',
          source_hostname: window.location.hostname.replace(/^www\./, ''),
          source_content_id: getSourceContentId(),
          landing_path: target.pathname,
          cta_position: getCtaPosition(link),
          lead_channel: 'editorial_referral',
          language: document.documentElement.lang || 'es'
        };

        if (new URLSearchParams(window.location.search).get('ga_debug') === '1') {
          params.debug_mode = true;
        }

        window.gtag('event', 'click_program_cta', params);
      }, true);

      loadEditorialAnalytics();
      var checks = 0;
      var timer = window.setInterval(function () {
        loadEditorialAnalytics();
        checks += 1;
        if (window.__ammacGaLoaded || checks >= 20) {
          window.clearInterval(timer);
        }
      }, 500);
    }());
    </script>
    <?php
});
