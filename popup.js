import {
  getAllValuesFromStorage,
  getCurrentActiveTab,
  getValueFromStorage,
  getVideoId,
  setValueToStorage,
} from "./utils.js";
let checkbox;
const YT_PREFIX = "YT-";
const TXT_PREFIX = "TXT-";
let data = {};
// adding a new bookmark row to the popup
const addNewBookmark = (bookmarkElement, bookmark) => {
  const title = document.createElement("div");
  const newElement = document.createElement("div");
  const controlElement = document.createElement("div");
  const bookmarkType = bookmark.type;
  // console.log("addnewBookmark", bookmark);
  // title.textContent = bookmarkType==="TXT"?bookmark.text:bookmark.desc;

  title.innerHTML = `
  <div style="display:flex; align-items:center;cursor:pointer;">
  <img style="height:32px; width:auto; margin-right:5px;" src="assets/${
    bookmarkType === "YT" ? "yt.svg" : "globe.svg"
  }"/>
  <div>
  <div style="display:flex; flex-direction:column;">
<span style="font-weight:600;">${bookmark.title}</span>
<span>${
    bookmark.text || formatTime(bookmark.time.toString()) + " " + bookmark.desc
  }</span>
  </div>
  </div>
  </div>
  `;
  title.className = "bookmark-title";
  title.title = bookmarkType === "TXT" ? bookmark.comment : bookmark.desc;
  // console.log("title", title);
  // const timestamp =
  //   "bookmark-" +
  //   bookmarkType +
  //   "-" +
  //   (bookmarkType === "TXT"
  //     ? bookmark.comment + "-" + bookmark.text
  //     : bookmark.time.toString() + bookmark.desc);
  controlElement.className = "bookmark-controls";
  // newElement.id = timestamp;
  newElement.className = "bookmark";
  if (bookmarkType === "YT") {
    newElement.setAttribute(
      "timestamp",
      "bookmark-YT-" + bookmark.time.toString() + bookmark.desc
    );
    newElement.setAttribute("time", bookmark.time);
    newElement.setAttribute("id", bookmark.id + bookmark.time);
  } else {
    // newElement.innerHTML = `<a href="${bookmark.url}>${newElement.innerHTML}</a>"`;
    newElement.setAttribute("url", bookmark.url);
    newElement.setAttribute("text", bookmark.text);
    newElement.setAttribute("id", bookmark.id + bookmark.url);
  }
  newElement.setAttribute("key", bookmark.id);
  setBookmarkAttributes(controlElement, () => {}, "raven", ".svg");
  if (bookmarkType === "YT") {
    setBookmarkAttributes(controlElement, onPlay, "play");
  } else {
    setBookmarkAttributes(controlElement, goToText, "placeholder");
  }
  setBookmarkAttributes(controlElement, onDelete, "delete");

  newElement.appendChild(title);
  newElement.appendChild(controlElement);
  bookmarkElement.appendChild(newElement);
};

const viewBookmarks = (currentBookmarks = []) => {
  const bookmarkElement = document.getElementById("bookmarks");
  bookmarkElement.innerHTML = "";
  if (currentBookmarks.length > 0) {
    currentBookmarks.forEach((bookmark) => {
      // console.log(
      //   "before newBookmark",
      //   bookmark,
      //   "currentBookmarks",
      //   currentBookmarks
      // );
      addNewBookmark(bookmarkElement, bookmark);
    });
  } else {
    bookmarkElement.innerHTML = '<div class="row">No bookmarks</div>';
  }
};

const goToText = (e) => {
  const parentNode = e.target.parentNode.parentNode;
  const url = parentNode.getAttribute("url");
  const text = parentNode.getAttribute("text");
  const textFragment = encodeURI(`${url}#:~:text=${text}`);
  window.open(textFragment);
  // const link = document.createElement("a");
  // link.href = encodeURI(`${url}#:~:text=${text}`);
  // console.log("goToText", link.href);
  // parentNode.appendChild(link);
  // console.log("link", link);
  // link.click();
  // link.remove();
};

const onPlay = async (e) => {
  const parentNode = e.target.parentNode.parentNode;
  const bookmarkTime = parentNode.getAttribute("timestamp");
  const videoId = parentNode.getAttribute("videoId");
  const time = parentNode.getAttribute("time");
  const activeTab = await getCurrentActiveTab();
  console.log("activeTab", time, activeTab, activeTab.url, videoId);
  if (activeTab.url.includes(`youtube.com/watch?v=${videoId}`)) {
    chrome.tabs.sendMessage(activeTab.id, {
      type: "PLAY",
      value: time,
    });
  } else {
    window.open(
      `https://youtube.com/watch?v=${videoId}&t=${Math.floor(+time)}`
    );
  }
};

const onDelete = async (e) => {
  const parentNode = e.target.parentNode.parentNode;
  const bookmarkTime = parentNode.getAttribute("time");
  // const key = parentNode.getAttribute("id");
  const id = parentNode.getAttribute("id");
  const key = parentNode.getAttribute("key");
  console.log("befor remove", parentNode, "bookmarktime", bookmarkTime);
  console.log("befor id", id);
  // console.log("parentNode", parentNode, bookmarkTime);
  // console.log("bookmarkTime", bookmarkTime, parentNode.getAttribute("key"));
  // const activeTab = await getCurrentActiveTab();
  // const bookmarkElementToDelete = document.getElementById(bookmarkTime);
  // console.log("elementToDelete", parentNode);
  parentNode.remove();

  chrome.tabs.query({ url: ["http://*/**", "https://*/**"] }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, {
        type: "DELETE",
        id,
        key,
      });
    });
  });
};

