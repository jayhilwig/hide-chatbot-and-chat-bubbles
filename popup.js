async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;

  try {
    return {
      id: tab.id,
      url: tab.url,
      hostname: new URL(tab.url).hostname,
    };
  } catch {
    return null;
  }
}

async function getSettings() {
  return await chrome.storage.sync.get({
    globalDisabled: false,
    disabledSites: {},
  });
}

async function getTabState(tabId) {
  return await chrome.runtime.sendMessage({
    type: "HCBB_GET_TAB_STATE",
    tabId,
  });
}

async function refresh() {
  const tab = await getCurrentTab();
  const siteText = document.getElementById("siteText");
  const siteToggle = document.getElementById("siteToggle");
  const globalToggle = document.getElementById("globalToggle");
  const status = document.getElementById("status");

  if (!tab) {
    siteText.textContent = "Unavailable on this page.";
    siteToggle.disabled = true;
    globalToggle.disabled = true;
    return;
  }

  const { globalDisabled, disabledSites } = await getSettings();
  const tabState = await getTabState(tab.id);

  const siteDisabled = Boolean(disabledSites[tab.hostname]);

  siteText.textContent = tab.hostname;
  siteToggle.checked = !siteDisabled;
  globalToggle.checked = !globalDisabled;

  if (globalDisabled) {
    status.textContent = "Disabled everywhere.";
  } else if (siteDisabled) {
    status.textContent = "Disabled on this site.";
  } else if (tabState?.count > 0) {
    status.textContent = "Chat bubble found and hidden on this site.";
  } else {
    status.textContent = "No lower-right chat bubble found on this site.";
  }
}

document
  .getElementById("siteToggle")
  .addEventListener("change", async (event) => {
    const tab = await getCurrentTab();
    if (!tab) return;

    const { disabledSites } = await getSettings();

    if (event.target.checked) {
      delete disabledSites[tab.hostname];
    } else {
      disabledSites[tab.hostname] = true;
    }

    await chrome.storage.sync.set({ disabledSites });
    await chrome.tabs.reload(tab.id);
    window.close();
  });

document
  .getElementById("globalToggle")
  .addEventListener("change", async (event) => {
    const tab = await getCurrentTab();
    const globalDisabled = !event.target.checked;

    await chrome.storage.sync.set({ globalDisabled });

    if (tab?.id) {
      await chrome.tabs.reload(tab.id);
    }

    window.close();
  });

refresh();
