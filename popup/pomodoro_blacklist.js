const countdown = document.querySelector('#countdown')

let currentTimerState

const sounds = {
  volumeTestTone: new Audio('../audio/volume-test-tone.mp3'),
  workTimerDone: new Audio('../audio/work-timer-done.mp3'),
  breakTimerDone: new Audio('../audio/break-timer-done.mp3')
}

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

const restoreSavedSettings = () => {
  const setTimerSettings = (result) => {
    if (result.timerSettings) {
      for (const [setting, value] of Object.entries(result.timerSettings)) {
        if (value.length && value.selector) {
          timerSettings[setting].length = value.length
          document.querySelector(value.selector).value = value.length
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

const getTimerState = () => {
  const setCurrentTimerState = (response) => {
    currentTimerState = response.timerState
  }
  const onError = () => {
    console.log(`Error getting timerState: ${error}`)
  }
  browser.runtime.sendMessage({
    action: 'getTimerState'
  })
    .then(setCurrentTimerState, onError)
}

for (const [setting, {selector}] of Object.entries(timerSettings)) {
  if (selector) {
    document.querySelector(selector).addEventListener('change', (event) => {
      timerSettings[setting].length = event.target.value < 0.5 ? timerSettings[setting].length : Math.round(Number(event.target.value))
      browser.storage.local.set({timerSettings})
    })
  }
}

// Object.entries(timerSettings).forEach(([key, {length, selector}]) => {
//   const input = document.querySelector(selector)
//   input.value = length
//   input.addEventListener('change', (event) => {
//     timerSettings[key].length = event.target.value < 0.5 ? timerSettings[key].length : Math.round(Number(event.target.value))
//     event.target.value = timerSettings[key].length
//   })
// })

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
const taskOptionInput = document.querySelector('#task-option-input')
taskOptionInput.addEventListener('change', (event) => {
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

document.querySelector('#clear-task').addEventListener('click', () => {
  countdown.className = 'no-task'
  document.querySelector('#task').className = 'no-task'
  document.querySelector('#primary').innerText = ''
  document.querySelector('#secondary').innerText = ''
  taskOptionInput.value = ''
  browser.runtime.sendMessage({
    action: 'updateTask',
    newTask: ''
  })
})


const volumeControl = document.querySelector('#volume-slider');
volumeControl.addEventListener('input', () => {
  Object.values(sounds).forEach(sound => {
    sound.volume = Number(volumeControl.value) / 100
  })
  timerSettings.volume = Number(volumeControl.value)
  browser.storage.local.set({timerSettings})
})

volumeControl.addEventListener('mousedown', () => {
  sounds.volumeTestTone.loop = true
  sounds.volumeTestTone.play()
})

volumeControl.addEventListener('mouseup', () => {
  sounds.volumeTestTone.pause()
  sounds.volumeTestTone.loop = false
  sounds.volumeTestTone.load()
})

const toggleFlip = () => {
  document.querySelector('#device').classList.toggle('flip')
}

const optionsButton = document.querySelector('#options-button')
optionsButton.addEventListener('click', toggleFlip)

const optionsClose = document.querySelector('#options-close')
optionsClose.addEventListener('click', toggleFlip)


// TODO I think much of this needs to be in background
const incrementPhaseIndex = (isIncrementing) => {
  if (isIncrementing) {
    currentTimerState.phaseIndex++
  } else {
    currentTimerState.phaseIndex = 0
  }
  browser.runtime.sendMessage({
    action: 'updatePhase', 
    phaseIndex: currentTimerState.phaseIndex
  })
}

const updateRound = (newRound) => {
  browser.runtime.sendMessage({
    action: 'updateRound',
    round: newRound
  })
}

const phase = ['work-counting', 'work-done', 'break-counting', 'break-done']

const getCurrentRoundNode = () => document.querySelector(`#round-${currentTimerState.round}`)

const resetTimer = (newMinutes) => {
  browser.runtime.sendMessage({action: 'clearInterval'})
  countdown.innerText = `${String(newMinutes).padStart(2, '0')}:00`
}

const stopTimer = () => {
  // phaseIndex = 0
  incrementPhaseIndex(false)
  getCurrentRoundNode().className = 'ready'
  resetTimer(timerSettings.pomodoro.length)
}

const advance = () => {
  if (getCurrentRoundNode().className !== 'ready' && currentTimerState.phaseIndex < phase.length - 1) {
    // phaseIndex++
    incrementPhaseIndex(true)
    getCurrentRoundNode().className = phase[currentTimerState.phaseIndex]
  } else if (currentTimerState.round < 3 && currentTimerState.phaseIndex === phase.length - 1) {
    // phaseIndex = 0
    incrementPhaseIndex(false)
    updateRound(currentTimerState.round++)
    getCurrentRoundNode().className = phase[currentTimerState.phaseIndex]
  } else if (getCurrentRoundNode().className === 'ready') {
    getCurrentRoundNode().className = phase[currentTimerState.phaseIndex] 
  } else if (currentTimerState.round === 3 && currentTimerState.phaseIndex === phase.length - 1) {
    updateRound(0)
    // phaseIndex = 0
    incrementPhaseIndex(false)
    document.querySelectorAll('div[id^="round-"]').forEach((node) => {node.className = 'ready'})
    document.querySelector('#round-0').className = phase[currentTimerState.phaseIndex]
  }
}

const startTimer = () => {
  browser.runtime.sendMessage({
    action: 'startTimer'
  })
}

const timerButton = document.querySelector('#timer-button')
const clickTimerButton = () => {
  if (timerButton.className === 'start-button') {
    timerButton.className = 'stop-button'
    timerButton.innerHTML = 'Stop'
    advance()
    startTimer()
  } else {
    timerButton.className = 'start-button'
    timerButton.innerHTML = 'Start'
    stopTimer()
  }
}
timerButton.addEventListener('click', clickTimerButton)

const blacklist = document.querySelector('#blacklist')
const blacklistMonitor = document.querySelector('#blacklist-monitor')
const arrowTab = document.querySelector('#arrow-tab')
const listInput = document.querySelector('#list-input')
const instructions = document.querySelector('#instructions')
const moreText = document.querySelector('#more-text')

blacklistMonitor.addEventListener('animationend', () => {
  if (blacklist.classList.contains('closing') && blacklist.classList.contains('expanded')) {
    blacklist.classList.toggle('closing')
    blacklist.classList.toggle('expanded')
  } else {
    listInput.classList.toggle('hidden')
    instructions.classList.toggle('hidden')
    moreText.classList.toggle('hidden')
    listInput.focus()
  }
})

arrowTab.addEventListener('click', () => {
  if (blacklist.classList.contains('expanded')) {
    listInput.classList.toggle('hidden')
    instructions.classList.toggle('hidden')
    moreText.classList.toggle('hidden')
    blacklist.classList.toggle('closing')
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

// TODO Deleting selected text instead of using backspace breaks arrows
listInput.addEventListener('scroll', () => {
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
})

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
  restoreSavedSettings()
  restoreSavedSites()
  getCurrentTask()
  getTimerState()

  browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'advance') {
      advance()
    }

    if (message.action === 'timeUp') {
      timerButton.className = 'start-button'
      timerButton.innerHTML = 'Start'
      sounds.workTimerDone.play()
    }

    if (message.action === 'updateTime') {
      countdown.innerText = message.time
    }
  })
}
document.addEventListener('DOMContentLoaded', initialize)