const options = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hour12: true,
};

const formatter = new Intl.DateTimeFormat("en-US", options);

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
  const focusBtns = document.getElementsByClassName("button-86");
  const clearAllBtn = document.querySelector(".button-36");
  const deleteButtons = document.querySelectorAll(".delete");
  const openAllButton = document.getElementById("openallbutton");
  const bookmarkContainer = document.getElementsByClassName("body");

  const clearAll = () => {
    console.log("Clear All button clicked!");
  };

  const deleteBookmark = () => {
    console.log("Delete button clicked!");
  };

  const openAllBookmarks = () => {
    console.log("Open All button clicked!");
  };

  chrome.storage.sync.get(null, (data) => {
    if (Object.keys(data).length > 0) {
      for (const timestamp in data) {
        const windowData = data[timestamp];

        const bookmarkDiv = document.createElement("div");
        bookmarkDiv.id = "Outerdiv";
        bookmarkDiv.className = "web";

        const date = document.createElement("div");
        date.className = "date";

        const label = document.createElement("h3");
        label.className = "text";

        label.innerText = `${Date(timestamp)}`;

        date.appendChild(label);
        // Create innerbutton container
        const innerButtonContainer = document.createElement("div");
        innerButtonContainer.className = "innerbutton";

        // Create delete button
        const deleteButton = document.createElement("button");
        deleteButton.className = "delete";
        deleteButton.setAttribute("role", "button");
        deleteButton.id = "deletebutton";

        // Create delete icon
        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fa-solid fa-trash";
        deleteIcon.style.fontSize = "17px";

        // Append delete icon to delete button
        deleteButton.appendChild(deleteIcon);

        // Append delete button to innerbutton container
        innerButtonContainer.appendChild(deleteButton);

        // Create openall button
        const openAllButton = document.createElement("button");
        openAllButton.className = "delete";
        openAllButton.setAttribute("role", "button");
        openAllButton.id = "openallbutton";

        // Create openall icon
        const openAllIcon = document.createElement("i");
        openAllIcon.className = "fa-solid fa-arrow-up-right-from-square";
        openAllIcon.style.fontSize = "17px";

        // Append openall icon to openall button
        openAllButton.appendChild(openAllIcon);

        // Append openall button to innerbutton container
        innerButtonContainer.appendChild(openAllButton);

        bookmarkDiv.appendChild(date);
        bookmarkDiv.appendChild(innerButtonContainer);

        document.getElementById("body").appendChild(bookmarkDiv);
      }
    } else {
      const noBookmarksMessage = document.createElement("div");
      noBookmarksMessage.innerHTML = "No bookmarks found in storage.";
      bookmarkContainer.appendChild(noBookmarksMessage);
    }
  });

  for (const focusBtn of focusBtns) {
    focusBtn.addEventListener("click", focusify);
  }

  clearAllBtn.addEventListener("click", clearAll);

  for (const deleteButton of deleteButtons) {
    deleteButton.addEventListener("click", deleteBookmark);
  }

  openAllButton.addEventListener("click", openAllBookmarks);
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

      chrome.windows.create({
        url: urlsToOpen,
      });
    } else {
      console.log("No tabs found in the specified windowData.");
    }
  } else {
    console.log("Invalid or empty windowData.");
  }
};
