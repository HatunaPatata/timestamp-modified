import { getValueFromStorage, getVideoId, setValueToStorage } from "./utils.js";
const YT_PREFIX = "YT-";

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("youtube.com/watch")
  ) {
    const videoId = getVideoId(tab);
    try {
      const result = await getValueFromStorage(YT_PREFIX, videoId, null);

      if (!result || result.isTitlePause == null) {
        setValueToStorage({ ...result, isTitlePause: false }, videoId);
      }

      chrome.tabs.sendMessage(tabId, {
        type: "NEW",
        videoId: videoId,
        settings: {
          isTitlePause: result ? result.isTitlePause : false,
        },
      });
    } catch (error) {
      // An error occurred
      console.error(error.message);
    }
  }
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName === "sync" && !!changes) {
    // Send a message to the options page
    chrome.runtime.sendMessage({ type: "refreshOptionsPage" });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveToRaven",
    title: "Save to Raven",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("info", info);
  console.log("tab", tab);
  switch (info.menuItemId) {
    case "saveToRaven":
      const res = await chrome.tabs.sendMessage(tab.id, {
        type: "SAVE_TO_RAVEN",
        selectionText: info.selectionText,
      });
      console.log("got res", res);
  }
});

//TODO: add icon credit <a target="_blank" href="https://icons8.com/icon/yFBJCjFJpLXw/save">Save</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
