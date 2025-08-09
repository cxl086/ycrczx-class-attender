chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'MUTE_ACTIVE_TAB') {
    if (sender.tab && sender.tab.id !== undefined) {
      chrome.tabs.update(sender.tab.id, { muted: true }, () => sendResponse({ ok: true }));
      return true; // async
    }
  }
  if (message?.type === 'OPEN_URL_IN_WINDOW') {
    const url = message.url;
    if (!url) return;
    chrome.windows.create({ url, focused: false }, (win) => {
      sendResponse({ ok: true, windowId: win?.id });
    });
    return true; // async
  }
});


