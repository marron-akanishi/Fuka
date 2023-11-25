const FANZA_ORIGIN = "https://dlsoft.dmm.co.jp";

/**
 * アイコン押下時に設定画面を開く
 */
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

/**
 * FANZA PCゲームフロアでサイドパネルを有効にする
 */
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;

  const url = new URL(tab.url);
  if (url.origin === FANZA_ORIGIN) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: "sidepanel/sidepanel.html",
      enabled: true
    });
  } else {
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false
    });
  }
});