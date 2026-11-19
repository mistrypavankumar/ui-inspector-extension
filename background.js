// UI Inspector — background service worker
// Handles screenshot capture for the markup feature.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.action === 'capture-tab') {
    const tabId = sender.tab?.id;
    if (tabId == null) {
      sendResponse({ error: 'no-tab' });
      return false;
    }
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ dataUrl });
    });
    return true; // keep channel open for async response
  }
});
