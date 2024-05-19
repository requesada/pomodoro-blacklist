const audioPath = '../../assets/audio'
const buttonSounds = {
  monitorOpen: new Audio(`${audioPath}/monitor-open.mp3`),
  monitorClose: new Audio(`${audioPath}/monitor-close.mp3`),
  optionsMousedown: new Audio(`${audioPath}/opt-mousedown.mp3`),
  optionsMouseup: new Audio(`${audioPath}/opt-mouseup.mp3`),
  reset: new Audio(`${audioPath}/reset.mp3`),
  spinnerMousedown: new Audio(`${audioPath}/spinner-mousedown.mp3`),
  spinnerMouseup: new Audio(`${audioPath}/spinner-mouseup.mp3`),
  timerIn: new Audio(`${audioPath}/timer-in.mp3`),
  timerMid: new Audio(`${audioPath}/timer-mid.mp3`),
  timerOut: new Audio(`${audioPath}/timer-out.mp3`)
}

const playSound = (sound) => {
  if (!sound.paused) {
    sound.pause()
    sound.currentTime = 0
  }
  sound.play()
}

const countdown = document.querySelector('#countdown')

let currentTimerState

const timerSettings = {
  pomodoro: {
    length: 25,
    selector: '#pomodoro-length'
  },
  shortBreak: {
    length: 5,
    selector: '#short-break-length'
  },
  longBreak: {
    length: 15,
    selector: '#long-break-length'
  },
  volume: 50
}

const changeLength = (event) => {
  const buttonParent = event.target.parentElement.id
  const spinnerIndex = buttonParent.indexOf('-spinner')
  const identifier = buttonParent.slice(0, Math.max(0, spinnerIndex))
  const upButton = event.target.className.endsWith('up')
  const selector = `#${identifier}-length`
  const lengthDisplay = document.querySelector(selector)
  let currentValue = Number(lengthDisplay.textContent)
  let max
  let newValue

  const setting = identifier.includes('-') ? identifier.replace('b', 'B').split('-').join('') : identifier

  const updateAndStore = () => {
  lengthDisplay.textContent = String(newValue).padStart(2, '0')
  timerSettings[setting].length = newValue
  browser.storage.local.set({timerSettings})
    .then(() => {
      browser.runtime.sendMessage({
        action: 'updateTimerSettingLengths',
        newLength: {[setting]: newValue}
      })
    })
    .then(() => {
      if (!currentTimerState.isRunning) {
        browser.runtime.sendMessage({action: 'setTime'})
      }
    })
  }

  if (identifier === 'pomodoro') {
    max = 90
  } else if (identifier === 'short-break') {
    max = 15 
  } else {
    max = 45
  }
  if (upButton && currentValue < max) {
    newValue = currentValue + 1
    updateAndStore()
  } else if (!upButton && currentValue > 1) {
    newValue = currentValue - 1
    updateAndStore()
  }
}

let lengthChangeInterval
let changeRate = 500
const accelerationFactor = 0.9

const startLengthChangeInterval = (event) => {
  if (lengthChangeInterval) clearInterval(lengthChangeInterval)
  lengthChangeInterval = setInterval(() => {
    changeLength(event)
    changeRate *= accelerationFactor
    changeRate = Math.max(changeRate, 50)
    clearInterval(lengthChangeInterval)
    startLengthChangeInterval(event)
  }, changeRate)
}

const stopButtonAction = () => {
  clearInterval(lengthChangeInterval)
  lengthChangeInterval = undefined
  changeRate = 500
}

const spinnerButtons = document.querySelectorAll('button[class^="spinner-"]')
for (const button of spinnerButtons) {
  button.addEventListener('mousedown', (event) => {
    playSound(buttonSounds.spinnerMousedown)
    changeLength(event)
    startLengthChangeInterval(event)
  })
  button.addEventListener('mouseup', () => {
    playSound(buttonSounds.spinnerMouseup)
    stopButtonAction()
  })
}

const restoreSavedSettings = () => {
  const setTimerSettings = (result) => {
    if (result.timerSettings) {
      for (const [setting, value] of Object.entries(result.timerSettings)) {
        if (value.length > 0 && value.selector) {
          timerSettings[setting].length = value.length
          document.querySelector(value.selector).textContent = String(value.length).padStart(2, '0')
        } else {
          timerSettings[setting] = value
          volumeControl.value = value
        }
      }
    }
  }
  const onError = (error) => {
    console.log(`Error retrieving timer settings: ${error}`)
  }
  browser.storage.local.get('timerSettings')
    .then(setTimerSettings, onError)
}

const restoreSavedSites = () => {
  const setCurrentSites = (result) => {
    listInput.value = result.blockedSites ? result.blockedSites.join('\n') : ''
  }
  const onError = (error) => {
    console.log(`Error retrieving sites: ${error}`)
  }
  browser.storage.local.get('blockedSites')
    .then(setCurrentSites, onError)
}

