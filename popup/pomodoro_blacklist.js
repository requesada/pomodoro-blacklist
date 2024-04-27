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
      for (const [period, {length, selector}] of Object.entries(result.timerSettings)) {
        if (length && selector) {
          timerSettings[period].length = length
          document.querySelector(selector).value = length
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

for (const [period, {selector}] of Object.entries(timerSettings)) {
  if (selector) {
    document.querySelector(selector).addEventListener('change', (event) => {
      timerSettings[period].length = event.target.value < 0.5 ? timerSettings[period].length : Math.round(Number(event.target.value))
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

// TODO This will need state, function to manipulate
let currentTask = ''
const getCurrentTask = () => {
  browser.runtime.sendMessage({action: 'getTask'})
    .then(({task}) => {
      currentTask = task
      if (task) {
        document.querySelector('#countdown').className = ''
        document.querySelector('#task').className = ''
        document.querySelector('#primary').innerText = task
        document.querySelector('#secondary').innerText = task
      }
    })
}
const taskOptionInput = document.querySelector('#task-option-input')
taskOptionInput.addEventListener('change', (event) => {
  if (event.target.value.replace(/\s/g, '').length  === 0) {
    document.querySelector('#countdown').className = 'no-task'
    document.querySelector('#task').className = 'no-task'
    browser.runtime.sendMessage({
      action: 'updateTask',
      newTask: ''
    })
  } else {
    document.querySelector('#countdown').className = ''
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
  document.querySelector('#countdown').className = 'no-task'
  document.querySelector('#task').className = 'no-task'
  document.querySelector('#primary').innerText = ''
  document.querySelector('#secondary').innerText = ''
  taskOptionInput.value = ''
})


// TODO State, messages
const volumeControl = document.querySelector('#volume-slider');
volumeControl.addEventListener('input', () => {
  Object.values(sounds).forEach(sound => {
    sound.volume = volumeControl.value / 100;
  });
});

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


// Messages
const incrementPhaseIndex = (isIncrementing) => {
  if (isIncrementing) {
    phaseIndex++
  } else {
    phaseIndex = 0
  }
  browser.runtime.sendMessage({
    action: 'updatePhase', 
    phaseIndex
  })
}

const phase = ['work-counting', 'work-done', 'break-counting', 'break-done']

const getCurrentRoundNode = () => document.querySelector(`#round-${round}`)

let intervalID
const resetTimer = (newMinutes) => {
  clearInterval(intervalID)
  document.querySelector('#countdown').innerText = `${String(newMinutes).padStart(2, '0')}:00`
}

const stopTimer = () => {
  // phaseIndex = 0
  incrementPhaseIndex(false)
  getCurrentRoundNode().className = 'ready'
  resetTimer(timerSettings.pomodoro.length)
}

const advance = () => {
  if (getCurrentRoundNode().className !== 'ready' && phaseIndex < phase.length - 1) {
    // phaseIndex++
    incrementPhaseIndex(true)
    getCurrentRoundNode().className = phase[phaseIndex]
  } else if (round < 3 && phaseIndex === phase.length - 1) {
    // phaseIndex = 0
    incrementPhaseIndex(false)
    round++
    getCurrentRoundNode().className = phase[phaseIndex]
  } else if (getCurrentRoundNode().className === 'ready') {
    getCurrentRoundNode().className = phase[phaseIndex] 
  } else if (round === 3 && phaseIndex === phase.length - 1) {
    round = 0
    // phaseIndex = 0
    incrementPhaseIndex(false)
    document.querySelectorAll('div[id^="round-"]').forEach((node) => {node.className = 'ready'})
    document.querySelector('#round-0').className = phase[phaseIndex]
  }
}

const timerButton = document.querySelector('#timer-button')
const clickTimerButton = () => {
  if (timerButton.className === 'start-button') {
    timerButton.className = 'stop-button'
    timerButton.innerHTML = 'Stop'
    advance()
    timer()
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
}
document.addEventListener('DOMContentLoaded', initialize)