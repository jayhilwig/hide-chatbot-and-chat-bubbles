(() => {
  const EXT_ATTR = "data-hcbb-hidden";
  const STYLE_ID = "hcbb-force-hide-style";
  const ORIGINAL_PREFIX = "data-hcbb-original-";

  const NEVER_BLOCK_HOSTS = [
    "chatgpt.com",
    "chat.openai.com",
    "claude.ai",
    "gemini.google.com",
    "copilot.microsoft.com",
    "perplexity.ai",
    "poe.com",
    "messenger.com",
    "web.whatsapp.com",
    "discord.com",
    "slack.com",
  ];

  let scanTimer = null;
  let pageHadBubble = false;

  const currentHost = window.location.hostname.replace(/^www\./, "");

  if (
    NEVER_BLOCK_HOSTS.some(
      (host) => currentHost === host || currentHost.endsWith(`.${host}`),
    )
  ) {
    console.log("[Hide Chatbot] Skipping full chat app:", currentHost);
    return;
  }

  const trustedProviderSelectors = [
    // Qualified / NinjaOne-style messenger launchers
    "#qualified-multimodal-host",
    '[id^="_qualified-offer-host-"]',
    '[id*="qualified-offer-host"]',
    ".q-docked-skeleton",
    '[class*="q-docked-skeleton"]',
    'iframe[src*="qualified" i]',
    'iframe[title*="qualified" i]',
    '[data-backend-test-id*="messenger" i]',
    '[data-backend-id*="messenger" i]',
    'button[title*="open messenger" i]',
    'button[aria-label*="open messenger" i]',
    '[style*="--launcherButtonBackgroundColor"]',
    '[style*="--launcherImageUrl"]',

    // Joinchat
    ".joinchat",
    ".joinchat__button",
    '[class*="joinchat" i]',

    // LivePerson / LiveEngage
    '[id^="LPMcontainer-"]',
    ".LPMcontainer",
    ".LPMoverlay",
    '[class*="LPMcontainer" i]',

    // Front Chat
    "#ch-shadow-root-wrapper",
    '[class*="ch-front" i]',
    '[class*="LauncherButtonWrapper-ch-front" i]',
  ];

  const providerSelectors = [
    // Intercom / Fin
    "#intercom-container",
    "#intercom-container-body",
    '[id*="intercom-container" i]',
    '[class*="intercom-namespace" i]',
    '[class*="intercom-launcher" i]',
    'iframe[class*="intercom" i]',
    'iframe[src*="intercom" i]',
    '[aria-label*="intercom messenger" i]',
    '[aria-label*="open intercom messenger" i]',

    // Zendesk Messaging
    'iframe#launcher[title*="launch messaging" i]',
    'iframe#launcher[title*="messaging window" i]',
    'iframe[title*="launch messaging" i]',
    'iframe[title*="messaging window" i]',

    // Crisp
    "#crisp-chatbox",
    '[id*="crisp-chatbox" i]',
    'iframe[src*="crisp" i]',

    // Tawk
    "#tawk-bubble-container",
    '[id*="tawk" i]',
    '[class*="tawk" i]',
    'iframe[src*="tawk" i]',

    // HubSpot
    "#live-chat-widget",
    '[id*="hubspot-messages" i]',
    'iframe[src*="hubspot" i]',

    // Delphi
    "#delphi-bubble-wrapper",
    "#delphi-bubble-container",
    "#delphi-root-encapsulation",
    '[id*="delphi" i]',
    '[class*="delphi-injected" i]',

    // Gorgias
    'iframe#chat-button[title*="gorgias" i]',
    'iframe#chat-campaigns[title*="gorgias" i]',
    'iframe[title*="gorgias live chat" i]',
    '[class*="gorgias-chat-key" i]',
    'iframe[src*="gorgias" i]',

    // Kustomer
    "#rootChatIcon",
    '[id*="rootChatIcon" i]',
    '[class*="chatRootIcon" i]',
    '[class*="chatIcon__chatIcon" i]',

    // Zoho SalesIQ
    "#zsiq_chat_wrap",
    'iframe[id*="zsiq" i]',
    'iframe[src*="salesiq" i]',
    'iframe[src*="zohosalesiq" i]',

    // Lifelink chatbot
    "#lifelink-chatbot-container",
    '[id*="lifelink-chatbot" i]',
    '[class*="icon-only-chatbot-frame" i]',

    // UJET
    "#widget-launcher.ujet-launcher",
    ".ujet-launcher",
    '[class*="ujet" i]',

    // Vision Helpdesk
    "#v4wid",
    ".vh-chatbot-container",
    ".vh-chatbot-icons",
    '[class*="vh-chatbot" i]',

    // Grace / Healthcare Smart Assistant
    "#healthcare-chatbot-fab-v2",
    "#healthcare-chatbot-fab-v2-btn",
    "#healthcare-chatbot",
    "#message-bubble-div-v2",
    "#message-bubble-fas-toast-container",
    '[class*="grace-" i]',

    // Common provider iframes
    'iframe[src*="freshchat" i]',
    'iframe[src*="freshworks" i]',
    'iframe[src*="freshdesk" i]',
    'iframe[src*="helpscout" i]',
    'iframe[src*="olark" i]',
    'iframe[src*="livechat" i]',
  ];

  const strongChatSelectors = [
    '[aria-label*="open chat" i]',
    '[aria-label*="live chat" i]',
    '[aria-label*="support chat" i]',
    '[aria-label*="customer chat" i]',
    '[aria-label*="chat with" i]',
    '[title*="open chat" i]',
    '[title*="live chat" i]',
    '[title*="support chat" i]',
    '[title*="customer chat" i]',
    '[class*="chat-widget" i]',
    '[class*="chat-bubble" i]',
    '[class*="chat-launcher" i]',
    '[id*="chat-widget" i]',
    '[id*="chat-bubble" i]',
    '[id*="chat-launcher" i]',
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
    "whatsapp",
    "wa.me",
    "order in the app",
    "scan",
    "mobile app",
    "get the app",
    "download the app",
    "google apps",
    "app launcher",
  ];

  const providerHints = [
    "intercom",
    "zendesk",
    "crisp",
    "tawk",
    "freshchat",
    "freshworks",
    "freshdesk",
    "hubspot",
    "gorgias",
    "kustomer",
    "zsiq",
    "zsalesiq",
    "salesiq",
    "qualified",
    "helpscout",
    "olark",
    "livechat",
    "liveperson",
    "liveengage",
    "lpmcontainer",
    "messenger",
    "live chat",
    "support chat",
    "customer chat",
    "chat widget",
    "chat bubble",
    "chat launcher",
    "open chat",
    "open messenger",
    "ch-front",
    "front chat",
  ];

  function getAllRoots(root = document) {
    const roots = [root];

    try {
      const walker = document.createTreeWalker(
        root === document ? document.documentElement : root,
        NodeFilter.SHOW_ELEMENT,
      );

      let node;
      while ((node = walker.nextNode())) {
        if (node.shadowRoot) {
          roots.push(node.shadowRoot);

          try {
            const shadowWalker = document.createTreeWalker(
              node.shadowRoot,
              NodeFilter.SHOW_ELEMENT,
            );

            let shadowNode;
            while ((shadowNode = shadowWalker.nextNode())) {
              if (shadowNode.shadowRoot) {
                roots.push(shadowNode.shadowRoot);
              }
            }
          } catch {}
        }
      }
    } catch {}

    return roots;
  }

  function injectForceHideCss() {
    const css = `
      [${EXT_ATTR}="true"],
      [id^="_qualified-offer-host-"],
      [id*="qualified-offer-host"],
      #qualified-multimodal-host,
      .q-docked-skeleton,
      [class*="q-docked-skeleton"],
      [id^="LPMcontainer-"],
      .LPMcontainer,
      .LPMoverlay,
      [class*="LPMcontainer"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;

    for (const root of getAllRoots()) {
      try {
        let style = root.querySelector?.(`#${STYLE_ID}`);

        if (!style) {
          style = document.createElement("style");
          style.id = STYLE_ID;

          if (root === document) {
            document.documentElement.appendChild(style);
          } else {
            root.appendChild(style);
          }
        }

        style.textContent = css;
      } catch {}
    }
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

    if (el.textContent && el.textContent.length < 260) {
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
    if (rect.width < 20 || rect.height < 20) return false;

    return true;
  }

  function isRightSide(rect) {
    const rightGap = window.innerWidth - rect.right;

    return (
      rightGap >= -80 &&
      rightGap <= Math.max(320, window.innerWidth * 0.35) &&
      rect.right > window.innerWidth * 0.5
    );
  }

  function isLowerArea(rect) {
    const bottomGap = window.innerHeight - rect.bottom;

    return (
      bottomGap >= -80 &&
      bottomGap <= Math.max(360, window.innerHeight * 0.45) &&
      rect.bottom > window.innerHeight * 0.45
    );
  }

  function isLikelyFloatingChatArea(rect) {
    return isRightSide(rect) && isLowerArea(rect);
  }

  function isReasonableChatSize(rect) {
    return (
      rect.width >= 20 &&
      rect.height >= 20 &&
      rect.width <= Math.max(760, window.innerWidth * 0.85) &&
      rect.height <= Math.max(760, window.innerHeight * 0.95)
    );
  }

  function canHideBodyOrHtml(el) {
    if (!(el instanceof HTMLElement)) return false;

    const tag = el.tagName.toLowerCase();
    if (tag !== "body" && tag !== "html") return true;

    const text = getElementText(el);

    return (
      text.includes("intercom-container-body") ||
      text.includes("crisp-chatbox") ||
      text.includes("tawk") ||
      text.includes("gorgias") ||
      text.includes("qualified-multimodal-host") ||
      text.includes("lpmcontainer")
    );
  }

  function shouldHideProviderMatch(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (el.hasAttribute(EXT_ATTR)) return false;
    if (isExcluded(el)) return false;
    if (!canHideBodyOrHtml(el)) return false;

    const rect = getRect(el);
    if (!rect) return false;
    if (!isVisibleEnough(el, rect)) return false;
    if (!isReasonableChatSize(rect)) return false;

    return isLikelyFloatingChatArea(rect) || hasHint(el, providerHints);
  }

  function shouldHideStrongTextMatch(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (el.hasAttribute(EXT_ATTR)) return false;
    if (isExcluded(el)) return false;
    if (!canHideBodyOrHtml(el)) return false;

    const rect = getRect(el);
    if (!rect) return false;
    if (!isVisibleEnough(el, rect)) return false;
    if (!isReasonableChatSize(rect)) return false;

    return isLikelyFloatingChatArea(rect);
  }

  function rememberOriginalStyle(el, prop) {
    const valueKey = `${ORIGINAL_PREFIX}${prop}`;
    const priorityKey = `${ORIGINAL_PREFIX}${prop}-priority`;

    if (el.hasAttribute(valueKey)) return;

    el.setAttribute(valueKey, el.style.getPropertyValue(prop) || "");
    el.setAttribute(priorityKey, el.style.getPropertyPriority(prop) || "");
  }

  function restoreOriginalStyle(el, prop) {
    const valueKey = `${ORIGINAL_PREFIX}${prop}`;
    const priorityKey = `${ORIGINAL_PREFIX}${prop}-priority`;

    if (!el.hasAttribute(valueKey)) return;

    const value = el.getAttribute(valueKey) || "";
    const priority = el.getAttribute(priorityKey) || "";

    if (value) {
      el.style.setProperty(prop, value, priority);
    } else {
      el.style.removeProperty(prop);
    }

    el.removeAttribute(valueKey);
    el.removeAttribute(priorityKey);
  }

  function hideElement(el) {
    if (!(el instanceof HTMLElement)) return;
    if (!canHideBodyOrHtml(el)) return;

    const props = [
      "display",
      "visibility",
      "opacity",
      "pointer-events",
      "width",
      "height",
      "min-width",
      "min-height",
      "overflow",
    ];

    props.forEach((prop) => rememberOriginalStyle(el, prop));

    el.setAttribute(EXT_ATTR, "true");
    el.style.setProperty("display", "none", "important");
    el.style.setProperty("visibility", "hidden", "important");
    el.style.setProperty("opacity", "0", "important");
    el.style.setProperty("pointer-events", "none", "important");
  }

  function restoreHiddenElements() {
    for (const root of getAllRoots()) {
      try {
        root.querySelectorAll(`[${EXT_ATTR}="true"]`).forEach((el) => {
          if (!(el instanceof HTMLElement)) return;

          el.removeAttribute(EXT_ATTR);

          [
            "display",
            "visibility",
            "opacity",
            "pointer-events",
            "width",
            "height",
            "min-width",
            "min-height",
            "overflow",
          ].forEach((prop) => restoreOriginalStyle(el, prop));
        });
      } catch {}
    }
  }

  function removeForceHideCss() {
    for (const root of getAllRoots()) {
      try {
        root.querySelector?.(`#${STYLE_ID}`)?.remove();
      } catch {}
    }

    restoreHiddenElements();
  }

  function findProviderAncestor(el) {
    // Zoho's outer wrapper can include a separate WhatsApp button.
    // Hide only the actual SalesIQ chat wrapper.
    if (el.id === "zsiq_chat_wrap") {
      return el;
    }

    let best = el;
    let node = el.parentElement;

    for (
      let i = 0;
      i < 6 &&
      node &&
      node !== document.body &&
      node !== document.documentElement;
      i++
    ) {
      if (!(node instanceof HTMLElement)) break;
      if (isExcluded(node)) break;

      const rect = getRect(node);
      if (!rect) break;
      if (!isVisibleEnough(node, rect)) break;
      if (!isReasonableChatSize(rect)) break;

      const style = window.getComputedStyle(node);
      const floating = ["fixed", "absolute", "sticky"].includes(style.position);
      const providerish = hasHint(node, providerHints);

      if ((floating || providerish) && isLikelyFloatingChatArea(rect)) {
        best = node;
      }

      node = node.parentElement;
    }

    return best;
  }

  function findTrustedProviderRoot(el) {
    if (el.id && el.id.startsWith("_qualified-offer-host-")) {
      return el;
    }

    if (el.id && el.id.startsWith("LPMcontainer-")) {
      return el;
    }

    const qualifiedOfferHost = el.closest?.('[id^="_qualified-offer-host-"]');
    if (qualifiedOfferHost instanceof HTMLElement) {
      return qualifiedOfferHost;
    }

    const livePersonHost = el.closest?.(
      '[id^="LPMcontainer-"], .LPMcontainer, .LPMoverlay',
    );
    if (livePersonHost instanceof HTMLElement) {
      return livePersonHost;
    }

    let best = el;
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

      const rect = getRect(node);
      if (!rect) break;

      const style = window.getComputedStyle(node);
      const floating = ["fixed", "absolute", "sticky"].includes(style.position);
      const providerish = hasHint(node, providerHints);

      const sameArea =
        isLikelyFloatingChatArea(rect) && isReasonableChatSize(rect);

      if (sameArea && (floating || providerish)) {
        best = node;
      }

      node = node.parentElement;
    }

    return best;
  }

  function forceHideKnownShells() {
    const selectors = [
      // Qualified
      '[id^="_qualified-offer-host-"]',
      '[id*="qualified-offer-host"]',
      "#qualified-multimodal-host",
      ".q-docked-skeleton",
      '[class*="q-docked-skeleton"]',

      // LivePerson / LiveEngage
      '[id^="LPMcontainer-"]',
      ".LPMcontainer",
      ".LPMoverlay",
      '[class*="LPMcontainer" i]',
    ];

    let found = false;

    for (const root of getAllRoots()) {
      for (const selector of selectors) {
        try {
          root.querySelectorAll(selector).forEach((el) => {
            if (!(el instanceof HTMLElement)) return;

            found = true;
            el.setAttribute(EXT_ATTR, "true");
            el.style.setProperty("display", "none", "important");
            el.style.setProperty("visibility", "hidden", "important");
            el.style.setProperty("opacity", "0", "important");
            el.style.setProperty("pointer-events", "none", "important");
          });
        } catch {}
      }
    }

    return found;
  }

  function collectMatches() {
    const targets = new Set();

    // Trusted provider matches are specific enough to avoid generic button logic.
    for (const root of getAllRoots()) {
      for (const selector of trustedProviderSelectors) {
        try {
          root.querySelectorAll(selector).forEach((el) => {
            if (!(el instanceof HTMLElement)) return;
            targets.add(findTrustedProviderRoot(el));
          });
        } catch {}
      }
    }

    // Known provider selectors.
    for (const root of getAllRoots()) {
      for (const selector of providerSelectors) {
        try {
          root.querySelectorAll(selector).forEach((el) => {
            if (shouldHideProviderMatch(el)) {
              targets.add(findProviderAncestor(el));
            }
          });
        } catch {}
      }

      // Strong chat labels still require geometry checks.
      for (const selector of strongChatSelectors) {
        try {
          root.querySelectorAll(selector).forEach((el) => {
            if (shouldHideStrongTextMatch(el)) {
              targets.add(findProviderAncestor(el));
            }
          });
        } catch {}
      }
    }

    return targets;
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

    const knownShellFound = forceHideKnownShells();
    const targets = collectMatches();

    if (knownShellFound || targets.size > 0) {
      pageHadBubble = true;
      targets.forEach(hideElement);
    }

    // If anything is already hidden by this extension,
    // keep the icon/status active even if a later scan finds zero targets.
    try {
      for (const root of getAllRoots()) {
        if (root.querySelector?.(`[${EXT_ATTR}="true"]`)) {
          pageHadBubble = true;
          break;
        }
      }
    } catch {}

    sendState(true);
  }

  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 120);
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

    function startObserver() {
      const target = document.documentElement || document.body;

      if (!target || !(target instanceof Node)) {
        return;
      }

      observer.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          "class",
          "style",
          "id",
          "aria-label",
          "title",
          "src",
          "data-testid",
          "data-test",
          "data-qa",
          "data-backend-id",
          "data-backend-test-id",
        ],
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startObserver, {
        once: true,
      });
    } else {
      startObserver();
    }

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
