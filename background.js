// background.js (v1.4)

// 拡張機能がインストールされたときに、右クリックメニューを作成する
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "erabee-main",
    title: "エラビーで操作（そうさ）する",
    contexts: ["page", "selection"]
  });
});

// 共通のスクリプト実行関数
function executeErabeeScript(tab) {
    if (!tab || !tab.id) return;

    // 保護されたページでは実行しない
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('https://chrome.google.com/webstore'))) {
        console.log('保護されたページではエラビーを起動できません。');
        return;
    }

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    });
}

// 1. 右クリックメニューがクリックされたときの処理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "erabee-main") {
    executeErabeeScript(tab);
  }
});

// 2. ツールバーのアイコンがクリックされたときの処理
chrome.action.onClicked.addListener((tab) => {
    executeErabeeScript(tab);
});
