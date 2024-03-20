// Audio code
const AudioContext = window.AudioContext || window.webkitAudioContext
const audioContext = new AudioContext()

const oscillator = audioContext.createOscillator()
const gainNode = audioContext.createGain()

oscillator.connect(gainNode)
gainNode.connect(audioContext.destination)

oscillator.frequency.value = 200
oscillator.start()
gainNode.gain.value = 0.5

const volumeSlider = document.querySelector('#volume-slider')
volumeSlider.addEventListener('mousedown', () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
})

volumeSlider.addEventListener('mouseup', () => {
  if (audioContext.state === 'running') {
    audioContext.suspend()
  }
})

volumeSlider.addEventListener('input', () => {
  gainNode.gain.value = volumeSlider.value / 100
})

// Timer code
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
    }
  }

  intervalID = setInterval(subtractSecond, 1000)
}
