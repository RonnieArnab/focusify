chrome.commands.onCommand.addListener((command) => {
    console.log(`Command: ${command}`);
  });

const focusify = async () => {
    let currentTab = await getCurrentTab();
    let currentTabId = currentTab.id;
    let currentWindowId = currentTab.windowId
    chrome.windows.getAll({populate : true},(data) => {
        let timestamp = new Date().getTime() 
        let allWindowData = {}
        if(data.length == 1 && data[0]["tabs"].length == 1){
            let errorMsg = document.getElementById('message')
            errorMsg.style.display = "flex"
            setTimeout(() => {
                errorMsg.style.display = "none"
            }, 5000)
            return
        }
        for(var i=0;i<data.length;i++){
            let windowData = []
            let tabs = data[i]["tabs"]
            for(var j=0;j<tabs.length;j++){
                if(tabs[j]["id"] == currentTabId) continue
                let tabData = {
                    url : tabs[j]["url"],
                    favicon : tabs[j]["favIconUrl"],
                    title : tabs[j]["title"]
                }
                windowData.push(tabData)
            }
            allWindowData[data[i]["id"]] = windowData
        }
        chrome.storage.sync.set({ [timestamp]: allWindowData }, function(){
            deleteTabs(Object.keys(allWindowData),currentTabId,currentWindowId)
            console.log("Done")
        });
        loadInitialData()
    })
};

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

const deleteTabs = async (windowIds,currentTabId,currentWindowId) => {
  for(var i=0;i<windowIds.length;i++){
    if(windowIds[i] == currentWindowId) continue
    await chrome.windows.remove(parseInt(windowIds[i]),function(){})
  }

  chrome.windows.get(currentWindowId,{populate : true},async (currentWindowData) => {
    let tabs = currentWindowData.tabs
    for(var i=0;i<tabs.length;i++){
        if(tabs[i]['id'] == currentTabId) continue
        await chrome.tabs.remove(tabs[i]['id'],() => {})
    }
  })
};

const reloadAll = (timestamp) => {
    console.log(timestamp)
    chrome.storage.sync.get(timestamp, function(data) {
        let windows = data[timestamp]
        let keys = Object.keys(windows)
        
        for(var i=0;i<keys.length;i++){
            let tabs = windows[keys[i]]

            let urls = []
            for(var j=0;j<tabs.length;j++){
                urls.push(tabs[j]['url'])
            }

            chrome.windows.create({state: "maximized", url : urls}, (response) => {
            })
        }

        // let bookmarkDisplay = document.getElementById("bookmarks");
        // var keys = Object.keys(items).sort((a,b) => b - a);
        // for(var i=0;i<keys.length;i++){
        //     let div = document.createElement('div')
        //     div.innerHTML = keys[i]
        //     bookmarkDisplay.appendChild(div)
        // }
        // console.log(items)
        // console.log(keys);
    });
};

const reloadTab = (url) => {
    chrome.tabs.create({url : url},() => {})
};

const deleteFocusifyTimestamp = (timestamp) => {
    chrome.storage.sync.remove(timestamp, function(data) {})
    loadInitialData()
};

const deleteTab = (key) => {
    let timestamp = key.split("%")[0]
    chrome.storage.sync.get(timestamp, function(data) {
        data[timestamp][key.split("%")[1]].splice(parseInt(key.split("%")[2]),1)
        chrome.storage.sync.set({ [timestamp]: data[timestamp] }, function(){})

        let reqTabDisplay = document.getElementById(key)
        reqTabDisplay.remove();

        let display = document.getElementById("tabsDisplay")
        console.log(display)
        if(display.childElementCount == 0){
            display.innerText = "No tabs to display"
        }
        else{
            openTimestamp(timestamp)
        }
    })
};

const clearTimestamps =  () => {
    chrome.storage.sync.clear();
    loadInitialData()
};