const getStyles = () => {
  const applyStyles = (response) => {
    const {roundPhases} = response
    for (const [round, phaseClass] of roundPhases.entries()) {
      document.querySelector(`#round-${round}`).className = phaseClass
    }
  }
  const onError = (error) => {
    console.log(`Couldn't get phases: ${error}`)
  }
  browser.runtime.sendMessage({
    action: 'getPhases'
  })
    .then(applyStyles, onError)
}

const getTimerState = () => {
  const setCurrentTimerState = ({timerState}) => {
    currentTimerState = timerState
    getStyles()
    if (!timerState.isRunning) {
      browser.runtime.sendMessage({action: 'setTime'})
    }
  }
  const onError = () => {
    console.log(`Error getting timerState: ${error}`)
  }
  browser.runtime.sendMessage({
    action: 'getTimerState'
  })
    .then(setCurrentTimerState, onError)
}

let currentTask = ''
const taskInput = document.querySelector('#task-input')
const getCurrentTask = () => {
  browser.runtime.sendMessage({action: 'getTask'})
    .then(({task}) => {
      currentTask = task
      if (task) {
        countdown.className = ''
        document.querySelector('#task').className = ''
        document.querySelector('#primary').textContent = task
        document.querySelector('#secondary').textContent = task
        taskInput.value = task
      }
    })
}
taskInput.addEventListener('change', (event) => {
  if (event.target.value.replaceAll(/\s/g, '').length  === 0) {
    countdown.className = 'no-task'
    document.querySelector('#task').className = 'no-task'
    browser.runtime.sendMessage({
      action: 'updateTask',
      newTask: ''
    })
  } else {
    countdown.className = ''
    document.querySelector('#task').className = ''
    document.querySelector('#primary').textContent = event.target.value
    document.querySelector('#secondary').textContent = event.target.value
    browser.runtime.sendMessage({
      action: 'updateTask',
      newTask: event.target.value
    })
  }
})

let testToneInterval
const volumeControl = document.querySelector('#volume-slider')
volumeControl.addEventListener('input', () => {
  browser.runtime.sendMessage({
    action: 'updateVolume',
    volume: Number(volumeControl.value) / 100
  })
  timerSettings.volume = Number(volumeControl.value)
  for (const sound of Object.values(buttonSounds)) {
    sound.volume = Number(volumeControl.value) / 100
  }
})

volumeControl.addEventListener('mousedown', () => {
  if (!testToneInterval) {
    browser.runtime.sendMessage({
      action: 'playSound',
      sound: 'volumeTestTone'
    })
    testToneInterval = setInterval(() => {
      browser.runtime.sendMessage({
        action: 'playSound',
        sound: 'volumeTestTone'
      })
    }, 600)
  }
})

volumeControl.addEventListener('mouseup', () => {
  clearInterval(testToneInterval)
  testToneInterval = undefined
  browser.storage.local.set({timerSettings})
})

const toggleFlip = () => {
  document.querySelector('#device').classList.toggle('flip')
}

const optionsButton = document.querySelector('#options-button')
optionsButton.addEventListener('click', toggleFlip)
optionsButton.addEventListener('mousedown', () => {
  playSound(buttonSounds.optionsMousedown)
})
optionsButton.addEventListener('mouseup', () => {
  playSound(buttonSounds.optionsMouseup)
})

const optionsClose = document.querySelector('#options-close')
optionsClose.addEventListener('click', toggleFlip)
optionsClose.addEventListener('mousedown', () => {
  playSound(buttonSounds.optionsMousedown)
})
optionsClose.addEventListener('mouseup', () => {
  playSound(buttonSounds.optionsMouseup)
})

const resetButton = document.querySelector('#reset-button')
const resetButtonCircle = document.querySelector('#reset-button-circle')
let resetTimeout
resetButton.addEventListener('mousedown', () => {
  buttonSounds.reset.play()
  resetButtonCircle.classList.add('resetting')
  if (!resetTimeout) {
    resetTimeout = setTimeout(() => {
      browser.runtime.sendMessage({action: 'reset'})
        .then(() => {
          getStyles()
          getTimerState()
        })
      clearTimeout(resetTimeout)
      resetTimeout = undefined
      resetButtonCircle.classList.remove('resetting')
      resetButtonCircle.classList.add('post-reset')
    }, 3000)
  }
})
resetButton.addEventListener('mouseup', () => {
  buttonSounds.reset.pause()
  buttonSounds.reset.currentTime = 0
  resetButtonCircle.classList.remove('resetting')
  if (resetTimeout) {
    clearTimeout(resetTimeout)
    resetTimeout = undefined
  }
})
resetButtonCircle.addEventListener('animationend', (event) => {
  if (event.animationName === 'resetShrink') {
    resetButtonCircle.classList.remove('post-reset');
  }
});

