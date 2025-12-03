// popup.js

// 状態表示用のヘルパー
function setStatus(text) {
  const statusEl = document.getElementById("status");
  statusEl.textContent = text;
}

// 「このページのURLを保存」ボタン
document.getElementById("saveUrlBtn").addEventListener("click", () => {
  // アクティブなタブを取得
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      setStatus("タブが取得できませんでした。");
      return;
    }

    const tab = tabs[0];
    const url = tab.url;
    const title = tab.title || "";

    // もし note.com のみ保存したい場合はここでフィルタ
    try {
      const u = new URL(url);
      if (!u.hostname.includes("note.com")) {
        setStatus("note.com のページではありません。保存しませんでした。");
        return;
      }
    } catch (e) {
      setStatus("URL が不正です。");
      return;
    }

    const record = {
      url: url,
      title: title,
      addedAt: new Date().toISOString()
    };

    // 既存の savedUrls を取得して追加
    chrome.storage.local.get({ savedUrls: [] }, (data) => {
      const saved = data.savedUrls;

      // 同じURLの重複保存を避けたい場合
      const already = saved.find((item) => item.url === url);
      if (already) {
        setStatus("すでに保存済みのURLです。");
        return;
      }

      saved.push(record);
      chrome.storage.local.set({ savedUrls: saved }, () => {
        setStatus("保存しました:\n" + url);
      });
    });
  });
});

// 「JSONをダウンロード」ボタン
document.getElementById("exportJsonBtn").addEventListener("click", () => {
  chrome.storage.local.get({ savedUrls: [] }, (data) => {
    const saved = data.savedUrls;

    if (!saved || saved.length === 0) {
      setStatus("保存されたURLがありません。");
      return;
    }

    // JSON文字列に変換
    const jsonStr = JSON.stringify(saved, null, 2);

    // Blob を生成してダウンロードリンクを作成
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "note_urls.json";
    // popup内で疑似クリック
    a.click();

    // URLを解放
    URL.revokeObjectURL(url);

    setStatus("note_urls.json をダウンロードしました。");
  });
});
