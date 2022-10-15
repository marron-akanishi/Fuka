const clearStorage = () => {
  chrome.storage.local.clear();
  document.getElementById("list").innerHTML = "";
}

const getList = () => {
  chrome.storage.local.get("holding", (value) => {
    const list = value.holding || [];
    const table = document.getElementById("list");
    list.forEach((item) => {
      const tr = document.createElement("tr");
      const titleTd = document.createElement("td");
      const dateTd = document.createElement("td");
      titleTd.textContent = item.title;
      dateTd.textContent = item.purchaseDate;

      tr.appendChild(titleTd);
      tr.appendChild(dateTd);
      table.appendChild(tr);
    })
  })
}

document.getElementById("clear-btn").addEventListener("click", clearStorage);
getList();