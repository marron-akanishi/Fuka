const HOLDING_LIST_ID = "holding"; // storage内所持リストID
const BOOKMARK_LIST_ID = "bookmark"; // storage内お気に入り一覧ID
const UPDATE_BTN_ID = "fuka-update"; // 画面内storage更新ボタンID

window.onload = () => {
  const nowPath = location.pathname.split('/')[1].split('?')[0];
  displayPurchasedCount();
  switch (nowPath) {
    case "library":
      setListUpdateButtonForLibrary();
      displayInListIconForLibrary();
      break;
    case "bookmark":
      setListUpdateButtonForBookmark();
      setInListColor();
      break;
    case "detail":
      checkPurchased();
      break;
    case "list":
      checkPurchasedInList();
      break;
    case "search":
      checkPurchasedInSearch();
      break;
    case "ranking":
      checkPurchasedInRanking();
      break;
    case "basket":
      if (location.pathname.split('/')[2] !== "select_items") break;
      checkPurchasedInSelectItems();
      break;
  }
}

/**
 * サイドバーの購入済みに個数を表示する
 */
const displayPurchasedCount = async () => {
  const target = document.querySelector("a[data-js-pj-ga4-click-action='move_mylibrary@left_navi:myliblary_area']");
  if (!target) return;

  const list = await getHoldingListFromStorage();
  const span = document.createElement("span");
  span.classList.add("component-commonMenu__buttonCount");
  span.innerHTML = `<span>${list.length}</span>`;
  target.appendChild(span);
}

/**
 * 購入済み一覧に所持リスト更新ボタン設置
 */
const setListUpdateButtonForLibrary = () => {
  const div = document.createElement("div");
  div.classList.add("filterPanel__section");

  const btn = document.createElement("button");
  btn.classList.add("button", "button--secondary", "button--small", "filterPanel__clearButton");
  btn.id = UPDATE_BTN_ID;
  btn.type = "button";
  btn.innerText = "所持リスト更新";
  btn.addEventListener("click", updateHoldingList);
  div.appendChild(btn);

  const target = document.querySelector("div.searchContainer__filterPanel > div.filterPanel");
  target.prepend(div);
}

/**
 * 所持リストに登録済みかを判定し、アイコンを表示
 */
const displayInListIconForLibrary = async () => {
  const list = await getHoldingListFromStorage();
  const observer = new MutationObserver(() => {
    addInListIcon(list);
  });

  const listElem = document.querySelector("div.productList__grid");
  observer.observe(listElem, {
    childList: true
  });

  // 初回表示分
  addInListIcon(list);
}

/**
 * 購入済み一覧内のリストにチェックマークを付ける
 */
const addInListIcon = (list) => {
  const items = getLibraryList();
  items.forEach((elem) => {
    const id = getItemId(elem);
    if (list.some((item) => item.itemId === id)) {
      // すでにアイコンがついている場合はスキップ
      if (elem.querySelector(`div.fuka__done`)) return;

      const icon = document.createElement("div");
      icon.classList.add("fuka__done");
      elem.style.position = "relative";
      elem.prepend(icon);
    }
  });
}

/**
 * 購入済み一覧更新ボタン押下時
 */
const updateHoldingList = async () => {
  disableUpdateButton(true);

  const list = await getHoldingListFromStorage();
  const promises = [];
  const items = getLibraryList();
  items.forEach((elem) => {
    const checkFunction = async (list, elem) => {
      const id = getItemId(elem);
      // すでに所持リストに入っているものはスキップ
      if (list.some((item) => item.itemId === id)) return;

      const { title, purchaseDate } = await getItemDetail(id);
      list.push({ id, itemId: id, title, purchaseDate });
    };

    promises.push(checkFunction(list, elem));
  });
  await Promise.all(promises);

  const savedata = {};
  savedata[HOLDING_LIST_ID] = list;
  savedata[BOOKMARK_LIST_ID] = await getBookmarkListFromStorage();
  chrome.storage.local.set(savedata, async function () {
    const list = await getHoldingListFromStorage();
    addInListIcon(list);
  });

  disableUpdateButton(false);
}

/**
 * 購入済み一覧内の商品リストを取得する
 */
const getLibraryList = () => {
  return document.querySelectorAll("div.productList__grid > div");
}

/**
 * 商品IDを取得する
 */
const getItemId = (elem) => {
  const reviewLink = elem.querySelector("div.productCard__imageContainer > img").src;
  return reviewLink.split('/pcgame')[1].split('/')[1];
}

/**
 * 更新ボタンの活性状態を切り替える
 */
