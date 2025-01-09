const url = "https://yt-timestamp.onrender.com";
// const url = "http://localhost:10000";
const YT_PREFIX = "YT-";
export const getCurrentActiveTab = async () => {
  let queryOptions = { active: true, lastFocusedWindow: true };

  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

export const getVideoId = (tab) => {
  const queryParameters = tab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);
  return urlParameters.get("v");
};

export const getValueFromStorage = async (prefix,key, defaultResponse) => {
  const fullKey = prefix + key;
  const result = await chrome.storage.local.get([fullKey]);
  return result[fullKey] ? JSON.parse(result[fullKey]) : defaultResponse;
};

export const setValueToStorage = async (value,prefix, key) => {
  const fullKey = prefix + key;
  await chrome.storage.local.set({ [fullKey]: JSON.stringify(value) });
};
