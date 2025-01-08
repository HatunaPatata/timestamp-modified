console.log("msg from allContentScript*");
chrome.runtime.onMessage.addListener((msg, info, sendResponse) => {
  console.log("msg", msg, "info", info);
  if (msg.type === "save-to-raven") {
    const comment = prompt("Please enter title for copied text");
  }
  sendResponse({ msg: "got it" });
});
