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
 * ストレージにリストを登録する
 * 
 * @param {array} newList リスト
 */
const setListToStorage = async (newList) => {
  const savedata = {};
  savedata[HOLDING_LIST_ID] = newList;
  savedata[BOOKMARK_LIST_ID] = await getBookmarkListFromStorage();
  await chrome.storage.local.set(savedata);
}

/**
 * CSVファイル読み込み
 */
const loadCsv = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const { result } = reader;
      resolve(result);
    });

    reader.addEventListener("error", () => {
      reject(reader.error);
    });

    reader.readAsText(file);
  });
}

/**
 * リスト取得
 */
const displayHoldingList = async () => {
  const list = await getHoldingListFromStorage();
  const table = document.getElementById("list");
  // 総件数表示
  const span = document.getElementById("list-count");
  span.textContent = `${list.length}件`;
  // テーブルから全データを削除
  while (table.firstChild) {
    table.removeChild(table.firstChild);
  }
  // テーブルにストレージの内容を追加
  list.forEach((item) => {
    const tr = document.createElement("tr");

    const deleteTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "x";
    deleteBtn.addEventListener("click", async () => await deleteItem(item.itemId));
    deleteTd.appendChild(deleteBtn);

    const titleTd = document.createElement("td");
    const dateTd = document.createElement("td");
    titleTd.textContent = item.title;
    dateTd.textContent = item.purchaseDate;

    tr.appendChild(deleteTd);
    tr.appendChild(titleTd);
    tr.appendChild(dateTd);
    table.appendChild(tr);
  });
}

/**
 * リスト全削除
 */
const clearStorage = () => {
  if (!confirm("全削除？")) return;
  chrome.storage.local.clear(() => displayHoldingList());
}

/**
 * データ削除
 * 
 * @param {string} itemId 商品ID
 */
const deleteItem = async (itemId) => {
  if (!confirm(`${itemId}を削除？`)) return;

  const list = await getHoldingListFromStorage();
  const newList = list.filter((item) => item.itemId !== itemId);
  await setListToStorage(newList);
  displayHoldingList();
}

/**
 * データ追加
 * 
 * @param {array} list リスト
 * @param {string} itemId 商品ID
 * @param {string} title タイトル
 * @param {string} purchaseDate 購入日
 * @returns {array} 新リスト
 */
const addItem = (list, itemId, title, purchaseDate) => {
  // バリデーション
  if (itemId === "" || title === "" || purchaseDate === "") {
    return [];
  }
  // すでに追加されているか確認
  if (list.find((item) => item.itemId === itemId)) {
    return [];
  }
  // スラッシュ区切りの日付を年月日に変換
  let newPurchaseDate = purchaseDate;
  if (purchaseDate.includes("/")) {
    newPurchaseDate = purchaseDate.replace("/", "年");
    newPurchaseDate = newPurchaseDate.replace("/", "月");
    newPurchaseDate += "日";
  }
  // 登録
  list.push({
    id: `addbyown_${itemId}`,
    itemId,
    title,
    purchaseDate: newPurchaseDate
  });
  return list;
}

/**
 * 単一追加
 */
const addSingleItem = async () => {
  const list = await getHoldingListFromStorage();
  const itemIdElem = document.getElementById("item-id");
  const titleElem = document.getElementById("title");
  const purchaseDateElem = document.getElementById("purchase-date");

  const result = addItem(list, itemIdElem.value, titleElem.value, purchaseDateElem.value);
  if (result.length === 0) {
    alert("登録失敗");
    return;
  }

  await setListToStorage(result);
  displayHoldingList();
  itemIdElem.value = "";
  titleElem.value = "";
  purchaseDateElem.value = "";
  alert("追加完了");
}

/**
 * CSVによる複数追加
 */
const addItemByCsv = async () => {
  let list = await getHoldingListFromStorage();
  const csvFile = document.getElementById("csv-file").files[0];
  if (!csvFile) {
    alert("CSVファイルを指定してください");
    return;
  }

  // CSVファイルの読み込み
  const csv = await loadCsv(csvFile);
  const addList = csv.split("\n");
  // ヘッダー行ありの場合は削除
  const hasHeader = document.getElementById("has-header")?.checked;
  if (hasHeader) addList.shift();
  // 登録
  let count = 0;
  addList.forEach((line) => {
    const items = line.trim().replaceAll("\"", "").split(",");
    if (items.length < 3) return;
    const newList = addItem(list, items[0], items[1], items[2]);
    if (newList.length !== 0) {
      list = newList;
      count = count + 1;
    } else {
      console.log("[登録失敗]", items[1]);
    }
  });

  await setListToStorage(list);
  displayHoldingList();
  document.getElementById("csv-file").value = null;
  alert(`${count}件の追加完了`);
}

document.getElementById("clear-btn").addEventListener("click", clearStorage);
document.getElementById("add-btn").addEventListener("click", async () => await addSingleItem());
document.getElementById("csv-add-btn").addEventListener("click", async () => await addItemByCsv());
displayHoldingList();