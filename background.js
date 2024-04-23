let blockedSites = []

const blockSite = (requestDetails) => {
  const url = new URL(requestDetails.url)
  const urlString = url.hostname + url.pathname

  for (const site of blockedSites) {
    if (urlString.startsWith(site) || urlString.startsWith(`www.${site}`)) {
      return { redirectUrl: browser.extension.getURL('blocked.html') }
    }
  }
}

const updateBlockedSites = (sites) => {
  blockedSites = sites
}

const loadBlockedSites = () => {
  browser.storage.sync.get('blockedSites').then((result) => {
    updateBlockedSites(result.blockedSites || [])
  }, onError)
}

const onError = (error) => {
  console.error(`Error: ${error}`)
}

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.blockedSites) {
    updateBlockedSites(changes.blockedSites.newValue)
  }
})

browser.webRequest.onBeforeRequest.addListener(
  blockSite,
  {
    urls: ['<all_urls>'],
    types: ['main_frame']
  },
  ['blocking']
)

loadBlockedSites()

browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'updateSites') {
    updateBlockedSites(message.sites)
  }
})