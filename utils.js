// const url = "https://yt-timestamp.onrender.com";
const url = "http://localhost:10000";
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

export const getValueFromStorage = async (key, defaultResponse) => {
  const result = await chrome.storage.local.get([key]);
  return result[key] ? JSON.parse(result[key]) : defaultResponse;
};

export const setValueToStorage = async (value, key) => {
  await chrome.storage.local.set({ [key]: JSON.stringify(value) });
};