const openTimestamp =  (timestamp) => {
    let page1 = document.getElementById('page1');
    page1.setAttribute("style","display:none;")
    console.log("open time")

    let page2 = document.getElementById('page2');
    let tabsDisplay = document.getElementById("tabsDisplay")
    tabsDisplay.innerHTML = ""

    let tabArrays = [];
    chrome.storage.sync.get(timestamp, function(response) {
        let data = response[timestamp]
        var keys = Object.keys(data);
        for(var i=0;i<keys.length;i++){
            for(var j=0;j<data[keys[i]].length;j++){
                data[keys[i]][j]["id"] = timestamp + "%" + keys[i] + "%" + j
                tabArrays.push(data[keys[i]][j])
            }
        }

        for(var i=0;i<tabArrays.length;i++){
            let div = document.createElement('div')
            div.id = tabArrays[i]['id']
            div.className = "web"

            let innerDiv1 = document.createElement('div')
            let innerDiv2 = document.createElement('div')
            let innerDiv3 = document.createElement('div')

            innerDiv1.id = "tabLogo"
            let logo = document.createElement('img')
            logo.src = tabArrays[i]['favicon']
            logo.className = "websitelogo"
            innerDiv1.appendChild(logo)

            innerDiv2.className = "tabTitleDiv"
            let h3 = document.createElement('h3')
            h3.className = "tabTitle";
            h3.innerText = tabArrays[i]['title']
            innerDiv2.appendChild(h3)

            innerDiv3.className = "innerbutton"

            let deleteBtn = document.createElement('button')
            let openBtn = document.createElement('button')

            deleteBtn.className = 'delete'
            deleteBtn.id = "deletebutton"
            deleteBtn.role = "button"
            deleteBtn.setAttribute("key",tabArrays[i]['id'])
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash" style="font-size: 16px;"></i>'

            openBtn.className = 'delete'
            openBtn.id = "openallbutton"
            openBtn.role = "button"
            openBtn.setAttribute("url",tabArrays[i]['url'])
            openBtn.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 16px;"></i>'

            innerDiv3.appendChild(deleteBtn)
            innerDiv3.appendChild(openBtn)


            deleteBtn.addEventListener('click',function(evt) {
                deleteTab(evt.currentTarget.getAttribute("key"))
            })
            openBtn.addEventListener('click',function(evt) {
                reloadTab(evt.currentTarget.getAttribute("url"))
            })

            div.appendChild(innerDiv1)
            div.appendChild(innerDiv2)
            div.appendChild(innerDiv3)
            tabsDisplay.appendChild(div)
        }
        if(tabArrays.length.length == 0) tabsDisplay.innerHTML = "No Tabs to display"
    })
    let clearAllTabsBtn = document.getElementById("clearAllTabsBtn")
    clearAllTabsBtn.setAttribute('timestamp',timestamp)
    page2.setAttribute("style","display:block;")

    document.getElementById("backBtnPage2").addEventListener('click',function () {
        page2.setAttribute("style","display:none;")
        page1.setAttribute("style","display:block;")
    })

    document.getElementById("clearAllTabsBtn").addEventListener('click',function (evt) {
        deleteFocusifyTimestamp(evt.currentTarget.getAttribute("timestamp"))
        page2.setAttribute("style","display:none;")
        page1.setAttribute("style","display:block;")
    })
};

const loadInitialData =  () => {
    chrome.storage.sync.get(null, function(items) {
        let bookmarkDisplay = document.getElementById("bookmarksDisplay");
        bookmarkDisplay.innerHTML = ""
        console.log(items)
        var keys = Object.keys(items).sort((a,b) => b - a);
        if(keys.length == 0) bookmarkDisplay.innerText = "No Bookmarks to Display"
        for(var i=0;i<keys.length;i++){
            let div = document.createElement('div')
            div.id = "Outerdiv"
            div.className = "web"

            let innerDiv1 = document.createElement('div')
            let innerDiv2 = document.createElement('div')

            innerDiv1.className = "date"
            let h3 = document.createElement('h3')
            h3.className = "text";
            h3.innerText = new Date(parseInt(keys[i])).toLocaleString().replace("GMT+0530 (India Standard Time)", "");
            h3.setAttribute("timestamp",keys[i])
            innerDiv1.appendChild(h3)

            innerDiv2.className = "innerbutton"

            let deleteBtn = document.createElement('button')
            let openBtn = document.createElement('button')

            deleteBtn.className = 'delete'
            deleteBtn.id = "deletebutton"
            deleteBtn.role = "button"
            deleteBtn.setAttribute("timestamp",keys[i])
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash" style="font-size: 16px;"></i>'

            openBtn.className = 'delete'
            openBtn.id = "openallbutton"
            openBtn.role = "button"
            openBtn.setAttribute("timestamp",keys[i])
            openBtn.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 16px;"></i>'

            innerDiv2.appendChild(deleteBtn)
            innerDiv2.appendChild(openBtn)


            deleteBtn.addEventListener('click',function(evt) {
                deleteFocusifyTimestamp(evt.currentTarget.getAttribute("timestamp"))
            })
            openBtn.addEventListener('click',function(evt) {
                reloadAll(evt.currentTarget.getAttribute("timestamp"))
            })
            h3.addEventListener('click',function(evt) {
                openTimestamp(evt.currentTarget.getAttribute("timestamp"))
            })

            div.appendChild(innerDiv1)
            div.appendChild(innerDiv2)
            bookmarkDisplay.appendChild(div)
            console.log("inside")
        }
    });
};


document.addEventListener("DOMContentLoaded", () => {
    loadInitialData()
    
    var button = document.getElementById('focusifyBtn');
    button.addEventListener('click', focusify);

    var clearAllbutton = document.getElementById('clearDb');
    clearAllbutton.addEventListener('click',clearTimestamps)
});
