// Timer values
let pomodoroLength = 25
let shortBreakLength = 5
let longBreakLength = 15
// TODO: Force whole numbers on inputs

// Init
const pomodoroLengthInput = document.querySelector('#pomodoro-length')
pomodoroLengthInput.value = pomodoroLength

const shortBreakLengthInput = document.querySelector('#short-break-length')
shortBreakLengthInput.value =  shortBreakLength

const longBreakLengthInput = document.querySelector('#long-break-length')
longBreakLengthInput.value = longBreakLength

const checkValues = () => {
  console.log({
    pomodoroLength,
    shortBreakLength,
    longBreakLength
  })
}

pomodoroLengthInput.addEventListener('change', (event) => {
  pomodoroLength = Number(event.target.value)
  checkValues()
})
shortBreakLengthInput.addEventListener('change', (event) => {
  shortBreakLength = Number(event.target.value)
  checkValues()
})
longBreakLengthInput.addEventListener('change', (event) => {
 longBreakLength = Number(event.target.value)
 checkValues()
})



// Audio
const volumeTestTone = new Audio('../audio/volume-test-tone.mp3')
const workTimerDone = new Audio('../audio/work-timer-done.mp3')
const breakTimerDone = new Audio('../audio/break-timer-done.mp3')

volumeTestTone.addEventListener('play', () => {
  console.log('Audio playing...')
})

volumeTestTone.addEventListener('ended', () => {
  console.log('Audio ended.')
})

const volumeSlider = document.querySelector('#volume-slider')
volumeSlider.addEventListener('mousedown', () => {
  volumeTestTone.loop = true
  volumeTestTone.play()
})

volumeSlider.addEventListener('mouseup', () => {
  volumeTestTone.pause()
  volumeTestTone.loop = false
  volumeTestTone.load()
})

volumeSlider.addEventListener('input', () => {
  // TODO: Set volume for all audio
  volumeTestTone.volume = volumeSlider.value / 100
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
      workTimerDone.play()
    }
  }

  intervalID = setInterval(subtractSecond, 1000)
}
