const HOLDING_LIST_ID = "holding"; // storage内所持リストID
const BOOKMARK_LIST_ID = "bookmark"; // storage内お気に入り一覧ID

/**
 * ストレージから所持リストを取得する
 * 
 * 所持リストの形状
 * - id: 購入済み管理ID
 * - itemId: 商品ID
 * - title: 商品名
 * - purchaseDate: 購入日
 */
const getHoldingListFromStorage = async () => {
  const storage = await chrome.storage.local.get(HOLDING_LIST_ID);
  return storage[HOLDING_LIST_ID] || [];
}

/**
 * ストレージからお気に入り一覧を取得する
 * 
 * お気に入り一覧の形状
 * - itemId: 商品ID
 * - title: 商品名
 */
const getBookmarkListFromStorage = async () => {
  const storage = await chrome.storage.local.get(BOOKMARK_LIST_ID);
  return storage[BOOKMARK_LIST_ID] || [];
}

/**
 * お気に入り一覧描画
 */
const displayBookmarkList = async () => {
  const list = await getBookmarkListFromStorage();
  const listElem = document.getElementById("list");
  // 一覧表示を全削除
  while (listElem.firstChild) {
    listElem.removeChild(listElem.firstChild);
  }
  // ストレージの内容で一覧を表示
  list.forEach((item) => {
    const div = document.createElement("div");
    div.classList.add("list-item");

    const img = document.createElement("img");
    img.src = item.imgUrl;
    const a = document.createElement("a");
    a.href = `https://dlsoft.dmm.co.jp/detail/${item.itemId}/`;
    a.target = "_blank";
    a.ref = "noopener noreferrer";
    a.textContent = item.title;
    
    div.appendChild(img);
    div.appendChild(a);
    listElem.appendChild(div);
  });
}

document.getElementById("update-btn").addEventListener("click", displayBookmarkList);
displayBookmarkList();