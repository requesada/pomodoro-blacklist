let round = 0

let phaseIndex = 0
const phase = ['work-counting', 'work-done', 'break-counting', 'break-done']

const currentRound = document.querySelector(`#round-${round}`)

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

const timerButton = document.querySelector('#timer-button')
const clickTimerButton = () => {
  if (timerButton.className === 'start-button') {
    timerButton.className = 'stop-button'
    timerButton.innerHTML = 'Stop'
    if (currentRound.className !== 'ready' && phaseIndex < phase.length - 1) {
      phaseIndex++
    }
    currentRound.className = phase[phaseIndex]
    timer(25)
  } else {
    timerButton.className = 'start-button'
    timerButton.innerHTML = 'Start'
    phaseIndex = 0
    resetTimer(25)
  }
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
      if (round === 3 && phaseIndex === phase.length - 1) {
        round = 0
        phaseIndex = 0
        document.querySelectorAll('div[id^="round-"]').forEach((node) => {node.className = 'ready'})
        resetTimer(25)
      } else if (phaseIndex === phase.length - 1) {
        round++
        phaseIndex = 0
        resetTimer(25)
      } else {
        phaseIndex++
        document.querySelector(`#round-${round}`).className = phase[phaseIndex]
        timerButton.className = 'start-button'
        timerButton.innerHTML = 'Start'
      }
    }
    console.log({round, phaseIndex})
  }

  intervalID = setInterval(subtractSecond, 1000)
}
