const HOLDING_LIST_ID = "holding";
const UPDATE_BTN_ID = "fuka-update";

window.onload = () => {
  const nowPath = location.pathname.split('/')[1];
  switch(nowPath) { 
    case "mylibrary":
      console.log("購入済み一覧");
      setListUpdateButton();
      displayInListIcon();
      break;
    case "detail":
      console.log("詳細ページ");
      checkPurchased();
      break;
  }
}

/**
 * 購入済み一覧に所持リスト更新ボタン設置
 */
const setListUpdateButton = () => {
  const span = document.createElement("span");
  span.classList.add("ml-btn");
  span.style.top = 0;

  const btn = document.createElement("input");
  btn.id = UPDATE_BTN_ID;
  btn.type = "button";
  btn.value = "所持リスト更新";
  btn.addEventListener("click", updateHoldingList);
  span.appendChild(btn);

  const target = document.querySelector("form#search_form > div");
  target.prepend(span);
}

/**
 * 所持リストに登録済みかを判定し、アイコンを表示
 */
const displayInListIcon = async () => {
  const list = await getListFromStorage();

  const items = getMyLibraryList();
  items.forEach((item) => {
    const id = item.querySelector("div").id;
    if (list.some((item) => item.id === id)) {
      // すでにアイコンがついている場合はスキップ
      if (item.querySelector(`div.fuka__done`)) return;

      const icon = document.createElement("div");
      icon.classList.add("fuka__done");
      const target = item.querySelector("span.img");
      target.style.position = "relative";
      target.prepend(icon);
    }
  });
}

/**
 * 更新ボタン押下時
 */
const updateHoldingList = async () => {
  // ボタンを非表示にして更新表示にする
  const btn = document.getElementById(UPDATE_BTN_ID);
  btn.value = "更新中";
  btn.disabled = true;

  const list = await getListFromStorage();
  const items = getMyLibraryList();
  const promises = [];
  items.forEach((elem) => {
    const checkFunction = async (list, elem) => {
      const id = elem.querySelector("div").id;
      // すでに所持リストに入っているものはスキップ
      if (list.some((item) => item.id === id)) return;

      const img = elem.querySelector("img");
      const itemId = img.src.split('/').reverse()[0].replace("ps.jpg", "");
      const { title, purchaseDate } = await getItemDetail(id);
      list.push({id, itemId, title, purchaseDate});
    };

    promises.push(checkFunction(list, elem));
  });
  await Promise.all(promises);

  const savedata = {};
  savedata[HOLDING_LIST_ID] = list;
  chrome.storage.local.set(savedata, function () {
    displayInListIcon();
  });

  // ボタンを再表示
  btn.value = "所持リスト更新";
  btn.disabled = false;
}

/**
 * 購入日を取得する
 */
const getItemDetail = async (id) => {
  const resp = await fetch(`https://dlsoft.dmm.co.jp/mylibrary/detail/?item=${id}`);
  const html = await resp.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const cite = doc.querySelector("div.title > cite");
  const title = cite.querySelector("a") ? cite.querySelector("a").textContent : cite.textContent;
  const date = doc.querySelector("p.ml-item.date").textContent;

  return {
    title,
    purchaseDate: date.replace("購入日：", ""),
  }
}

/**
 * 購入済み一覧内のリストを取得する
 */
const getMyLibraryList = () => {
  return document.querySelectorAll("ul#js-list > li");
}

/**
 * 詳細ページで所持済みかを表示
 */
const checkPurchased = async () => {
  const form = document.querySelector("form.detail-purchase-btn");
  const id = form.querySelector("input[name='id']").value;
  const list = await getListFromStorage();
  const item = list.find((item) => item.itemId === id);

  if (item) {
    const btn = document.querySelectorAll("form.detail-purchase-btn input[type='submit']");
    btn.forEach((elem) => {
      elem.style.cursor = "default";
      elem.disabled = true;
      elem.value = `${item.purchaseDate}に購入済み`;
    });
  }
}

/**
 * ストレージから所持リストを取得する
 * 
 * 所持リストの形状
 * - id: 購入済み管理ID
 * - itemId: 商品ID
 * - title: 商品名
 * - purchaseDate: 購入日
 */
const getListFromStorage = async () => {
  const storage = await chrome.storage.local.get(HOLDING_LIST_ID);
  return storage[HOLDING_LIST_ID] || [];
}