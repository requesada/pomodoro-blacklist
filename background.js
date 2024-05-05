let isPopupOpen = false

let blockedSites = []
let task = ''

const sounds = {
  volumeTestTone: new Audio('../audio/volume-test-tone.mp3'),
  workTimerDone: new Audio('../audio/work-timer-done.mp3'),
  breakTimerDone: new Audio('../audio/break-timer-done.mp3')
}

const playSound = (sound) => {
  if (sound === 'volumeTestTone') {
    sounds[sound].currentTime = 0
  }
  sounds[sound].play()
}

const updateVolume = (newValue) => {
  Object.values(sounds).forEach(sound => {
    sound.volume = newValue
  })
}

const roundPhases = ['ready', 'ready', 'ready', 'ready']

const timerState = {
  round: 0,
  phaseIndex: 0,
  isRunning: false
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

const phase = ['work-counting', 'work-done', 'break-counting', 'break-done']

const advance = () => {
  if (roundPhases[timerState.round] !== 'ready' && timerState.phaseIndex < phase.length - 1) {
    ++timerState.phaseIndex
    roundPhases[timerState.round] = phase[timerState.phaseIndex]
  } else if (timerState.round < 3 && timerState.phaseIndex === phase.length - 1) {
    timerState.phaseIndex = 0
    ++timerState.round
    roundPhases[timerState.round] = phase[timerState.phaseIndex]
  } else if (roundPhases[timerState.round] === 'ready') {
    roundPhases[timerState.round] = phase[timerState.phaseIndex] 
  } else if (timerState.round === 3 && timerState.phaseIndex === phase.length - 1) {
    timerState.round = 0
    timerState.phaseIndex = 0
    for (let i = 1; i < roundPhases.length; i++) {
      roundPhases[i] = 'ready'
    }
    roundPhases[0] = phase[0]
  }
  if (isPopupOpen) browser.runtime.sendMessage({action: 'getStyles'})
}

const setTime = () => {
  let nextTime
  const formatTime = (minutes) => `${String(minutes).padStart(2, '0')}:00`
  if (timerState.round === 3 && roundPhases[timerState.round] === 'work-done') {
    nextTime = formatTime(timerSettingLengths.longBreak)
  } else if (roundPhases[timerState.round] === 'work-done') {
    nextTime = formatTime(timerSettingLengths.shortBreak)
  } else {
    nextTime = formatTime(timerSettingLengths.pomodoro)
  }
  browser.runtime.sendMessage({
    action: 'updateTime',
    time: nextTime
  })
}

const timer = () => {
  timerState.isRunning = true
  // let startingMinutes
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
      timerState.isRunning = false
      if (isPopupOpen) browser.runtime.sendMessage({action: 'getTimerState'})
      clearInterval(intervalID)
      advance()
      sounds.workTimerDone.play()
      if (isPopupOpen) {
        browser.runtime.sendMessage({action: 'resetStart'})
        setTime()
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
    case 'advance':
      advance()
      break

    case 'clearInterval':
      clearInterval(intervalID)
      break

    case 'getPhases':
      sendResponse({roundPhases})
      break
  
    case 'getTask':
      sendResponse({task})
      break
  
    case 'getTimerState':
      sendResponse({timerState})
      break

    case 'playSound':
      playSound(message.sound)
      break
    
    case 'reset':
      clearInterval(intervalID)
      for (let i = 0; i < roundPhases.length; i++) {
        roundPhases[i] = 'ready'
      }
      timerState.round = 0
      timerState.phaseIndex = 0
      timerState.isRunning = false
      setTime()
      break
  
    case 'startTimer':
      timer()
      break

    case 'stopTimer':
      clearInterval(intervalID)
      timerState.phaseIndex = 0
      timerState.isRunning = false
      roundPhases[timerState.round] = 'ready'
      setTime()
      break
  
    case 'updateSites':
      updateBlockedSites(message.sites)
      break
  
    case 'updateTask':
      updateTask(message.newTask)
      break
    
    case 'updateVolume':
      updateVolume(message.volume)
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