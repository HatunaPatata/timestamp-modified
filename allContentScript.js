// const serverUrl = "https://yt-timestamp.onrender.com";

const serverUrl = "https://yt-timestamp-py.onrender.com";
// const serverUrl = "http://localhost:3000";
const TXT_PREFIX = "TXT-";
const YT_PREFIX = "YT-";
console.log("msg from allContentScript*");
chrome.runtime.onMessage.addListener(async (msg, info, sendResponse) => {
  console.log("msg", msg, "info", info);

  sendResponse({});
  if (msg.type === "SAVE_TO_RAVEN") {
    const comment = prompt("Please enter title for copied text");
    console.log("comment", comment, msg.selectionText, comment);
    // if (!comment) {
    //   return;
    // }
    const data = getPageData();

    setValueToStorage(
      {
        text: msg.selectionText,
        comment,
        favIcon: data.favIcon,
        title: data.title,
        url: data.url,
      },
      TXT_PREFIX,
      comment
    );
    sendText({ comment, text: msg.selectionText, ...data });
  } else if (msg.type === "DELETE") {
    console.log("deleting", msg);
    const isTxt = msg.id.startsWith(TXT_PREFIX);
    const result = await getValueFromStorage();
    let id;
    if (isTxt) {
      id = msg.id.slice(TXT_PREFIX.length);
      chrome.storage.local.remove(msg.key);
      // setValueToStorage(result, TXT_PREFIX, msg.id);
    } else {
      id = msg.id.slice(YT_PREFIX.length);
      const data = JSON.parse(result[msg.key]);
      let bookmarks = data.bookmarks || [];
      bookmarks = bookmarks.filter((bookmark) => {
        return msg.key + bookmark.time.toString() !== msg.id;
      });

      setValueToStorage({ ...data, bookmarks }, "", msg.key);
    }
    deleteBookmark({ type: isTxt ? "TXT" : "YT", id });
  }
  // sendResponse({ a: "b" });
});

const sleep = (time) => new Promise((res) => setTimeout(res, time));

const anotheAsyncFunc = async () => {
  chrome.storage.local.set({ c: "D" });
  console.log("invoked async");
};

const setValueToStorage = async (value, prefix, key) => {
  const fullKey = prefix + key;

  return await chrome.storage.local.set({ [fullKey]: JSON.stringify(value) });
};

const getValueFromStorage = async () => {
  const result = await chrome.storage.local.get();
  return result || null;
};

//TODO: share all utils between scripts

async function sendText(data) {
  console.log("sendText data", data);
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

function getPageData() {
  const title = document.title;
  const url = location.href;
  const metaTags = document.querySelectorAll("meta");
  const meta = Array.from(metaTags)
    .map((tag) => tag.outerHTML)
    .join("\r\n");
  const favIconLink =
    document.querySelector('link[rel="icon"') ||
    document.querySelector('link[rel="shortcut icon"');
  let favIcon = favIconLink ? favIconLink.href : location.host + "/favicon.ico";
  return { favIcon, title, url, meta };
}

async function deleteBookmark({ type, id }) {
  console.log(
    "deleteing bookmark",
    type,
    id,
    `${serverUrl}/app/${type.toLowerCase()}/${encodeURIComponent(id)}`
  );
  try {
    const res = await fetch(
      `${serverUrl}/app/${type.toLowerCase()}/${encodeURIComponent(id)}`,
      {
        mode:"no-cors",
        method: "delete",
        headers: { "content-type": "application/json" },
      }
    );
    await res.json();
    console.log("deleted data");
  } catch (err) {
    console.log("error in deleteBookmark", err);
  }
}
