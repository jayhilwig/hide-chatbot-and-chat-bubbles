(() => {
  const EXT_ATTR = "data-hcbb-hidden";
  const ORIGINAL_DISPLAY_ATTR = "data-hcbb-original-display";
  const ORIGINAL_DISPLAY_PRIORITY_ATTR = "data-hcbb-original-display-priority";

  let scanTimer = null;
  let pageHadBubble = false;

  const providerHints = [
    "intercom",
    "drift",
    "zendesk",
    "crisp",
    "tawk",
    "freshchat",
    "freshdesk",
    "hubspot",
    "gorgias",
    "helpscout",
    "olark",
    "livechat",
    "live-chat",
    "chat-widget",
    "chatbot",
    "chat-bot",
    "messenger",
    "support-chat",
    "customer-chat",
    "chat-bubble",
    "chat launcher",
    "chat-launcher",
    "ai-chat",
    "assistant",

    "zsiq",
    "zsalesiq",
    "salesiq",
    "live chat widget",

    "messenger-button",
    "qualified",
    "launcherbutton",
    "launcherimage",
    "open messenger",
  ];

  const safeHints = [
    "cookie",
    "privacy",
    "consent",
    "recaptcha",
    "captcha",
    "video",
    "player",
    "toast",
    "snackbar",
  ];

  const explicitChatSelectors = [
    '[aria-label*="chat" i]',
    '[title*="chat" i]',
    '[id*="chat" i]',
    '[class*="chat" i]',

    '[id*="zsiq" i]',
    '[class*="zsiq" i]',
    '[data-id*="zsalesiq" i]',
    '[position*="right-bottom" i]',

    '[data-backend-id*="messenger" i]',
    '[data-backend-test-id*="messenger" i]',
    '[data-testid*="messenger" i]',
    '[data-test*="messenger" i]',
    '[data-qa*="messenger" i]',

    '[title*="messenger" i]',
    '[aria-label*="messenger" i]',

    '[style*="--launcherButtonBackgroundColor"]',
    '[style*="--launcherImageUrl"]',

    'iframe[src*="intercom" i]',
    'iframe[src*="drift" i]',
    'iframe[src*="zendesk" i]',
    'iframe[src*="crisp" i]',
    'iframe[src*="tawk" i]',
    'iframe[src*="freshchat" i]',
    'iframe[src*="hubspot" i]',
    'iframe[src*="gorgias" i]',
    'iframe[src*="qualified" i]',
    'iframe[src*="messenger" i]',
    'iframe[src*="chat" i]',
  ];

  function getElementText(el) {
    const bits = [];

    try {
      for (const attr of el.getAttributeNames()) {
        bits.push(attr);
        bits.push(el.getAttribute(attr));
      }
    } catch {}

    bits.push(el.id);
    bits.push(String(el.className || ""));

    if (el.textContent && el.textContent.length < 160) {
      bits.push(el.textContent);
    }

    return bits.filter(Boolean).join(" ").toLowerCase();
  }

  function hasHint(el, hints) {
    const text = getElementText(el);
    return hints.some((hint) => text.includes(hint));
  }

  function getRect(el) {
    const rect = el.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    return rect;
  }

  function isBottomRightish(rect) {
    const rightGap = window.innerWidth - rect.right;
    const bottomGap = window.innerHeight - rect.bottom;

    return (
      rightGap >= -60 &&
      rightGap <= 320 &&
      bottomGap >= -60 &&
      bottomGap <= 320 &&
      rect.right > window.innerWidth * 0.5 &&
      rect.bottom > window.innerHeight * 0.5
    );
  }

  function isReasonableWidgetSize(rect) {
    return (
      rect.width >= 28 &&
      rect.height >= 28 &&
      rect.width <= Math.min(760, window.innerWidth * 0.8) &&
      rect.height <= Math.min(860, window.innerHeight * 0.9)
    );
  }

  function isPotentialChatElement(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (el.hasAttribute(EXT_ATTR)) return false;

    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;

    const rect = getRect(el);
    if (!rect) return false;
    if (!isBottomRightish(rect)) return false;
    if (!isReasonableWidgetSize(rect)) return false;

    const hasProviderHint = hasHint(el, providerHints);
    const hasSafeHint = hasHint(el, safeHints);

    if (hasSafeHint && !hasProviderHint) return false;

    const position = style.position;
    const zIndex = Number.parseInt(style.zIndex, 10);
    const hasOverlayPosition =
      position === "fixed" || position === "sticky" || position === "absolute";

    const hasHighZ = Number.isFinite(zIndex) && zIndex >= 20;

    const tag = el.tagName.toLowerCase();
    const isIframe = tag === "iframe";
    const isButtonish =
      tag === "button" ||
      el.getAttribute("role") === "button" ||
      getElementText(el).includes("button");

    return (
      hasProviderHint ||
      isIframe ||
      isButtonish ||
      (hasOverlayPosition && hasHighZ)
    );
  }

  function findBestHideTarget(el) {
    let best = el;
    let node = el;

    for (
      let i = 0;
      i < 8 &&
      node &&
      node !== document.body &&
      node !== document.documentElement;
      i++
    ) {
      if (!(node instanceof HTMLElement)) break;

      const rect = getRect(node);
      if (!rect) break;

      const text = getElementText(node);
      const looksChatty =
        hasHint(node, providerHints) ||
        text.includes("right-bottom") ||
        text.includes("messenger") ||
        text.includes("zsalesiq") ||
        text.includes("zsiq");

      if (
        isBottomRightish(rect) &&
        isReasonableWidgetSize(rect) &&
        looksChatty
      ) {
        best = node;
      }

      node = node.parentElement;
    }

    return best;
  }

  function hideElement(el) {
    if (!(el instanceof HTMLElement)) return;
    if (el.hasAttribute(EXT_ATTR)) return;

    el.setAttribute(
      ORIGINAL_DISPLAY_ATTR,
      el.style.getPropertyValue("display") || "",
    );
    el.setAttribute(
      ORIGINAL_DISPLAY_PRIORITY_ATTR,
      el.style.getPropertyPriority("display") || "",
    );

    el.setAttribute(EXT_ATTR, "true");
    el.style.setProperty("display", "none", "important");
  }

  function sendState() {
    try {
      chrome.runtime.sendMessage({
        type: "HCBB_BADGE_UPDATE",
        count: pageHadBubble ? 1 : 0,
        enabled: true,
      });
    } catch {}
  }

  function getExplicitCandidates() {
    const candidates = new Set();

    for (const selector of explicitChatSelectors) {
      try {
        document.querySelectorAll(selector).forEach((el) => candidates.add(el));
      } catch {}
    }

    return candidates;
  }

  function scan() {
    const targets = new Set();

    getExplicitCandidates().forEach((el) => {
      if (isPotentialChatElement(el)) {
        targets.add(findBestHideTarget(el));
      }
    });

    document.querySelectorAll("body *").forEach((el) => {
      if (isPotentialChatElement(el)) {
        targets.add(findBestHideTarget(el));
      }
    });

    if (targets.size > 0) {
      pageHadBubble = true;
      targets.forEach(hideElement);
    }

    sendState();
  }

  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 150);
  }

  async function getSettings() {
    return await chrome.storage.sync.get({
      globalDisabled: false,
      disabledSites: {},
    });
  }

  async function init() {
    const hostname = window.location.hostname;
    const { globalDisabled, disabledSites } = await getSettings();

    if (globalDisabled || disabledSites[hostname]) {
      try {
        chrome.runtime.sendMessage({
          type: "HCBB_BADGE_UPDATE",
          count: 0,
          enabled: false,
        });
      } catch {}
      return;
    }

    scan();

    const observer = new MutationObserver(scheduleScan);

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "class",
        "style",
        "id",
        "aria-label",
        "title",
        "data-backend-id",
        "data-backend-test-id",
        "data-testid",
        "data-test",
        "data-qa",
        "position",
      ],
    });

    window.addEventListener("resize", scheduleScan);

    setTimeout(scan, 500);
    setTimeout(scan, 1500);
    setTimeout(scan, 3000);
    setTimeout(scan, 6000);
  }

  init();
})();
