let blockedSites = []
let task = ''

const timerState = {
  round: 0,
  phaseIndex: 0
}

let intervalID
const timer = async () => {
  let startingMinutes
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
  }
  const onGetLengthsError = (error) => {
    console.log(`Error getting lengths: ${error}`)
  }
  await browser.storage.local.get('timerSettings')
    .then(getTimerSettingLengths, onGetLengthsError)
  if (timerState.round === 3 && timerState.phaseIndex === 2) {
    startingMinutes = timerSettingLengths.longBreak
  } else if (timerState.phaseIndex === 2) {
    startingMinutes = timerSettingLengths.shortBreak
  } else {
    startingMinutes = timerSettingLengths.pomodoro
  }
  // let minutes = startingMinutes - 1
  let minutes = 0
  let seconds = 2
  
  const subtractSecond = () => {
    browser.runtime.sendMessage({
      action: 'updateTime',
      time: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    })
    if (seconds === 0 && minutes > 0) {
      minutes--
      seconds = 59
    } else if (seconds > 0) {
      seconds--
    } else {
      clearInterval(intervalID)
      browser.runtime.sendMessage({action: 'advance'})
      browser.runtime.sendMessage({action: 'timeUp'})
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

const updateTask = (newTask) => {
  task = newTask
}

const updatePhase = (phaseIndex) => {
  timerState.phaseIndex = phaseIndex
}

const updateRound = (newRound) => {
  timerState.round = newRound
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

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'clearInterval') {
    clearInterval(intervalID)
  }

  if (message.action === 'getTask') {
    sendResponse({task})
  }
  
  if (message.action === 'getTimerState') {
    sendResponse({timerState})
  }

  if (message.action === 'startTimer') {
    timer()
  }
  
  if (message.action === 'updatePhase') {
    updatePhase(message.phaseIndex)
  }

  if (message.action === 'updateRound') {
    updateRound(message.round)
  }
  
  if (message.action === 'updateSites') {
    updateBlockedSites(message.sites)
  }

  if (message.action === 'updateTask') {
    updateTask(message.newTask)
  }
})