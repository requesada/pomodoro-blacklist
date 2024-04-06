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

// Initialize and add listeners
Object.entries(timerSettings).forEach(([key, {length, selector}]) => {
  const input = document.querySelector(selector)
  input.value = length
  input.addEventListener('change', (event) => {
    timerSettings[key].length = event.target.value < 1 ? 1 : Math.round(Number(event.target.value))
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
document.querySelector('#device').classList.toggle('flip') // TODO: Remove
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
let startingMinutes = 25
const resetTimer = (newMinutes) => {
  clearInterval(intervalID)
  document.querySelector('#display').innerHTML = `${String(newMinutes).padStart(2, '0')}:00`
}

const stopTimer = () => {
  phaseIndex = 0
  getCurrentRoundNode().className = 'ready'
  resetTimer(25)
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
    timer(25)
  } else {
    timerButton.className = 'start-button'
    timerButton.innerHTML = 'Start'
    resetTimer(25)
  }
  advance()
}
timerButton.addEventListener('click', clickTimerButton)

const timer = () => {
  // let minutes = startingMinutes - 1
  let minutes = 0
  let seconds = 1

  const subtractSecond = () => {
    document.querySelector('#display').innerHTML = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
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
