(() => {
  const ENDPOINT = "https://events-worker.nick-598.workers.dev/events?key=pub_4273db5dc845b0da08a28052205c929cf616a427c108ce0146d0fe26e11d2d7a";
  const CLICK_PARAMS = ["gclid", "fbclid", "msclkid", "ttclid", "dclid"];
  const SESSION_TTL_MS = 30 * 60 * 1000;

  const COOKIE_DAYS = 30;

  const setCookie = (name, value, days) => {
    const exp = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Expires=${exp}; SameSite=Lax`;
  };

  const getCookie = (name) => {
    const prefix = name + "=";
    const parts = document.cookie.split("; ");
    for (const part of parts) {
      if (part.startsWith(prefix)) {
        return decodeURIComponent(part.slice(prefix.length));
      }
    }
    return "";
  };

  const now = () => Date.now();
  const rand = () => Math.random().toString(36).slice(2);
  const pageId = rand();
  const sessionKey = "cisoai_session_id";
  const sessionTsKey = "cisoai_session_ts";

  const url = new URL(window.location.href);
  let clickId = null;
  for (const p of CLICK_PARAMS) {
    if (url.searchParams.get(p)) { clickId = url.searchParams.get(p); break; }
  }
  if (!clickId) {
    for (const p of CLICK_PARAMS) {
      const fromCookie = getCookie(p);
      if (fromCookie) { clickId = fromCookie; break; }
    }
  } else {
    for (const p of CLICK_PARAMS) {
      const v = url.searchParams.get(p);
      if (v) setCookie(p, v, COOKIE_DAYS);
    }
  }

  let sessionId = sessionStorage.getItem(sessionKey);
  const lastTs = Number(sessionStorage.getItem(sessionTsKey) || 0);
  if (!sessionId || now() - lastTs > SESSION_TTL_MS) {
    sessionId = rand();
  }
  sessionStorage.setItem(sessionKey, sessionId);
  sessionStorage.setItem(sessionTsKey, String(now()));

  const referrerDomain = document.referrer ? (new URL(document.referrer)).hostname : "";
  const pagePath = window.location.pathname;
  const pageHost = window.location.hostname;
  const pageUrl = window.location.href;

  let maxScroll = 0;
  let visibleMs = 0;
  let lastVisibleTs = null;

  const onScroll = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const pct = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
    if (pct > maxScroll) maxScroll = pct;
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      lastVisibleTs = now();
    } else if (lastVisibleTs) {
      visibleMs += now() - lastVisibleTs;
      lastVisibleTs = null;
    }
  };

  document.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  onVisibilityChange();

  const nav = performance.getEntriesByType("navigation")[0];
  const ttiMs = nav ? Math.round(nav.domInteractive) : null;

  const send = (eventType, extra = {}) => {
    const payload = {
      event_type: eventType,
      ts_client: now(),
      session_id: sessionId,
      page_id: pageId,
      click_id: clickId,
      referrer_domain: referrerDomain,
      page_path: pagePath,
      page_host: pageHost,
      page_url: pageUrl,
      tti_ms: ttiMs,
      ...extra
    };
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, body);
    } else {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true
      }).catch(() => {});
    }
  };

  send("pageview");

  const onExit = () => {
    if (lastVisibleTs) {
      visibleMs += now() - lastVisibleTs;
      lastVisibleTs = null;
    }
    const timeOnPageMs = now() - (nav ? nav.startTime : performance.now());
    send("engagement", {
      time_on_page_ms: Math.round(timeOnPageMs),
      scroll_depth_pct: maxScroll,
      visibility_time_ms: Math.round(visibleMs)
    });
  };

  window.addEventListener("pagehide", onExit);
  window.addEventListener("beforeunload", onExit);

  window.cisoaiTrackConversion = (value, currency = "USD") => {
    send("conversion", { value, currency });
  };
})();
