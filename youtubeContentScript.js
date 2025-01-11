(() => {
  let youtubeRightControls, youtubePlayer, isTitlePause;
  let currentVideo = "",
    currentVideoBookmarks = [];
  const currentVideoData = {};
  let bookmarkTitle = "";
  const YT_PREFIX = "YT-";
  // const url = "http://localhost:10000";
  const url = "https://yt-timestamp.onrender.com";
  console.log("url", url);
  let timerId = 0;
  // listner for all emit messages
  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    // response(currentVideoBookmarks);
    (async () => {
      const { type, value, videoId, settings } = obj;

      if (type === "NEW") {
        currentVideo = videoId;
        isTitlePause = settings.isTitlePause;
        currentVideoData.id = videoId;
        // addSnippetToVideoData(currentVideoData);
        newVideoLoaded();
      } else if (type === "PLAY") {
        youtubePlayer.currentTime = value;
      } else if (type === "TOGGLE_PLAYER") {
        if (youtubePlayer.paused) {
          youtubePlayer.play();
        } else {
          youtubePlayer.pause();
        }
        response(youtubePlayer.paused);
      } else if (type === "PAUSE") {
        youtubePlayer.pause();
        // } else if (type === "DELETE") {
        //   currentVideoBookmarks = currentVideoBookmarks.filter((bookmark) => {
        //     console.log("filter bookmark", bookmark);
        //     const isYT = bookmark.id.startsWith(YT_PREFIX);
        //     const bookmarkId = isYT
        //       ? bookmark.id + bookmark.time.toString()
        //       : bookmark.comment + bookmark.url;
        //     return id === bookmarkId;
        //     // bookmark.time != value
        //   });

        setValueToStorage(
          { ...currentVideoData, bookmarks: currentVideoBookmarks },
          YT_PREFIX,
          currentVideo
        );
      }
      response({});
    })();
    return true;
  });

  // reusable methods
  const getValueFromStorage = async (prefix, key, defaultResponse) => {
    const fullKey = prefix + key;
    const result = await chrome.storage.local.get([fullKey]);
    return result[fullKey] ? JSON.parse(result[fullKey]) : defaultResponse;
  };

  const setValueToStorage = async (value, prefix, key) => {
    const fullKey = prefix + key;
    await chrome.storage.local.set({ [fullKey]: JSON.stringify(value) });
  };

  // Methods
  const fetchCurrentVideoData = async () => {
    try {
      const data = await getValueFromStorage(YT_PREFIX, currentVideo, {});
      currentVideoData["bookmarks"] = data.bookmarks;
      currentVideoData["isTitlePause"] = data.isTitlePause;

      return data;
    } catch (error) {
      console.log("context validate", error.message);
      sendReloadSignal();
    }
  };

  const newVideoLoaded = async () => {
    const bookmarkBtnExists =
      document.getElementsByClassName("bookmark-btn")[0];
    const data = await fetchCurrentVideoData();
    currentVideoBookmarks = data.bookmarks ? data.bookmarks : [];
    if (!bookmarkBtnExists) {
      const bookmarkBtn = document.createElement("img");
      const iconWrapper = document.createElement("span");
      const bookmarkContainer = document.createElement("span");

      bookmarkContainer.className = "ytp-button";
      iconWrapper.className = "icon-wrapper";

      bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
      bookmarkBtn.className = "ytp-button " + "bookmark-btn";
      bookmarkBtn.title = "Click to bookmark";

      youtubeRightControls =
        document.getElementsByClassName("ytp-right-controls")[0];
      youtubePlayer = document.querySelector("video");

      iconWrapper.appendChild(bookmarkBtn);
      bookmarkContainer.appendChild(iconWrapper);
      console.log("right controls", youtubeRightControls);
      youtubeRightControls.insertBefore(
        bookmarkContainer,
        youtubeRightControls.firstChild
      );
      bookmarkContainer;
      bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
    }
  };

  const getTime = (t) => {
    const date = new Date(0);
    date.setSeconds(t);

    return date.toISOString().slice(11, 19);
  };

  const addNewBookmarkEventHandler = async () => {
    // fetch latest bookmarks
    try {
      const data = await fetchCurrentVideoData();
      isTitlePause = data.isTitlePause;
      getCurrentVideoDetail();

      isTitlePause ? addBookmark() : openModal();
    } catch (error) {
      console.log("addbookmark error", error.message);
      sendReloadSignal();
    }
  };

  const addBookmark = async () => {
    if (isTitlePause) {
      const bookmarkBtn = document.getElementsByClassName("bookmark-btn")[0];
      const saveBtnSrc = chrome.runtime.getURL("assets/bookmark.gif");
      const addbookmarkBtnSrc = chrome.runtime.getURL("assets/bookmark.png");

      bookmarkBtn.src = saveBtnSrc;
      setTimeout(() => {
        bookmarkBtn.src = addbookmarkBtnSrc;
      }, 1000);
    }

    // const title=document.getElementById('above-the-fold').querySelector('yt-formatted-string').textContent
    // // const channelName=document.getElementById('text').querySelector('a').getAttribute('href')
    // const channelName=document.getElementById('channel-name').querySelector('a').getAttribute('href')
    //   const url=location.href
    //   const details=document.getElementById('expander').querySelector('yt-attributed-string span').textContent
    //   console.log('trying title',currentVideoData.channelName)
    //   console.log('got current video data',currentVideoData)

    const currentTime = youtubePlayer.currentTime;
    const newBookmark = {
      time: currentTime,
      desc:
        bookmarkTitle != ""
          ? bookmarkTitle
          : `Bookmark at ${getTime(currentTime)}`,
    };

    // const getVideoTitleRes= await fetch(`${url}/app/YT/?videoId=${currentVideo}&time=${newBookmark.time}`, {
    //   headers: { "content-type": "application/json" },
    // });
    // fetch latest bookmarks
    const data = await fetchCurrentVideoData();
    // conacte old and new bookmarks
    const oldBookmarks = data.bookmarks ? data.bookmarks : [];
    const sortedBookmarks = [...oldBookmarks, newBookmark].sort(
      (a, b) => a.time - b.time
    );
    const updatedVideoData = { ...data, bookmarks: sortedBookmarks };

    // store updated bookmars
    currentVideoBookmarks = [...currentVideoBookmarks, newBookmark].sort(
      (a, b) => a.time - b.time
    );
    currentVideoData.bookmarks = updatedVideoData.bookmarks;
    currentVideoData.isTitlePause = updatedVideoData.isTitlePause;
    const newVideoData = await addOrDeleteBookmarkOnServer({
      videoId: currentVideo,
      time: newBookmark.time,
      operationType: "NEW",
      timestampTitle: newBookmark.desc,
    });
    if (newVideoData.error) return;
    currentVideoData.title = newVideoData.title;
    console.log(
      "currentVideoData",
      currentVideoData,
      "newVideoData",
      newVideoData
    );
    setValueToStorage(
      { ...currentVideoData, ...newVideoData },
      YT_PREFIX,
      currentVideo
    );

    bookmarkTitle = "";
  };

  const openModal = () => {
    youtubePlayer.pause();

    const modal = document.createElement("dialog");
    modal.id = "dialog";
    modal.innerHTML = `
  <div class="input">
    <input type="text" class="name" id="bookmarkTitle" placeholder="Enter bookmark title" />
    <button class="accept" id="add-btn">Save</button>
  </div>`;

    document.body.appendChild(modal);
    const dialog = document.querySelector("dialog");
    dialog.showModal();

    // Reset the input value
    const inputField = document.getElementById("bookmarkTitle");
    inputField.value = "";
    inputField.focus();
    bookmarkTitle = "";

    // Close the modal when clicking anywhere on the screen
    document.getElementById("dialog").addEventListener("click", (event) => {
      if (event.target === dialog) closeModal();
    });

    // Close the modal when clicking anywhere on the screen
    document.getElementById("add-btn").addEventListener("click", () => {
      closeModal();
      addBookmark();
    });
    // close modal when pressing enter key
    document.addEventListener("keydown", handleKeyPress);
  };

  const closeModal = () => {
    const modal = document.getElementById("dialog");
    if (!modal) return;

    // get bookmark title from field
    getBookMarkTitle();

    modal.parentNode.removeChild(modal);

    // removing the listner from document
    document.removeEventListener("keydown", handleKeyPress);

    // resume the video
    youtubePlayer.play();
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      closeModal();
      addBookmark();
    }
  };

  const getBookMarkTitle = () => {
    const inputField = document.getElementById("bookmarkTitle");
    bookmarkTitle = inputField?.value;
  };

  const getCurrentVideoDetail = () => {
    const title = document.querySelector(
      ".title > .ytd-video-primary-info-renderer"
    ).innerText;
    const thumbnail = `http://img.youtube.com/vi/${currentVideo}/0.jpg`;

    currentVideoData["title"] = title;
    currentVideoData["thumbnail"] = thumbnail;
  };

  // runs if there is any context invalidate error occurs
  const sendReloadSignal = () => {
    window.location.reload();
  };

  async function addOrDeleteBookmarkOnServer(data) {
    try {
      const res = await fetch(`${url}/app/hook/yt`, {
        method: "post",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const video = await res.json();
      console.log("sent data", video);
      return video;
    } catch (err) {
      console.log("error in addOrDeleteBookmarkOnServer", err);
      return err;
    }
  }
})();
