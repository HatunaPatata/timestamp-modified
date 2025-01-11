const YT_PREFIX = "YT-";

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  sendResponse({});
  if (message.type === "refreshOptionsPage") {
    // Reload the options page to fetch the latest data from sync storage
    location.reload();
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const bookmarks = [];
  let parseBookmark = {};

  // Elements reference
  const buttonElement = document.getElementById("search");
  const bookmarkElement = document.getElementById("bookmark-list");

  const getTime = (t) => {
    const date = new Date(0);
    date.setSeconds(t);
    return date.toISOString().slice(11, 19);
  };

  const secondsToTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${hours}h${minutes}m${remainingSeconds}s`;
  };

  const handleClick = (event) => {
    console.log("event", event);
    const link = event.url
      ? event.url + `#:~:text=${encodeURIComponent(event.text)}`
      : `https://www.youtube.com/watch?v=${event.videoId}&t=${secondsToTime(
          event.time
        )}`;
    // const link
    window.open(link);
  };

  // render bookmarks in DOM
  const renderBookmarks = (bookmarks) => {
    console.log("bookmarks", bookmarks);
    bookmarks.forEach((bookmark) => {
      console.log("bookmark", bookmark);
      const cardDiv = document.createElement("div");
      const isYt = bookmark.videoId;
      const id = isYt ? bookmark.id + bookmark.time : bookmark.text;
      const title = bookmark.title || "Video Title";
      const description = bookmark.desc || bookmark.comment;
      const timestamp = isYt ? getTime(bookmark.time) : bookmark.text;
      cardDiv.className = "card";
      cardDiv.id = `bookmark-${id}`;
      cardDiv.innerHTML = `
        <img ${isYt ? "" : "hidden"} src=${
        bookmark.thumbnail || "/assets/default-placeholder.png"
      } alt="Video Thumbnail">
        <div class="card-content">
          <h2 class="video-title">${title}</h2>
          <p class="description">${description}</p>
          <p class="timestamp">${timestamp}</p>
        </div>
      `;

      bookmarkElement.appendChild(cardDiv);

      const cardElement = document.getElementById(`bookmark-${id}`);

      cardElement.addEventListener("click", () =>
        handleClick({
          ...bookmark,
          title: bookmark.title || "",
          thumbnail: bookmark.thumbnail || "",
        })
      );
    });
  };

  // get bookmarks from storage
  const getBookmarks = async () => {
    const result = await chrome.storage.local.get();
    console.log("result", result);
    Object.keys(result)
      // .filter((key) => key.startsWith(YT_PREFIX))
      .forEach((bookmark) => {
        const isYT = bookmark.startsWith(YT_PREFIX);
        parseBookmark = JSON.parse(result[bookmark]);
        if (isYT) {
          console.log(" yt");

          if (parseBookmark?.bookmarks?.length > 0) {
            parseBookmark?.bookmarks.forEach((parseMark, index) => {
              bookmarks.push({
                ...parseMark,
                videoId: parseBookmark.id,
                title: parseBookmark.title || "",
                thumbnail: parseBookmark.thumbnail || "",
              });
            });
          }
        } else {
          console.log("not yt", parseBookmark);
          bookmarks.push(parseBookmark);
        }
      });
    console.log(bookmarks);
    renderBookmarks(bookmarks);
  };

  const handleSearch = () => {
    const searchInput = document.getElementById("filter");
    const searchText = searchInput.value;

    bookmarkElement.innerHTML = "";

    if (searchText) {
      const filterBookmarks = bookmarks.filter((bookmark) => {
        const isYT = !!bookmark.videoId;
        if (isYT) {
          return (
            bookmark.desc.toLowerCase().includes(searchText.toLowerCase()) ||
            bookmark.title.toLowerCase().includes(searchText.toLowerCase())
          );
        } else {
          return (
            bookmark.title.toLowerCase().includes(searchText) ||
            bookmark.comment.toLowerCase().includes(searchText) ||
            bookmark.text.toLowerCase().includes(searchText)
          );
        }
      });
      renderBookmarks(filterBookmarks);
    } else {
      renderBookmarks(bookmarks);
    }
  };
  // listners
  buttonElement.addEventListener("click", handleSearch);

  // init methods()
  getBookmarks();
});
