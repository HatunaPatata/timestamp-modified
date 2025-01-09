import {
  getAllValuesFromStorage,
  getCurrentActiveTab,
  getValueFromStorage,
  getVideoId,
  setValueToStorage
} from './utils.js';
let checkbox;
const YT_PREFIX = "YT-";
const TXT_PREFIX="TXT-"

// adding a new bookmark row to the popup
const addNewBookmark = (bookmarkElement, bookmark) => {
  const title = document.createElement('div');
  const newElement = document.createElement('div');
  const controlElement = document.createElement('div');
  const bookmarkType=bookmark.type
  console.log('addnewBookmark',bookmark)
  // title.textContent = bookmarkType==="TXT"?bookmark.text:bookmark.desc;
  title.innerHTML=`
  <div style="display:flex; flex-direction:column;">
<span style="font-weight:600;">${bookmark.title}</span>
<span>${bookmarkType==="TXT"?bookmark.text:bookmark.time+" " +bookmark.desc}</span>
  </div>
  `
  title.className = 'bookmark-title';
  title.title = bookmarkType==="TXT"?bookmark.comment:bookmark.desc;
console.log('title',title)
const id='bookmark-' + bookmarkType+'-'+bookmarkType==="TXT"?bookmark.comment + "-" +bookmark.text:bookmark.time+bookmark.disc;
  controlElement.className = 'bookmark-controls';
  newElement.id = id;
  newElement.className = 'bookmark';
  newElement.setAttribute('timestamp', id);

  setBookmarkAttributes(controlElement, onPlay, 'play');
  setBookmarkAttributes(controlElement, onDelete, 'delete');
  
  newElement.appendChild(title);
  newElement.appendChild(controlElement);
  bookmarkElement.appendChild(newElement);
};

const viewBookmarks = (currentBookmarks = []) => {
  const bookmarkElement = document.getElementById('bookmarks');
  bookmarkElement.innerHTML = '';
  if (currentBookmarks.length > 0) {
    currentBookmarks.forEach(bookmark => {
      addNewBookmark(bookmarkElement, bookmark);
    });
  } else {
    bookmarkElement.innerHTML = '<div class="row">No bookmarks</div>';
  }
};

const onPlay = async e => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute('timestamp');
  const activeTab = await getCurrentActiveTab();

  chrome.tabs.sendMessage(activeTab.id, {
    type: 'PLAY',
    value: bookmarkTime
  });
};

const onDelete = async e => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute('timestamp');
  const activeTab = await getCurrentActiveTab();
  const bookmarkElementToDelete = document.getElementById(
    'bookmark-' + bookmarkTime
  );
  bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

  chrome.tabs.sendMessage(
    activeTab.id,
    {
      type: 'DELETE',
      value: bookmarkTime
    },
    viewBookmarks
  );
};

const setBookmarkAttributes = (controlParentElement, eventListner, src) => {
  const controlElement = document.createElement('img');
  controlElement.src = 'assets/' + src + '.png';
  controlElement.title = src;
  controlElement.style='width:16px; height:16px'

  controlElement.addEventListener('click', eventListner);
  controlParentElement.appendChild(controlElement);
};

document.addEventListener('DOMContentLoaded', async () => {
  const activeTab = await getCurrentActiveTab();
  const currentVideo = getVideoId(activeTab);
  const optionButton = document.getElementById('option');

  const isYT= currentVideo && activeTab.url.includes('youtube.com/watch')
    const allValues = await getAllValuesFromStorage( null);
    const allBookmarks=[]
    let data={}
    for(const itemName in allValues){
      // let bookmarks=[]
      console.log('itemName',itemName,allValues[itemName])
      const item=JSON.parse(allValues[itemName])
      console.log('item',item,'allValues',allValues[itemName])
      console.log('item!',item)
      // if(typeof  item['isTitlePause'!==undefined]){
        //   data=item
        //   console.log('did it!',item)
        //   continue;
        // }
        const bookmarkType=itemName.startsWith(YT_PREFIX)?"YT":"TXT"
        console.log('type',bookmarkType,itemName)
      if(bookmarkType==="YT"&&item.bookmarks){
    // bookmarks = item.bookmarks 
    item.bookmarks.forEach(bookmark=>bookmark.title=item.title)
    allBookmarks.push(...item.bookmarks)
  }else if(bookmarkType==="TXT"){
    // item.type=bookmarkType
    const txtBookmark={type:bookmarkType,comment:itemName.slice(TXT_PREFIX.length),...item}
    console.log('its txtBookmark',txtBookmark,item)
    allBookmarks.push(txtBookmark)
    console.log('pushed item')
  }
}
console.log('allBookmarks',allBookmarks)
  viewBookmarks(allBookmarks);
    console.log('isYt1',isYT)
    if(isYT){
      console.log('isYt',isYT)
    checkbox = document.querySelector('input[type="checkbox"]');
    checkbox.checked = data?.isTitlePause ? data?.isTitlePause : false;
    checkbox.addEventListener('change', () =>
      toggleCheckbox(data, currentVideo)
    );
    }

  optionButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage(() => {});
  });

});

const toggleCheckbox = async (data, currentVideo) => {
  if (checkbox.checked) {
    setValueToStorage({ ...data, isTitlePause: true },YT_PREFIX, currentVideo);
  } else {
    setValueToStorage({ ...data, isTitlePause: false },YT_PREFIX, currentVideo);
  }
};
