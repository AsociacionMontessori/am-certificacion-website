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
      var measurementIds = [
        'G-' + '075JTS42RZ',
        'G-' + 'P0CNEGW276'
      ];

      function hasAnalyticsConsent() {
        var match = document.cookie.match(/(?:^|;\s*)cookieyes-consent=([^;]+)/i);
        if (!match) return false;

        var value;
        try {
          value = decodeURIComponent(match[1]);
        } catch (error) {
          value = match[1];
        }
        value = value.toLowerCase();
        value = value.replace(/[;|]/g, ',');
        return /(?:^|,)analytics:(?:yes|true)(?:,|$)/.test(value);
      }

      function consentSettings(analyticsStorage) {
        return {
          ad_storage: 'denied',
          analytics_storage: analyticsStorage,
          ad_user_data: 'denied',
          ad_personalization: 'denied'
        };
      }

      function setMeasurementDisabled(disabled) {
        for (var index = 0; index < measurementIds.length; index += 1) {
          window['ga-disable-' + measurementIds[index]] = disabled;
        }
      }

      function ensureGtag() {
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () {
          window.dataLayer.push(arguments);
        };
      }

      function updateAnalyticsConsent(granted) {
        ensureGtag();
        window.gtag(
          'consent',
          'update',
          consentSettings(granted ? 'granted' : 'denied')
        );
      }

      function loadEditorialAnalytics() {
        if (window.__ammacGaLoaded) return true;

        ensureGtag();

        window.gtag('consent', 'default', consentSettings('denied'));
        updateAnalyticsConsent(true);
        window.gtag('js', new Date());
        var privacyConfig = {
          allow_google_signals: false,
          allow_ad_personalization_signals: false
        };
        window.gtag('config', measurementIds[0], privacyConfig);
        window.gtag('config', measurementIds[1], privacyConfig);

        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementIds[0];
        document.head.appendChild(script);
        window.__ammacGaLoaded = true;
        return true;
      }

      function synchronizeAnalyticsConsent() {
        var granted = hasAnalyticsConsent();
        setMeasurementDisabled(!granted);

        if (window.__ammacAnalyticsConsent === granted) return;

        if (granted) {
          if (window.__ammacGaLoaded) {
            updateAnalyticsConsent(true);
          } else if (!loadEditorialAnalytics()) {
            return;
          }
        } else if (window.__ammacGaLoaded) {
          updateAnalyticsConsent(false);
        }

        window.__ammacAnalyticsConsent = granted;
      }

      document.addEventListener(
        'cookieyes_consent_update',
        synchronizeAnalyticsConsent
      );
      document.addEventListener('click', synchronizeAnalyticsConsent, true);
      synchronizeAnalyticsConsent();
      window.setInterval(synchronizeAnalyticsConsent, 2000);
    }());
    </script>
    <?php
});
