const serverUrl = "https://yt-timestamp.onrender.com";

// const serverUrl = "http://localhost:10000";
const TXT_PREFIX = "TXT-";

console.log("msg from allContentScript*");
chrome.runtime.onMessage.addListener((msg, info, sendResponse) => {
  console.log("msg", msg, "info", info);
  if (msg.type === "SAVE_TO_RAVEN") {
    const comment = prompt("Please enter title for copied text");
    console.log("comment", msg.selectionText, comment);
    setValueToStorage(msg.selectionText,TXT_PREFIX,msg.comment);
     sendText({comment,text:msg.selectionText})
  }
  sendResponse({ msg: "got it" });
});

const setValueToStorage = async (value, prefix, key) => {
  const fullKey = prefix + key;
  await chrome.storage.local.set({ [fullKey]: JSON.stringify(value) });

};

//TODO: share all utils between scripts

async function sendText(data) {
  const title=document.title
  const url=location.href
  const metaTags=document.querySelectorAll('meta')
  const meta=Array.from(metaTags).map(tag=>tag.outerHTML).join("\r\n")
  const favIconLink=document.querySelector('link[rel="icon"')||document.querySelector('link[rel="shortcut icon"')
  let favIcon=favIconLink?favIconLink.href:location.host+'/favicon.ico'
  Object.assign(data,{favIcon,title,url,meta})
  console.log('sendText data',data)
  try {
  const res = await fetch(`${serverUrl}/app/hook/txt`, {
    method: "post",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  await res.json();
  console.log("sent data");
} catch (err) {
  console.log("error in sendText", err);
}
}