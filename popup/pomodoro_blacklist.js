let round = 0

let phaseIndex = 0
const phase = ['work-counting', 'work-done', 'break-counting', 'break-done']

const currentRoundNode = document.querySelector(`#round-${round}`)

let intervalID
let startingMinutes = 25
const resetTimer = (newMinutes) => {
  clearInterval(intervalID)
  document.querySelector('#display').innerHTML = `${String(newMinutes).padStart(2, '0')}:00`
}

const stopTimer = () => {
  phaseIndex = 0
  resetTimer(25)
}

const advance = () => {
  if (currentRoundNode.className !== 'ready' && phaseIndex < phase.length - 1) {
    phaseIndex++
    currentRoundNode.className = phase[phaseIndex]
  } else if (round < 3 && phaseIndex === phase.length - 1) {
    phaseIndex = 0
    round++
  } else if (currentRoundNode.className === 'ready') {
    currentRoundNode.className = phase[phaseIndex] 
  } else if (round === 3 && phaseIndex === phase.length - 1) {
    round = 0
    phaseIndex = 0
    document.querySelectorAll('div[id^="round-"]').forEach((node) => {node.className = 'ready'})
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
  let seconds = 2

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
    console.log({round, phaseIndex})
  }

  intervalID = setInterval(subtractSecond, 1000)
}