const getCurrentRoundNode = () => document.querySelector(`#round-${currentTimerState.round}`)

const timerButton = document.querySelector('#timer-button')
const clickTimerButton = () => {
  if (currentTimerState.isRunning) {
    timerButton.className = 'start-button'
    timerButton.innerHTML = 'Start'
    browser.runtime.sendMessage({action: 'stopTimer'})
      .then(() => getTimerState())
  } else {
    timerButton.className = 'stop-button'
    timerButton.innerHTML = 'Stop'
    browser.runtime.sendMessage({action: 'advance'})
    browser.runtime.sendMessage({action: 'startTimer'})
      .then(() => getStyles())
      .then(() => getTimerState())
  }
}
timerButton.addEventListener('click', clickTimerButton)
timerButton.addEventListener('mousedown', () => {
  if (timerButton.innerHTML === 'Start') {
    playSound(buttonSounds.timerIn)
  } else {
    playSound(buttonSounds.timerMid)
  }
})
timerButton.addEventListener('mouseup', () => {
  if (timerButton.innerHTML === 'Stop') {
    playSound(buttonSounds.timerOut)
  } else {
    playSound(buttonSounds.timerMid)
  }
})

const blacklist = document.querySelector('#blacklist')
const blacklistMonitor = document.querySelector('#blacklist-monitor')
const arrowTab = document.querySelector('#arrow-tab')
const taskContainer = document.querySelector('#task-container')
const listInput = document.querySelector('#list-input')
const instructions = document.querySelector('#instructions')
const moreText = document.querySelector('#more-text')

blacklistMonitor.addEventListener('animationend', () => {
  if (blacklist.classList.contains('closing') && blacklist.classList.contains('expanded')) {
    blacklist.classList.toggle('closing')
    blacklist.classList.toggle('expanded')
  } else {
    taskContainer.classList.toggle('hidden')
    listInput.classList.toggle('hidden')
    instructions.classList.toggle('hidden')
    moreText.classList.toggle('hidden')
    listInput.focus()
  }
})

arrowTab.addEventListener('click', () => {
  if (blacklist.classList.contains('expanded')) {
    playSound(buttonSounds.monitorClose)
    taskContainer.classList.toggle('hidden')
    listInput.classList.toggle('hidden')
    instructions.classList.toggle('hidden')
    moreText.classList.toggle('hidden')
    blacklist.classList.toggle('closing')
    browser.runtime.sendMessage({action: 'checkOpenTabs'})
  } else {
    playSound(buttonSounds.monitorOpen)
    blacklist.classList.toggle('expanded')
  }
})

const moreAbove = document.querySelector('#more-above')
const moreBelow = document.querySelector('#more-below')

moreAbove.addEventListener('click', () => {
  if (!moreAbove.classList.contains('inactive')) {
    listInput.scrollBy(0, -96)
  }
})
moreBelow.addEventListener('click', () => {
  if (!moreBelow.classList.contains('inactive')) {
    listInput.scrollBy(0, 96)
  }
})

const listListener = () => {
  if (listInput.scrollTop > 0) {
    moreAbove.classList.remove('inactive')
  } else {
    moreAbove.classList.add('inactive')
  }

  if (listInput.offsetHeight + listInput.scrollTop === listInput.scrollHeight) {
    moreBelow.classList.add('inactive')
  } else if (listInput.scrollHeight > listInput.clientHeight) {
    moreBelow.classList.remove('inactive')
  }
}
listInput.addEventListener('scroll', listListener)
listInput.addEventListener('change', listListener)

const saveSites = (event) => {
  const blockedSites = event.target.value.split('\n').map((siteString) => siteString.trim()).filter(Boolean)
  browser.storage.local.set({blockedSites})
  browser.runtime.sendMessage({
    action: 'updateSites', 
    sites: blockedSites
  })
}

listInput.addEventListener('input', saveSites)

const initialize = () => {
  getStyles()
  restoreSavedSettings()
  restoreSavedSites()
  getCurrentTask()
  getTimerState()

  browser.runtime.onMessage.addListener((message) => {
    switch (message.action) {
      case 'advance': {
        advance()
        break
      }

      case 'getStyles': {
        getStyles()
        break
      }

      case 'getTimerState': {
        getTimerState()
        break
      }
    
      case 'resetStart': {
        timerButton.className = 'start-button'
        timerButton.innerHTML = 'Start'
        break
      }
    
      case 'updateTime': {
        countdown.textContent = message.time
        break
      }
    }
  })

  browser.runtime.sendMessage({popupOpen: true})
}
document.addEventListener('DOMContentLoaded', initialize)

window.addEventListener('unload', () => {
  browser.runtime.sendMessage({popupOpen: false})
})