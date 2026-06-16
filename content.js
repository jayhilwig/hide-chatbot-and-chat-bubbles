(() => {
  const EXT_ATTR = "data-hcbb-hidden";
  const STYLE_ID = "hcbb-force-hide-style";

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
    "launcher",
    "open chat",
    "open messenger",
    "ai-chat",
    "assistant",
    "zsiq",
    "zsalesiq",
    "salesiq",
    "qualified",
  ];

  const excludeHints = [
    "cookie",
    "privacy",
    "consent",
    "recaptcha",
    "captcha",
    "video",
    "player",
    "toast",
    "snackbar",
    "feedback",
    "survey",
    "qualtrics",
    "qsi",
    "qsiap",
    "qsi-feedback",
    "qsifeedbackbutton",
    "usifeedbackbutton",
    "qr",
    "qr-code",
    "qrcode",
    "order in the app",
    "scan",
    "mobile app",
    "get the app",
    "download the app",
  ];

  const strongChatSelectors = [
    '[data-backend-test-id*="messenger" i]',
    '[data-backend-id*="messenger" i]',
    '[style*="--launcherButtonBackgroundColor"]',
    '[style*="--launcherImageUrl"]',
    'button[title*="open messenger" i]',
    'button[aria-label*="open messenger" i]',
  ];

  const explicitChatSelectors = [
    '[aria-label*="chat" i]',
    '[title*="chat" i]',
    '[id*="chat" i]',
    '[class*="chat" i]',
    '[aria-label*="messenger" i]',
    '[title*="messenger" i]',
    '[id*="messenger" i]',
    '[class*="messenger" i]',
    '[data-backend-id*="messenger" i]',
    '[data-backend-test-id*="messenger" i]',
    '[data-testid*="messenger" i]',
    '[data-test*="messenger" i]',
    '[data-qa*="messenger" i]',
    '[id*="zsiq" i]',
    '[class*="zsiq" i]',
    '[data-id*="zsalesiq" i]',
    '[position*="right-bottom" i]',
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

  function removeForceHideCss() {
    document.getElementById(STYLE_ID)?.remove();

    document.querySelectorAll(`[${EXT_ATTR}="true"]`).forEach((el) => {
      if (el instanceof HTMLElement) {
        el.removeAttribute(EXT_ATTR);
        el.style.removeProperty("display");
        el.style.removeProperty("visibility");
        el.style.removeProperty("opacity");
        el.style.removeProperty("pointer-events");
        el.style.removeProperty("width");
        el.style.removeProperty("height");
        el.style.removeProperty("min-width");
        el.style.removeProperty("min-height");
        el.style.removeProperty("overflow");
      }
    });
  }

  function injectForceHideCss() {
    let style = document.getElementById(STYLE_ID);

    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.documentElement.appendChild(style);
    }

    style.textContent = `
      [data-hcbb-hidden="true"],
      [data-backend-test-id*="messenger" i],
      [data-backend-id*="messenger" i],
      button[title*="open messenger" i],
      button[aria-label*="open messenger" i],
      div:has(> [data-backend-test-id*="messenger" i]),
      div:has(> [data-backend-id*="messenger" i]),
      div:has(> button[title*="open messenger" i]),
      div:has(> button[aria-label*="open messenger" i]) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        width: 0 !important;
        height: 0 !important;
        min-width: 0 !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }
    `;
  }

  function getAllRoots(root = document) {
    const roots = [root];

    const walker = document.createTreeWalker(
      root === document ? document.documentElement : root,
      NodeFilter.SHOW_ELEMENT,
    );

    let node;
    while ((node = walker.nextNode())) {
      if (node.shadowRoot) {
        roots.push(node.shadowRoot);
      }
    }

    return roots;
  }

  function getAllElements() {
    const elements = [];

    for (const root of getAllRoots()) {
      try {
        elements.push(...root.querySelectorAll("*"));
      } catch {}
    }

    return elements;
  }

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

    if (el.textContent && el.textContent.length < 220) {
      bits.push(el.textContent);
    }

    return bits.filter(Boolean).join(" ").toLowerCase();
  }

  function hasHint(el, hints) {
    const text = getElementText(el);
    return hints.some((hint) => text.includes(hint));
  }

  function isExcluded(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (hasHint(el, excludeHints)) return true;

    let node = el.parentElement;

    for (
      let i = 0;
      i < 5 &&
      node &&
      node !== document.body &&
      node !== document.documentElement;
      i++
    ) {
      if (hasHint(node, excludeHints)) return true;
      node = node.parentElement;
    }

    return false;
  }

  function getRect(el) {
    const rect = el.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    return rect;
  }

  function isVisibleEnough(el, rect) {
    const style = window.getComputedStyle(el);

    if (style.display === "none") return false;
    if (style.visibility === "hidden") return false;
    if (Number(style.opacity) === 0) return false;
    if (rect.width < 22 || rect.height < 22) return false;

    return true;
  }

  function isBottomRightish(rect) {
    const rightGap = window.innerWidth - rect.right;
    const bottomGap = window.innerHeight - rect.bottom;

    return (
      rightGap >= -50 &&
      rightGap <= 260 &&
      bottomGap >= -50 &&
      bottomGap <= 260 &&
      rect.right > window.innerWidth * 0.58 &&
      rect.bottom > window.innerHeight * 0.58
    );
  }

  function isReasonableWidgetSize(rect) {
    return (
      rect.width >= 22 &&
      rect.height >= 22 &&
      rect.width <= Math.min(680, window.innerWidth * 0.75) &&
      rect.height <= Math.min(760, window.innerHeight * 0.82)
    );
  }

  function isRoundishLauncher(rect) {
    const ratio = rect.width / rect.height;

    return (
      rect.width >= 42 &&
      rect.height >= 42 &&
      rect.width <= 120 &&
      rect.height <= 120 &&
      ratio >= 0.72 &&
      ratio <= 1.38
    );
  }

  function ancestorHasOverlayPosition(el) {
    let node = el;

    for (
      let i = 0;
      i < 6 &&
      node &&
      node !== document.body &&
      node !== document.documentElement;
      i++
    ) {
      if (!(node instanceof HTMLElement)) break;

      const position = window.getComputedStyle(node).position;

      if (
        position === "fixed" ||
        position === "sticky" ||
        position === "absolute"
      ) {
        return true;
      }

      node = node.parentElement;
    }

    return false;
  }

  function isPotentialChatElement(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (el.hasAttribute(EXT_ATTR)) return false;

    const rect = getRect(el);
    if (!rect) return false;
    if (!isVisibleEnough(el, rect)) return false;
    if (!isBottomRightish(rect)) return false;
    if (!isReasonableWidgetSize(rect)) return false;
    if (isExcluded(el)) return false;

    const hasProviderHint = hasHint(el, providerHints);

    const style = window.getComputedStyle(el);
    const tag = el.tagName.toLowerCase();

    const isIframe = tag === "iframe";
    const isButtonish =
      tag === "button" ||
      el.getAttribute("role") === "button" ||
      getElementText(el).includes("button");

    const hasInteractiveChild = Boolean(el.querySelector("button,a,img,svg"));
    const hasOverlayPosition = ancestorHasOverlayPosition(el);

    const looksLikeGenericLauncher =
      isRoundishLauncher(rect) &&
      hasOverlayPosition &&
      (tag === "button" ||
        el.getAttribute("role") === "button" ||
        hasInteractiveChild ||
        style.borderRadius.includes("%") ||
        Number.parseFloat(style.borderRadius) >= 20);

    return (
      hasProviderHint || isIframe || isButtonish || looksLikeGenericLauncher
    );
  }

  function hideElement(el) {
    if (!(el instanceof HTMLElement)) return;
    if (isExcluded(el)) return;

    el.setAttribute(EXT_ATTR, "true");
    el.style.setProperty("display", "none", "important");
    el.style.setProperty("visibility", "hidden", "important");
    el.style.setProperty("opacity", "0", "important");
    el.style.setProperty("pointer-events", "none", "important");
    el.style.setProperty("width", "0px", "important");
    el.style.setProperty("height", "0px", "important");
    el.style.setProperty("min-width", "0px", "important");
    el.style.setProperty("min-height", "0px", "important");
    el.style.setProperty("overflow", "hidden", "important");
  }

  function hideLauncherStack(el) {
    if (!(el instanceof HTMLElement)) return;
    if (isExcluded(el)) return;

    hideElement(el);

    let node = el.parentElement;

    for (
      let i = 0;
      i < 8 &&
      node &&
      node !== document.body &&
      node !== document.documentElement;
      i++
    ) {
      if (!(node instanceof HTMLElement)) break;
      if (isExcluded(node)) break;

      const rect = getRect(node);

      const style = window.getComputedStyle(node);
      const fixedish = ["fixed", "absolute", "sticky"].includes(style.position);

      const text = getElementText(node);
      const looksChatty =
        hasHint(node, providerHints) ||
        text.includes("messenger") ||
        text.includes("chat") ||
        text.includes("launcher");

      if (!rect) {
        if (fixedish || looksChatty) hideElement(node);
      } else {
        const sameLauncherArea =
          isBottomRightish(rect) && isReasonableWidgetSize(rect);

        if (sameLauncherArea && (fixedish || looksChatty)) {
          hideElement(node);
        }
      }

      node = node.parentElement;
    }
  }

  function sendState(enabled = true) {
    try {
      chrome.runtime.sendMessage({
        type: "HCBB_BADGE_UPDATE",
        count: enabled && pageHadBubble ? 1 : 0,
        enabled,
      });
    } catch {}
  }

  function scan() {
    injectForceHideCss();

    let found = false;
    const targets = new Set();

    for (const root of getAllRoots()) {
      for (const selector of strongChatSelectors) {
        try {
          root.querySelectorAll(selector).forEach((el) => {
            if (!(el instanceof HTMLElement)) return;
            if (isExcluded(el)) return;

            found = true;
            targets.add(el);
          });
        } catch {}
      }
    }

    for (const root of getAllRoots()) {
      for (const selector of explicitChatSelectors) {
        try {
          root.querySelectorAll(selector).forEach((el) => {
            if (!(el instanceof HTMLElement)) return;
            if (el.hasAttribute(EXT_ATTR)) return;
            if (isExcluded(el)) return;

            const rect = getRect(el);
            if (!rect) return;
            if (!isVisibleEnough(el, rect)) return;
            if (!isBottomRightish(rect)) return;
            if (!isReasonableWidgetSize(rect)) return;

            targets.add(el);
          });
        } catch {}
      }
    }

    for (const el of getAllElements()) {
      if (isPotentialChatElement(el)) {
        targets.add(el);
      }
    }

    for (const el of targets) {
      found = true;
      hideLauncherStack(el);
    }

    if (found) {
      pageHadBubble = true;
    }

    sendState(true);
  }

  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 100);
  }

  async function getEffectiveSettings() {
    try {
      return await chrome.runtime.sendMessage({
        type: "HCBB_GET_EFFECTIVE_SETTINGS",
      });
    } catch {
      return { enabled: true };
    }
  }

  async function init() {
    const settings = await getEffectiveSettings();

    if (!settings?.enabled) {
      removeForceHideCss();
      sendState(false);
      return;
    }

    injectForceHideCss();
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

    const initialScans = [250, 750, 1500, 3000, 6000, 10000, 15000];
    initialScans.forEach((delay) => setTimeout(scan, delay));

    const heartbeat = setInterval(scan, 2000);

    setTimeout(() => {
      clearInterval(heartbeat);
    }, 30000);
  }

  init();
})();