const setBookmarkAttributes = (
  controlParentElement,
  eventListner,
  src,
  ext = ".png"
) => {
  const controlElement = document.createElement("img");
  controlElement.src = "assets/" + src + ext;
  controlElement.title = src;
  controlElement.style = "width:16px; height:16px";

  controlElement.addEventListener("click", eventListner);
  controlParentElement.appendChild(controlElement);
};

chrome.runtime.onMessage.addListener((msg, sender, res) => {
  console.log("storage change", msg);
  if (msg.type === "LOAD_BOOKMARKS") {
    loadBookmarks();
  }
  res({});
});

document.addEventListener("DOMContentLoaded", loadBookmarks);

const toggleCheckbox = async (data2, currentVideo) => {
  const checked = checkbox.getAttribute("data-on");
  const data = await getValueFromStorage(YT_PREFIX, currentVideo);
  console.log("checked", checked);
  if (checked === "off") {
    setValueToStorage({ ...data, isTitlePause: true }, YT_PREFIX, currentVideo);
    checkbox.setAttribute("data-on", "on");
    checkbox.src = "assets/play_on.svg";
  } else {
    setValueToStorage(
      { ...data, isTitlePause: false },
      YT_PREFIX,
      currentVideo
    );
    checkbox.setAttribute("data-on", "off");
    checkbox.src = "assets/play_off.svg";
  }
  const activeTab = await getCurrentActiveTab();
  chrome.tabs.sendMessage(activeTab.id, {
    type: checked === "off" ? "RESUME" : "PAUSE",
  });
};

async function loadBookmarks() {
  const activeTab = await getCurrentActiveTab();
  const currentVideo = getVideoId(activeTab);
  const optionButton = document.getElementById("option");

  const filterOn = filterBtn.getAttribute("data-on");
  console.log("is filter on", filterOn);

  const isYT = currentVideo && activeTab.url.includes("youtube.com/watch");
  const allValues = await chrome.storage.local.get();
  console.log("allValues", allValues);
  const allBookmarks = [];

  for (const itemName in allValues) {
    // let bookmarks=[]
    // console.log("itemName", itemName, allValues[itemName]);
    const item = JSON.parse(allValues[itemName]);
    // console.log("item", item, "allValues", allValues[itemName]);
    // console.log("item!", item);
    // if(typeof  item['isTitlePause'!==undefined]){
    //   data=item
    //   console.log('did it!',item)
    //   continue;
    // }
    const bookmarkType = itemName.startsWith(YT_PREFIX) ? "YT" : "TXT";
    console.log("type", bookmarkType, itemName);
    if (bookmarkType === "YT" && item.bookmarks) {
      // bookmarks = item.bookmarks
      item.bookmarks.forEach((bookmark) => {
        bookmark.title = item.title;
        bookmark.type = bookmarkType;
        bookmark.id = itemName;
      });

      allBookmarks.push(...item.bookmarks);
    } else if (bookmarkType === "TXT") {
      // item.type=bookmarkType
      const txtBookmark = {
        id: itemName,
        type: bookmarkType,
        comment: itemName.slice(TXT_PREFIX.length),
        ...item,
      };
      allBookmarks.push(txtBookmark);
      console.log("pushed item");
    }
  }
  console.log(
    "allBookmarks",
    allBookmarks,
    filterOn,
    allBookmarks.filter((bookmark) => {
      const link = isYT
        ? `https://youtube.com/watch?v=${bookmark.id.slice(YT_PREFIX.length)}`
        : bookmark.url;
      console.log("first_link", link, bookmark.url);
      const url = new URL(link || "https://google.com");
      console.log(
        "link",
        url.host + url.pathname,
        activeTab.url.includes(url.host + url.pathname),
        link,
        bookmark.url,
        bookmark
      );

      return (
        filterOn !== "on" || activeTab.url.includes(url.host + url.pathname)
      );
    })
  );
  viewBookmarks(
    allBookmarks.filter((bookmark) => {
      const link = isYT
        ? `https://youtube.com/watch?v=${bookmark.id.slice(YT_PREFIX.length)}`
        : bookmark.url || "https://blahblahblah.com";

      const url = new URL(link);
      console.log("urlll", url.host + url.pathname + url.search);
      return (
        filterOn !== "on" ||
        activeTab.url.includes(
          isYT ? url.host + url.pathname + url.search : url.host
        )
      );
    })
  );

  // checkbox = document.querySelector('input[type="checkbox"]');
  // checkbox.checked = data?.isTitlePause ? data?.isTitlePause : false;
  // checkbox.addEventListener("change", () =>
  //   toggleCheckbox(data, currentVideo)
  // );

  optionButton.addEventListener("click", () => {
    chrome.runtime.openOptionsPage(() => {});
  });
}

checkbox = document.getElementById("switch-icon");
checkbox.addEventListener("click", async () => {
  console.log("clicked");
  const activeTab = await getCurrentActiveTab();
  console.log("activeTab", activeTab);
  const videoId = getVideoId(activeTab);
  console.log("videoId", videoId, activeTab);
  toggleCheckbox(data, videoId);
});

const filterBtn = document.getElementById("filter-icon");

filterBtn.addEventListener("click", async () => {
  const filterOn = filterBtn.getAttribute("data-on");
  filterBtn.setAttribute("data-on", filterOn === "on" ? "off" : "on");
  console.log("filter clicked", filterOn);
  filterBtn.src =
    filterOn === "off" ? "assets/filter_on.svg" : "assets/filter_off.svg";
  loadBookmarks();
});

const formatTime = (time) => {
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((time / 60) % 60)
    .toString()
    .padStart(2, "0");
  const hours = Math.floor(time / 60 / 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};
