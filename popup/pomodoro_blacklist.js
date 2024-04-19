// TODO: Refactor to use browser.storage.local

// browser.storage.local.set({
//   test: 99,
//   alsoTest: 40
// })
// browser.storage.local.get('test').then((item) => console.log({test: item}))

const sounds = {
  volumeTestTone: new Audio('../audio/volume-test-tone.mp3'),
  workTimerDone: new Audio('../audio/work-timer-done.mp3'),
  breakTimerDone: new Audio('../audio/break-timer-done.mp3')
}

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

const taskOptionInput = document.querySelector('#task-option-input')
taskOptionInput.addEventListener('keyup', (event) => {
  if (event.target.value.replace(/\s/g, '').length  === 0) {
    document.querySelector('#countdown').className = 'no-task'
    document.querySelector('#task').className = 'no-task'
  } else {
    document.querySelector('#countdown').className = ''
    document.querySelector('#task').className = ''
    document.querySelector('#primary').innerText = event.target.value
    document.querySelector('#secondary').innerText = event.target.value
  }
})

document.querySelector('#clear-task').addEventListener('click', () => {
  document.querySelector('#countdown').className = 'no-task'
  document.querySelector('#task').className = 'no-task'
  document.querySelector('#primary').innerText = ''
  document.querySelector('#secondary').innerText = ''
  taskOptionInput.value = ''
})


// Initialize and add listeners
Object.entries(timerSettings).forEach(([key, {length, selector}]) => {
  const input = document.querySelector(selector)
  input.value = length
  input.addEventListener('change', (event) => {
    timerSettings[key].length = event.target.value < 0.5 ? timerSettings[key].length : Math.round(Number(event.target.value))
    event.target.value = timerSettings[key].length
  })
})

// Volume control behaviors
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

// Options
const toggleFlip = () => {
  document.querySelector('#device').classList.toggle('flip')
}

const optionsButton = document.querySelector('#options-button')
optionsButton.addEventListener('click', toggleFlip)

const optionsClose = document.querySelector('#options-close')
optionsClose.addEventListener('click', toggleFlip)

// Timer
let round = 0

let phaseIndex = 0
const phase = ['work-counting', 'work-done', 'break-counting', 'break-done']

const getCurrentRoundNode = () => document.querySelector(`#round-${round}`)

let intervalID
const resetTimer = (newMinutes) => {
  clearInterval(intervalID)
  document.querySelector('#countdown').innerText = `${String(newMinutes).padStart(2, '0')}:00`
}

const stopTimer = () => {
  phaseIndex = 0
  getCurrentRoundNode().className = 'ready'
  resetTimer(timerSettings.pomodoro.length)
}

const advance = () => {
  if (getCurrentRoundNode().className !== 'ready' && phaseIndex < phase.length - 1) {
    phaseIndex++
    getCurrentRoundNode().className = phase[phaseIndex]
  } else if (round < 3 && phaseIndex === phase.length - 1) {
    phaseIndex = 0
    round++
    getCurrentRoundNode().className = phase[phaseIndex]
  } else if (getCurrentRoundNode().className === 'ready') {
    getCurrentRoundNode().className = phase[phaseIndex] 
  } else if (round === 3 && phaseIndex === phase.length - 1) {
    round = 0
    phaseIndex = 0
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

const timer = () => {
  let startingMinutes
  if (round === 3 && phaseIndex === 2) {
    startingMinutes = timerSettings.longBreak.length
  } else if (phaseIndex === 2) {
    startingMinutes = timerSettings.shortBreak.length
  } else {
    startingMinutes = timerSettings.pomodoro.length
  }
  console.log({startingMinutes})
  let minutes = startingMinutes - 1
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

let urlList
listInput.addEventListener('input', (event) => {
  urlList = event.target.value.split('\n')
  console.log({urlList})
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