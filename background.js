let blockedSites = []
let currentPhaseIndex = 0

const timerState = {
  round: 0,
  phaseIndex: 0
}

const tempStorage = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15
}

const sounds = {
  volumeTestTone: new Audio('../audio/volume-test-tone.mp3'),
  workTimerDone: new Audio('../audio/work-timer-done.mp3'),
  breakTimerDone: new Audio('../audio/break-timer-done.mp3')
}

// TODO storage
const timerSettings = {
  pomodoro: {
    length: 25,
    selector: '#pomodoro-length',
    sound: sounds.workTimerDone
  },
  shortBreak: {
    length: 5,
    selector: '#short-break-length',
    sound: sounds.breakTimerDone
  },
  longBreak: {
    length: 15,
    selector: '#long-break-length',
    sound: sounds.breakTimerDone
  },
}

const task = ''

const volumeLevel = 50 // TODO Keep in storage

const timer = () => {
  let startingMinutes
  if (round === 3 && phaseIndex === 2) {
    startingMinutes = timerSettings.longBreak.length
  } else if (phaseIndex === 2) {
    startingMinutes = timerSettings.shortBreak.length
  } else {
    startingMinutes = timerSettings.pomodoro.length
  }
  // let minutes = startingMinutes - 1
  let minutes = 0
  let seconds = 2

  const subtractSecond = () => {
    document.querySelector('#countdown').innerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    if (seconds === 0 && minutes > 0) {
      minutes--
      seconds = 59
    } else if (seconds > 0) {
      seconds--
    } else {
      clearInterval(intervalID)
      advance()
      timerButton.className = 'start-button'
      timerButton.innerHTML = 'Start'
      sounds.workTimerDone.play()
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
  currentPhaseIndex = phaseIndex
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

  if (message.action === 'updatePhase') {
    updatePhase(message.phaseIndex)
    console.log({newPhaseIndex: currentPhaseIndex})
  }
})