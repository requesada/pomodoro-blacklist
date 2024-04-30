let isPopupOpen = false

let blockedSites = []
let task = ''

const timerState = {
  round: 0,
  phaseIndex: 0
}

let time
let intervalID
let timerSettingLengths = {}
const getTimerSettingLengths = (result) => {
  if (result.timerSettings) {
    for (const [setting, {length}] of Object.entries(result.timerSettings)) {
      if (setting !== 'volume') {
        timerSettingLengths[setting] = length
      }
    }
  } else {
    timerSettingLengths = {
      pomodoro: 25,
      shortBreak: 5,
      longBreak: 15
    }
  }
  time = `${String(timerSettingLengths.pomodoro).padStart(2, '0')}:00`
}
const onGetLengthsError = (error) => {
  console.log(`Error getting lengths: ${error}`)
}
browser.storage.local.get('timerSettings')
  .then(getTimerSettingLengths, onGetLengthsError)
// TODO This needs to drive a lot
const timer = () => {
  let startingMinutes
  if (timerState.round === 3 && timerState.phaseIndex === 2) {
    startingMinutes = timerSettingLengths.longBreak
  } else if (timerState.phaseIndex === 2) {
    startingMinutes = timerSettingLengths.shortBreak
  } else {
    startingMinutes = timerSettingLengths.pomodoro
  }
  let minutes = startingMinutes - 1
  // let minutes = 0
  let seconds = 59
  
  const subtractSecond = () => {
    time = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    if (isPopupOpen) {
      browser.runtime.sendMessage({
        action: 'updateTime',
        time
      })
    }
    if (seconds === 0 && minutes > 0) {
      minutes--
      seconds = 59
    } else if (seconds > 0) {
      seconds--
    } else {
      clearInterval(intervalID)
      if (isPopupOpen) {
        browser.runtime.sendMessage({action: 'advance'})
        browser.runtime.sendMessage({action: 'timeUp'})
      }
    }
  }
  
  intervalID = setInterval(subtractSecond, 1000)
}

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

const updatePhase = (phaseIndex) => {
  timerState.phaseIndex = phaseIndex
}

const updateRound = (newRound) => {
  timerState.round = newRound
}

const updateTask = (newTask) => {
  task = newTask
}

const loadBlockedSites = () => {
  browser.storage.local.get('blockedSites').then((result) => {
    updateBlockedSites(result.blockedSites || [])
  }, onError)
}

const onError = (error) => {
  console.error(`Error: ${error}`)
}

browser.storage.local.onChanged.addListener((changes) => {
  if (changes.blockedSites) {
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

browser.runtime.onMessage.addListener((message, _, sendResponse) => {
  switch (message.action) {
    case 'clearInterval':
      clearInterval(intervalID)
      break
  
    case 'getTask':
      sendResponse({task})
      break
  
    case 'getTimerState':
      sendResponse({timerState})
      break
  
    case 'startTimer':
      timer()
      break
  
    case 'updatePhase':
      updatePhase(message.phaseIndex)
      break
  
    case 'updateRound':
      updateRound(message.round)
      break
  
    case 'updateSites':
      updateBlockedSites(message.sites)
      break
  
    case 'updateTask':
      updateTask(message.newTask)
      break
  }
  

  if (message.popupOpen) {
    isPopupOpen = true
    browser.runtime.sendMessage({
      action: 'updateTime',
      time
    })
  } else if (message.hasOwnProperty('popupOpen') && !message.popupOpen) {
    isPopupOpen = false
  }
})