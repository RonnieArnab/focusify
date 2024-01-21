chrome.windows.onCreated.addListener((windowData) => {
    console.log("Window Created")
    console.log(windowData)
  },
    {windowType : ['normal', 'popup']},
  )
  