const disableUpdateButton = (isDisabled) => {
  const btn = document.getElementById(UPDATE_BTN_ID);
  if (!btn) return;

  if (isDisabled) {
    btn.innerText = "更新中";
    btn.disabled = true;
  } else {
    btn.innerText = "所持リスト更新";
    btn.disabled = false;
  }
}

/**
 * 商品のタイトルと購入日を取得する
 */
const getItemDetail = async (id) => {
  const resp = await fetch(`https://dlsoft.dmm.co.jp/ajax/v1/library/detail/single/?productId=${id}`);
  const json = await resp.json();

  return {
    title: json.body.productDetail.product.title,
    purchaseDate: json.body.order.orderDate.split(' ')[0],
  }
}

/**
 * お気に入りリストにお気に入り一覧更新ボタンを追加
 */
const setListUpdateButtonForBookmark = () => {
  const span = document.createElement("span");
  span.classList.add("d-btn");
  span.style.top = 0;

  const btn = document.createElement("button");
  btn.id = UPDATE_BTN_ID;
  btn.type = "button";
  btn.textContent = "お気に入り一覧更新";
  btn.addEventListener("click", updateBookmarkList);
  span.appendChild(btn);

  const target = document.querySelector("div.d-boxcaptside.d-boxseparate");
  target.prepend(span);
}

/**
 * お気に入り一覧に登録済みかを判定し、チェックボックス部分の背景色を変更
 */
const setInListColor = async () => {
  const list = await getBookmarkListFromStorage();

  list.forEach((item) => {
    const checkbox = document.querySelector(`input[type='checkbox'][name='item_info[]'][value^='${item.itemId}']`);
    if (checkbox) checkbox.parentElement.classList.add('fuka__in-list');
  });
}

/**
 * お気に入りリスト更新ボタン押下時
 */
const updateBookmarkList = async () => {
  disableUpdateButton(true);

  const savedata = {};
  savedata[HOLDING_LIST_ID] = await getHoldingListFromStorage();
  savedata[BOOKMARK_LIST_ID] = getBookmarkList();
  chrome.storage.local.set(savedata, function () {
    setInListColor();
  });

  disableUpdateButton(false);
}

/**
 * お気に入りリスト内の商品を取得する
 * 返却する内容は商品ID、タイトル、画像URL
 */
const getBookmarkList = () => {
  const list = document.querySelectorAll("ul#list > li");

  const items = [];
  list.forEach((item) => {
    const tmb = item.querySelector("p.tmb");
    const itemId = tmb.querySelector("a").href.split('/').reverse()[1];
    const img = tmb.querySelector("img");
    const title = img.alt;
    const imgUrl = img.src;

    items.push({ itemId, title, imgUrl });
  });

  return items;
}

/**
 * 商品詳細ページで所持済みかを表示
 * 
 * FANZA側で購入済み表示になるものは無視する（そもそも購入用のformが存在しないため、IDが取得出来ない）
 */
const checkPurchased = async () => {
  const form = document.querySelector("form.basket__button--purchase");
  const id = form?.querySelector("input[name='id']")?.value;
  if (!id) return;
  const list = await getHoldingListFromStorage();
  const item = list.find((item) => id.startsWith(item.itemId));

  if (item) {
    /* 旧デザイン（スクロール時に右下に表示される購入ボタン） */
    const formAll = document.querySelectorAll("form.detail-purchase-btn");
    formAll.forEach((elem) => {
      elem.style.opacity = 1;
      const btn = elem.querySelector("input[type='submit']");
      if (!btn) return;
      if (btn.parentElement.classList.contains("d-btn-hi-st-bskt")) {
        btn.parentElement.classList.add("is-disabled");
        btn.parentElement.innerHTML = "購入済み";
      } else {
        btn.style.cursor = "default";
        btn.disabled = true;
        btn.style.background = "linear-gradient(0deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4)), #FF8120";
        btn.value = "購入済み";
      }
    });

    /* 新デザイン */
    const newFormAll = document.querySelectorAll("form.basket__button--purchase");
    newFormAll.forEach((elem) => {
      elem.parentElement.classList.add("fuka__detail_remove-hover");
      elem.classList.add("fuka__detail_remove-hover");
      const btn = elem.querySelector("input[type='submit']");
      if (!btn) return;
      btn.remove();
      const purchasedBtn = document.createElement("div");
      purchasedBtn.innerHTML = "購入済み";
      purchasedBtn.classList.add("basket__purchased");
      elem.appendChild(purchasedBtn);

      /* バスケットに入れるボタン（非表示化） */
      const busketBtn = elem.parentElement.nextElementSibling;
      busketBtn?.remove();
    });
  }
}

/**
 * 商品一覧画面で所持済みかを表示
 */
