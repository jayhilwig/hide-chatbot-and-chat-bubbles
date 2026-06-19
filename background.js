const tabStates = new Map();

function makeIcon(backgroundColor, letterColor = "#ffffff") {
  const size = 32;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, size, size);

  ctx.fillStyle = backgroundColor;

  // Larger main speech bubble
  ctx.beginPath();
  ctx.roundRect(1, 1, 30, 25, 6);
  ctx.fill();

  // Larger tail, tucked into the canvas
  ctx.beginPath();
  ctx.moveTo(9, 24);
  ctx.lineTo(3, 31);
  ctx.lineTo(18, 25);
  ctx.closePath();
  ctx.fill();

  // Slightly larger C
  ctx.fillStyle = letterColor;
  ctx.font = "bold 22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("C", 16, 15);

  return ctx.getImageData(0, 0, size, size);
}

const icons = {
  idle: makeIcon("#777777"),
  active: makeIcon("#d93025"),
};

async function setTabIcon(tabId, state) {
  if (!tabId) return;

  try {
    if (state === "active") {
      await chrome.action.setIcon({ tabId, imageData: icons.active });
      await chrome.action.setBadgeText({ tabId, text: "" });
      return;
    }

    await chrome.action.setIcon({ tabId, imageData: icons.idle });
    await chrome.action.setBadgeText({ tabId, text: "" });
  } catch {
    // Tab may have closed or navigated before the icon update completed.
  }
}

function getStoredState(tabId) {
  return (
    tabStates.get(tabId) || {
      state: "idle",
      count: 0,
      enabled: true,
      updatedAt: Date.now(),
    }
  );
}

function getHostnameFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

async function getEffectiveSettingsForTab(tab) {
  const { globalDisabled = false, disabledSites = {} } =
    await chrome.storage.sync.get({
      globalDisabled: false,
      disabledSites: {},
    });

  const topHostname = getHostnameFromUrl(tab?.url || "");
  const siteDisabled = Boolean(disabledSites[topHostname]);

  return {
    enabled: !globalDisabled && !siteDisabled,
    globalDisabled,
    siteDisabled,
    topHostname,
  };
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setIcon({ imageData: icons.idle });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.action.setIcon({ imageData: icons.idle });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "HCBB_GET_EFFECTIVE_SETTINGS") {
    getEffectiveSettingsForTab(sender.tab).then(sendResponse);
    return true;
  }

  if (message?.type === "HCBB_BADGE_UPDATE") {
    const tabId = sender.tab?.id;
    if (!tabId) return false;

    const incomingCount = Number(message.count || 0);
    const incomingEnabled = message.enabled !== false;
    const previous = getStoredState(tabId);

    let nextState = previous.state;
    let nextCount = previous.count;

    // Disabled/off means gray idle. No OFF badge.
    if (!incomingEnabled) {
      nextState = "idle";
      nextCount = 0;
    }

    // Any frame detecting a chat bubble makes the tab active.
    else if (incomingCount > 0) {
      nextState = "active";
      nextCount = 1;
    }

    // With all_frames enabled, empty frames should not erase
    // an active detection from another frame.
    else if (previous.state === "active") {
      nextState = "active";
      nextCount = 1;
    }

    // No detection yet.
    else {
      nextState = "idle";
      nextCount = 0;
    }

    tabStates.set(tabId, {
      state: nextState,
      count: nextCount,
      enabled: incomingEnabled,
      updatedAt: Date.now(),
    });

    setTabIcon(tabId, nextState);
    return false;
  }

  if (message?.type === "HCBB_GET_TAB_STATE") {
    const tabId = message.tabId;
    sendResponse(getStoredState(tabId));
    return true;
  }

  return false;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    tabStates.set(tabId, {
      state: "idle",
      count: 0,
      enabled: true,
      updatedAt: Date.now(),
    });

    setTabIcon(tabId, "idle");
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});
