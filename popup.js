const setDatatoStorage = () => {
  chrome.windows.getAll({ populate: true }, (windows) => {
    console.log(windows);
    const timestamp = new Date().getTime();
    const dataToStore = {};

    windows.forEach((window) => {
      const windowData = [];
      window.tabs.forEach((tab) => {
        const tabData = {
          favUrl: tab.favIconUrl,
          url: tab.url,
          title: tab.title,
        };

        windowData.push(tabData);
      });

      if (!dataToStore[window.id]) {
        dataToStore[window.id] = [];
      }

      dataToStore[window.id].push(windowData);
    });

    const dataObject = {
      [timestamp]: dataToStore,
    };

    chrome.storage.sync.set(dataObject, () => {
      console.log("Data stored successfully:", dataObject);
    });
  });
};

const focusify = () => {
  setDatatoStorage();

  chrome.windows.getCurrent({ populate: true }, (currentWindow) => {
    const currentWindowId = currentWindow.id;
    const currentTabId = currentWindow.tabs.find((tab) => tab.active).id;

    chrome.windows.getAll({ populate: true }, (windows) => {
      windows.forEach((window) => {
        const windowId = window.id;

        if (windowId !== currentWindowId) {
          const tabIdsToClose = window.tabs.map((tab) => tab.id);

          chrome.tabs.remove(tabIdsToClose, () => {
            console.log(`All tabs in window ${windowId} have been closed.`);
          });
        } else {
          const tabsToKeep = window.tabs.filter(
            (tab) => tab.id === currentTabId
          );
          const tabIdsToClose = window.tabs
            .filter((tab) => tab.id !== currentTabId)
            .map((tab) => tab.id);

          chrome.tabs.remove(tabIdsToClose, () => {
            console.log(
              `All tabs in window ${windowId} except the current tab have been closed.`
            );
          });
        }
      });
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  const focusBtns = document.getElementsByClassName("focus");
  const bookmarkContainer = document.getElementById("bookmarks");

  for (const focusBtn of focusBtns) {
    focusBtn.addEventListener("click", focusify);
  }

  chrome.storage.sync.get(null, (data) => {
    if (Object.keys(data).length > 0) {
      for (const timestamp in data) {
        const bookmarkDiv = document.createElement("div");
        bookmarkDiv.className = "bookmark";
        bookmarkDiv.innerHTML = `${timestamp}`;
        bookmarkContainer.appendChild(bookmarkDiv);
      }
    } else {
      const noBookmarksMessage = document.createElement("div");
      noBookmarksMessage.innerHTML = "No bookmarks found in storage.";
      bookmarkContainer.appendChild(noBookmarksMessage);
    }
  });
});
