let isPopupOpen = false

let blockedSites = []
let task = ''

const audioPath = '../assets/audio'
const iconPath = '../assets/icons'

const sounds = {
  volumeTestTone: new Audio(`${audioPath}/volume-test-tone.mp3`),
  workTimerDone: new Audio(`${audioPath}/work-timer-done.mp3`),
  breakTimerDone: new Audio(`${audioPath}/break-timer-done.mp3`)
}

const playSound = (sound) => {
  if (sound === 'volumeTestTone') {
    sounds[sound].currentTime = 0
  }
  sounds[sound].play()
}

const updateVolume = (newValue) => {
  for (const sound of Object.values(sounds)) {
    sound.volume = newValue
  }
}

const roundPhases = ['ready', 'ready', 'ready', 'ready']

const timerState = {
  round: 0,
  phaseIndex: 0,
  isRunning: false
}

let currentIcon
const iconSetter = (icon) => {
  currentIcon = icon
  return (
    browser.browserAction.setIcon({
      path: {
        48: `${iconPath}/${icon}-48.png`,
        96: `${iconPath}/${icon}-96.png`
      }
    })
  )
}

const alternateIcons = () => {
  let iconArray
  if (roundPhases[timerState.round] === 'work-counting') {
    iconArray = ['none', 'green']
  } else if (roundPhases[timerState.round] === 'break-counting') {
    iconArray = ['green', 'all']
  }

  let newIcon
  if (iconArray.includes(currentIcon)) {
    newIcon = currentIcon === iconArray[0] ? iconArray[1] : iconArray[0]
  } else {
    newIcon = iconArray[1]
  }

  iconSetter(newIcon)
}

const setIcon = () => {
  switch (roundPhases[timerState.round]) {
    case 'work-counting': {
      iconSetter('none')
      break
    }
    case 'work-done': {
      iconSetter('green')
      break
    }
    case 'break-counting': {
      iconSetter('green')
      break
    }
    case 'break-done': {
      iconSetter('all')
      break
    }
  }
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
    for (let index = 1; index < roundPhases.length; index++) {
      roundPhases[index] = 'ready'
    }
    roundPhases[0] = phase[0]
  }
  if (isPopupOpen) browser.runtime.sendMessage({action: 'getStyles'})
}

const formatTime = (minutes) => `${String(minutes).padStart(2, '0')}:00`
const setTime = () => {
  let nextTime
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
  setIcon()
  timerState.isRunning = true
  let startingMinutes
  if (timerState.round === 3 && timerState.phaseIndex === 2) {
    startingMinutes = timerSettingLengths.longBreak
  } else if (timerState.phaseIndex === 2) {
    startingMinutes = timerSettingLengths.shortBreak
  } else {
    startingMinutes = timerSettingLengths.pomodoro
  }
  let minutes = startingMinutes - 1
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
      alternateIcons()
    } else if (seconds > 0) {
      seconds--
      alternateIcons()
    } else {
      timerState.isRunning = false
      if (isPopupOpen) browser.runtime.sendMessage({action: 'getTimerState'})
      clearInterval(intervalID)
      advance()
      setIcon()
      if (roundPhases[timerState.round].includes('work')) {
        sounds.workTimerDone.play()
      } else {
        sounds.breakTimerDone.play()
      }
      if (isPopupOpen) {
        browser.runtime.sendMessage({action: 'resetStart'})
        setTime()
      }
    }
  }
  
  intervalID = setInterval(subtractSecond, 1000)
}

const blockTab = (tabID, address) => {
  const url = new URL(address)
  const urlString = url.hostname
  for (const site of blockedSites) {
    if (roundPhases[timerState.round] === 'work-counting' && (urlString.startsWith(site) || urlString.startsWith(`www.${site}`))) {
      browser.tabs.update(tabID, {url: 'src/blocked.html'})
    }
  }
}

browser.tabs.onUpdated.addListener((tabID, {url}) => {
  if (url) {
    blockTab(tabID, url)
  }
})

browser.tabs.onActivated.addListener((activeInfo) => {
  browser.tabs.get(activeInfo.tabId)
    .then(({id, url}) => {
      blockTab(id, url)
    })
})

const checkOpenTabs = () => (
  browser.tabs.query({}).then((tabs) => {
    for (const {id, url} of tabs) {
      blockTab(id, url)
    }
  })
)
checkOpenTabs()

const updateBlockedSites = (sites) => {
  blockedSites = sites
}

const updateTask = (newTask) => {
  task = newTask
}

const loadBlockedSites = () => {
  browser.storage.local.get('blockedSites')
    .then((result) => {
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

loadBlockedSites()

browser.runtime.onMessage.addListener((message, _, sendResponse) => {
  switch (message.action) {
    case 'advance': {
      advance()
      break
    }

    case 'checkOpenTabs': {
      checkOpenTabs()
      break
    }

    case 'clearInterval': {
      clearInterval(intervalID)
      break
    }

    case 'getPhases': {
      sendResponse({roundPhases})
      break
    }
  
    case 'getTask': {
      sendResponse({task})
      break
    }
  
    case 'getTimerState': {
      sendResponse({timerState})
      break
    }

    case 'playSound': {
      playSound(message.sound)
      break
    }
      
    case 'reset': {
      clearInterval(intervalID)
      for (let index = 0; index < roundPhases.length; index++) {
        roundPhases[index] = 'ready'
      }
      timerState.round = 0
      timerState.phaseIndex = 0
      timerState.isRunning = false
      setTime()
      break
    }
      
    case 'setTime': {
      setTime()
      break
    }
    
    case 'startTimer': {
      timer()
      break
    }

    case 'stopTimer': {
      clearInterval(intervalID)
      timerState.phaseIndex = 0
      timerState.isRunning = false
      roundPhases[timerState.round] = 'ready'
      setTime()
      break
    }
  
    case 'updateSites': {
      updateBlockedSites(message.sites)
      break
    }
  
    case 'updateTask': {
      updateTask(message.newTask)
      break
    }

    case 'updateTimerSettingLengths': {
      timerSettingLengths = {...timerSettingLengths, ...message.newLength}
      break
    }
    
    case 'updateVolume': {
      updateVolume(message.volume)
      break
    }
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