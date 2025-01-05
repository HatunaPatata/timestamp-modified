export const getCurrentActiveTab = async () => {
  let queryOptions = { active: true, lastFocusedWindow: true };

  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

export const getVideoId = tab => {
  const queryParameters = tab.url.split('?')[1];
  const urlParameters = new URLSearchParams(queryParameters);
  return urlParameters.get('v');
};

 export const getValueFromStorage = async (key, defaultResponse) => {
   const result = await chrome.storage.sync.get([key]);
    return result[key] ? JSON.parse(result[key]) : defaultResponse;
  };

 export const setValueToStorage = async (value, key) => {
    await chrome.storage.sync.set({[key]: JSON.stringify(value)});
    console.log('key',key)
    const data=await chrome.storage.sync.get()
    // console.log('predata2',data[key])
    // const bookmarks=JSON.parse(data)
    console.log('got data2',data)
    //http://localhost:10000
    const res=await fetch("https://yt-timestamp.onrender.com/app/hook",{
      method:'post',
      headers:{'content-type':'application/json'},
      body:JSON.stringify(data)
  })
      const resData=await res.json()
      console.log('resData2',resData)
  
  };
