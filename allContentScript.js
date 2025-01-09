const TXT_PREFIX = "TXT-";

console.log("msg from allContentScript*");
chrome.runtime.onMessage.addListener((msg, info, sendResponse) => {
  console.log("msg", msg, "info", info);
  if (msg.type === "SAVE_TO_RAVEN") {
    const comment = prompt("Please enter title for copied text");
    console.log("comment", msg.selectionText, comment);
    setValueToStorage;
  }
  sendResponse({ msg: "got it" });
});

const setValueToStorage = async (value, prefix, key) => {
  const fullKey = prefix + key;
  await chrome.storage.local.set({ [fullKey]: JSON.stringify(value) });
};
