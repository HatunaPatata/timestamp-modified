// const url = "https://yt-timestamp.onrender.com";
const url = "http://localhost:10000";
export const getCurrentActiveTab = async () => {
  let queryOptions = { active: true, lastFocusedWindow: true };

  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};
const YT_PREFIX = "YT-";

export const getVideoId = (tab) => {
  const queryParameters = tab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);
  return urlParameters.get("v");
};

export const getValueFromStorage = async (key, defaultResponse) => {
  const fullKey = YT_PREFIX + key;
  const result = await chrome.storage.local.get([fullKey]);
  return result[fullKey] ? JSON.parse(result[key]) : defaultResponse;
};

export const setValueToStorage = async (value, key) => {
  const fullKey = YT_PREFIX + key;
  await chrome.storage.local.set({ [fullKey]: JSON.stringify(value) });
};
