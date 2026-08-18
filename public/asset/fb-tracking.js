// Helper function to read cookie
function getCookie(name) {
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? m[2] : null;
}

// Generate unique event_id for deduplication
function genEventId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Global generic track event
window.trackFbEvent = async function(eventName, customData = {}, userData = {}) {
  // Always ensure pixel is initialized first
  if (!window.fbPixelId) {
    console.warn('[FB Tracking] Pixel ID not loaded yet, skipping event:', eventName);
    return;
  }

  const eventId = genEventId();
  const fbp = getCookie('_fbp');
  let fbc = getCookie('_fbc');
  
  // If url contains fbclid and no _fbc cookie, we should construct it
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  if (fbclid && !fbc) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
  }

  // 1. Send Client-side Event via Pixel
  if (typeof fbq === 'function') {
    fbq('track', eventName, customData, { eventID: eventId });
  }

  // 2. Send Server-side Event via CAPI
  try {
    await fetch('/api/fb/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        event_id: eventId,
        event_source_url: window.location.href,
        fbp,
        fbc,
        custom_data: customData,
        user_data: userData
      })
    });
  } catch (err) {
    console.error('[CAPI Tracking Error]', err);
  }
};

// Initialize Pixel dynamically
async function initFbPixel() {
  try {
    const res = await fetch('/api/fb/config');
    const data = await res.json();
    const pixelId = data.pixelId;
    
    if (!pixelId || pixelId === 'MISSING_PIXEL_ID') {
      console.warn('[FB Tracking] FB_PIXEL_ID not configured in backend.');
      return;
    }
    
    window.fbPixelId = pixelId;

    // Load Pixel Base Code
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    
    fbq('init', pixelId);
    
    // Auto fire ViewContent globally
    window.trackFbEvent('ViewContent', { content_name: document.title });
    
  } catch (err) {
    console.error('[FB Tracking] Failed to initialize pixel', err);
  }
}

// Run init on load
initFbPixel();
