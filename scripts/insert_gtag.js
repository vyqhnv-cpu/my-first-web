const fs = require('fs');
let content = fs.readFileSync('public/khoa-hoc/tarot-va-tam-ly-hoc.html', 'utf8');
const gtagSnippet = `
    <!-- Event snippet for Lượt xem trang conversion page -->
    <script>
    function gtag_report_conversion(url) {
      var callback = function () {
        if (typeof(url) != 'undefined') {
          window.location = url;
        }
      };
      // Ensure gtag is defined if it isn't already via GTM
      window.gtag = window.gtag || function(){ window.dataLayer = window.dataLayer || []; dataLayer.push(arguments); };
      gtag('event', 'conversion', {
          'send_to': 'AW-947708717/L-EFCM-HleUcEK3G88MD',
          'value': 1.0,
          'currency': 'VND',
          'event_callback': callback
      });
      return false;
    }
    </script>`;

content = content.replace('</head>', gtagSnippet + '\n  </head>');

// Also update the form submission to call this snippet
const formCallbackOld = `                      if (window.trackFbEvent) {
                        window.trackFbEvent('Lead', { content_name: document.title }, { email: payload.email, phone: payload.phone });
                      }`;
const formCallbackNew = `                      if (window.trackFbEvent) {
                        window.trackFbEvent('Lead', { content_name: document.title }, { email: payload.email, phone: payload.phone });
                      }
                      // Gọi sự kiện Google Ads conversion
                      if (typeof gtag_report_conversion === 'function') {
                        gtag_report_conversion(); // Gọi không có tham số URL để không bị redirect
                      }`;

content = content.replace(formCallbackOld, formCallbackNew);

fs.writeFileSync('public/khoa-hoc/tarot-va-tam-ly-hoc.html', content);
