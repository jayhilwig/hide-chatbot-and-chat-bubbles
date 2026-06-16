const tabStates = new Map();

function makeIcon(backgroundColor, letterColor = "#ffffff") {
  const size = 32;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, size, size);

  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.roundRect(2, 2, 28, 28, 7);
  ctx.fill();

  ctx.fillStyle = letterColor;
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("H", 16, 17);

  return ctx.getImageData(0, 0, size, size);
}

const icons = {
  idle: makeIcon("#777777"),
  active: makeIcon("#d93025"),
  off: makeIcon("#444444"),
};

async function setTabIcon(tabId, state) {
  if (!tabId) return;

  if (state === "active") {
    await chrome.action.setIcon({ tabId, imageData: icons.active });
    await chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }

  if (state === "off") {
    await chrome.action.setIcon({ tabId, imageData: icons.off });
    await chrome.action.setBadgeText({ tabId, text: "OFF" });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: "#777777" });
    return;
  }

  await chrome.action.setIcon({ tabId, imageData: icons.idle });
  await chrome.action.setBadgeText({ tabId, text: "" });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "HCBB_BADGE_UPDATE") {
    const tabId = sender.tab?.id;
    if (!tabId) return;

    const count = Number(message.count || 0);
    const enabled = message.enabled !== false;

    const state = enabled ? (count > 0 ? "active" : "idle") : "off";

    tabStates.set(tabId, {
      state,
      count,
      enabled,
      updatedAt: Date.now(),
    });

    setTabIcon(tabId, state);
    return;
  }

  if (message?.type === "HCBB_GET_TAB_STATE") {
    const tabId = message.tabId;
    sendResponse(
      tabStates.get(tabId) || {
        state: "idle",
        count: 0,
        enabled: true,
      },
    );
    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});