const checkPurchasedInList = async () => {
  const items = document.querySelectorAll("ul.productList > li.productListItem");
  const list = await getHoldingListFromStorage();

  items.forEach((elem) => {
    const btn = elem.querySelector("button[type='submit']");
    if (!btn) return;
    const itemId = btn.dataset.jsPjAddBasketProductId;
    const item = list.find((item) => itemId.startsWith(item.itemId));
    if (!item) return;

    btn.classList.add("fuka__list_purchased-btn");
    btn.disabled = true;
    btn.querySelector("span.component-textButton__text").textContent = "購入済み";
  });
}

/**
 * 検索一覧画面で所持済みかを表示
 */
const checkPurchasedInSearch = async () => {
  const items = document.querySelectorAll("ul.component-legacy-productTile > li");
  const list = await getHoldingListFromStorage();

  items.forEach((elem) => {
    const submitBtn = elem.querySelector("button.component-legacy-productTile__btnBasket");
    if (!submitBtn) return;
    const itemId = submitBtn.dataset.jsPjAddBasketProductId;
    if (!itemId) return;
    const item = list.find((item) => itemId.startsWith(item.itemId));
    if (!item) return;

    const btn = elem.querySelector("span.component-legacy-productTile__btnBasketInner");
    btn.classList.add("fuka__remove-before");
    btn.parentElement.classList.add("fuka__purchased-btn");
    btn.parentElement.disabled = true;
    btn.parentElement.style.top = 0;
    btn.parentElement.style.cursor = 'default';
    btn.innerHTML = "<span style='width: 100%'>購入済み</span>";
  });
}

/**
 * ランキング画面で所持済みかを表示
 */
const checkPurchasedInRanking = async () => {
  const items = document.querySelectorAll("ul.rankingList-content > li");
  const list = await getHoldingListFromStorage();

  items.forEach((elem) => {
    const form = elem.querySelector("form[action='https://dlsoft.dmm.co.jp/basket/add/']");
    if (!form) return;
    const div = form.querySelector("div.primary-btn");
    const itemId = div.querySelector("input[name='productId']").value;
    const item = list.find((item) => itemId.startsWith(item.itemId));
    if (!item) return;

    div.classList.add("fuka__remove-before");
    div.classList.add("fuka__purchased-btn");
    div.style.top = 0;
    div.style.padding = "0 6px";
    const btn = div.querySelector("input[type='submit']");
    btn.style.padding = 0;
    btn.disabled = true;
    btn.style.cursor = "default";
    btn.value = "購入済み";
  });
}

/**
 * まとめ買い選択画面で所有済みかを表示
 * 
 * CSSクラス名が自動生成で仮想スクロール導入されてるのがとても面倒
 */
const checkPurchasedInSelectItems = async () => {
  const DISABLE_CLASS_NAME = "fuka__select-item_disabled-btn";
  let enableClassList = [];

  const list = await getHoldingListFromStorage();
  const observer = new MutationObserver(() => {
    const items = document.querySelectorAll("#root ul li");
    items.forEach((elem) => {
      const itemId = elem.querySelector("input[type='hidden']")?.id;
      if (!itemId) return;
      const item = list.find((item) => itemId.startsWith(item.itemId));
      if (!item) {
        const btn = elem.querySelector("button");
        // 有効ボタンのスタイルを取得しておく
        if (enableClassList.length === 0 && !btn.disabled) {
          // 念の為、無効スタイルは含まれないようにする
          enableClassList = Array.from(btn.classList).filter((className) => className !== DISABLE_CLASS_NAME);
        }
        // FANZA側で無効になっているボタンはそのままにする
        if (!btn.classList.contains(DISABLE_CLASS_NAME)) {
          // 念の為有効スタイルで上書きしておく
          if (!btn.disabled) btn.classList.add(...enableClassList);
          return;
        }
        // 一度無効になったボタンが有効に戻らないため、スタイルを復元する
        btn.classList.remove(DISABLE_CLASS_NAME);
        btn.classList.add(...enableClassList);
        btn.disabled = false;
        btn.textContent = "選択する";
        return;
      }

      const btn = elem.querySelector("button");
      if (btn.disabled) return;
      btn.classList.remove(...btn.classList);
      btn.classList.add(DISABLE_CLASS_NAME);
      btn.disabled = true;
      btn.textContent = "購入済み";
    });
  });

  const listElem = document.querySelector("#root");
  observer.observe(listElem, {
    childList: true,
    subtree: true
  });
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
 * - imgUrl: サムネイル画像URL
 */
const getBookmarkListFromStorage = async () => {
  const storage = await chrome.storage.local.get(BOOKMARK_LIST_ID);
  return storage[BOOKMARK_LIST_ID] || [];
}