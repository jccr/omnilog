const createOmnilogTab = async () => {
  const tabs = await chrome.tabs.query({
    url: `chrome-extension://${chrome.runtime.id}/omnilog.html`,
  })
  if (tabs.length === 0) {
    await chrome.tabs.create({
      url: 'omnilog.html',
      active: false,
      pinned: true,
    })
  }
}

createOmnilogTab()
