const setDatatoStorage = () => {
  chrome.windows.getAll({ populate: true }, (windows) => {
    const timestamp = new Date().getTime();
    const dataToStore = {};

    windows.forEach((window) => {
      const windowData = window.tabs.map((tab) => ({
        favUrl: tab.favIconUrl,
        url: tab.url,
        title: tab.title,
      }));

      dataToStore[window.id] = windowData;
    });

    const dataObject = {
      [timestamp]: dataToStore,
    };

    chrome.storage.sync.set(dataObject, () => {
      // console.log("Data stored successfully:", dataObject);
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
            // console.log(`All tabs in window ${windowId} have been closed.`);
          });
        } else {
          const tabsToKeep = window.tabs.filter(
            (tab) => tab.id === currentTabId
          );
          const tabIdsToClose = window.tabs
            .filter((tab) => tab.id !== currentTabId)
            .map((tab) => tab.id);

          chrome.tabs.remove(tabIdsToClose, () => {
            // `console.log(
            //   `All tabs in window ${windowId} except the current tab have been closed.`
            // );`
          });
        }
      });
    });
  });
};

// chrome.commands.onCommand.addListener(function (command) {
//   console.log(command);
// });

document.addEventListener("DOMContentLoaded", () => {
  const focusBtns = document.getElementsByClassName("focus");
  const bookmarkContainer = document.getElementById("bookmarks");

  for (const focusBtn of focusBtns) {
    focusBtn.addEventListener("click", focusify);
  }

  chrome.storage.sync.get(null, (data) => {
    console.log(data);
    if (Object.keys(data).length > 0) {
      for (const timestamp in data) {
        const windowData = data[timestamp];

        const bookmarkDiv = document.createElement("div");
        bookmarkDiv.innerHTML = `${timestamp}`;
        bookmarkContainer.appendChild(bookmarkDiv);

        const reloadButton = document.createElement("button");
        reloadButton.innerText = `Reload ${timestamp}`;
        reloadButton.addEventListener(
          "click",
          reloadWindowsFromData(windowData)
        );
        bookmarkContainer.appendChild(reloadButton);

        Object.keys(windowData).map((window) => {
          windowData[window].map((tab) => {
            const subBookmakDiv = document.createElement("div");
            subBookmakDiv.innerHTML = `<p>${tab.title}</p>`;
            bookmarkContainer.appendChild(subBookmakDiv);
          });
        });
      }
    } else {
      const noBookmarksMessage = document.createElement("div");
      noBookmarksMessage.innerHTML = "No bookmarks found in storage.";
      bookmarkContainer.appendChild(noBookmarksMessage);
    }
  });
});

const reloadWindowsFromData = (windowData) => {
  if (windowData && Object.keys(windowData).length > 0) {
    const tabsToCreate = Object.values(windowData).flatMap((tabs) =>
      tabs.map((tab) => ({
        url: tab.url,
      }))
    );

    if (tabsToCreate.length > 0) {
      const urlsToOpen = tabsToCreate.map((tab) => tab.url);

      console.log(urlsToOpen);

      // chrome.windows.create({
      //   url: urlsToOpen,
      // });
    } else {
      console.log("No tabs found in the specified windowData.");
    }
  } else {
    console.log("Invalid or empty windowData.");
  }
};
