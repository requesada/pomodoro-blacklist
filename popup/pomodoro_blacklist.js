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
  const identifier = buttonParent.substring(0, spinnerIndex)
  const upButton = event.target.className.endsWith('up')
  const selector = `#${identifier}-length`
  const lengthDisplay = document.querySelector(selector)
  let currentValue = Number(lengthDisplay.innerText)
  let max
  let newValue

  const setting = identifier.includes('-') ? identifier.replace('b', 'B').split('-').join('') : identifier

  if (identifier === 'pomodoro') {
    max = 120
  } else if (identifier === 'short-break') {
    max = 15 
  } else {
    max = 60
  }
  if (upButton && currentValue !== max) {
    newValue = ++currentValue
  } else if (!upButton && currentValue !== 1) {
    newValue = --currentValue
  }
  lengthDisplay.innerText = String(newValue).padStart(2, '0')
  timerSettings[setting].length = newValue
  browser.storage.local.set({timerSettings})
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
spinnerButtons.forEach((button) => {
  button.addEventListener('mousedown', (event) => {
    changeLength(event)
    startLengthChangeInterval(event)
  })
  button.addEventListener('mouseup', stopButtonAction)
  button.addEventListener('mouseleave', stopButtonAction)
})

const restoreSavedSettings = () => {
  const setTimerSettings = (result) => {
    if (result.timerSettings) {
      for (const [setting, value] of Object.entries(result.timerSettings)) {
        if (value.length && value.selector) {
          timerSettings[setting].length = value.length
          document.querySelector(value.selector).innerText = String(value.length).padStart(2, '0')
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
    roundPhases.forEach((phaseClass, round) => {
      document.querySelector(`#round-${round}`).className = phaseClass
    })
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
  const setCurrentTimerState = (response) => {
    currentTimerState = response.timerState
    getStyles()
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
const getCurrentTask = () => {
  browser.runtime.sendMessage({action: 'getTask'})
    .then(({task}) => {
      currentTask = task
      if (task) {
        countdown.className = ''
        document.querySelector('#task').className = ''
        document.querySelector('#primary').innerText = task
        document.querySelector('#secondary').innerText = task
        taskOptionInput.value = task
      }
    })
}
const taskInput = document.querySelector('#task-input')
taskInput.addEventListener('change', (event) => {
  if (event.target.value.replace(/\s/g, '').length  === 0) {
    countdown.className = 'no-task'
    document.querySelector('#task').className = 'no-task'
    browser.runtime.sendMessage({
      action: 'updateTask',
      newTask: ''
    })
  } else {
    countdown.className = ''
    document.querySelector('#task').className = ''
    document.querySelector('#primary').innerText = event.target.value
    document.querySelector('#secondary').innerText = event.target.value
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
})

volumeControl.addEventListener('mousedown', () => {
  if (!testToneInterval) {
    testToneInterval = setInterval(() => {
      browser.runtime.sendMessage({
        action: 'playSound',
        sound: 'volumeTestTone'
      })
    }, 600) // TODO Tuned to this sound, prob change later
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
toggleFlip()

const optionsButton = document.querySelector('#options-button')
optionsButton.addEventListener('click', toggleFlip)

const optionsClose = document.querySelector('#options-close')
optionsClose.addEventListener('click', toggleFlip)

const resetButton = document.querySelector('#reset-button')
const resetButtonCircle = document.querySelector('#reset-button-circle')
let resetTimeout
resetButton.addEventListener('mousedown', () => {
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
  if (!currentTimerState.isRunning) {
    timerButton.className = 'stop-button'
    timerButton.innerHTML = 'Stop'
    browser.runtime.sendMessage({action: 'advance'})
    browser.runtime.sendMessage({action: 'startTimer'})
      .then(() => getStyles())
      .then(() => getTimerState())
  } else {
    timerButton.className = 'start-button'
    timerButton.innerHTML = 'Start'
    browser.runtime.sendMessage({action: 'stopTimer'})
      .then(() => getTimerState())
  }
}
timerButton.addEventListener('click', clickTimerButton)

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
    taskContainer.classList.toggle('hidden')
    listInput.classList.toggle('hidden')
    instructions.classList.toggle('hidden')
    moreText.classList.toggle('hidden')
    blacklist.classList.toggle('closing')
    browser.runtime.sendMessage({action: 'checkOpenTabs'})
  } else {
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
      case 'advance':
        advance()
        break

      case 'getStyles':
        getStyles()
        break

      case 'getTimerState':
        getTimerState()
        break
    
      case 'resetStart':
        timerButton.className = 'start-button'
        timerButton.innerHTML = 'Start'
        break
    
      case 'updateTime':
        countdown.innerText = message.time
        break
    }
  })

  browser.runtime.sendMessage({popupOpen: true})
}
document.addEventListener('DOMContentLoaded', initialize)

window.addEventListener('unload', () => {
  browser.runtime.sendMessage({popupOpen: false})
})