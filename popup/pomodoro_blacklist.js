let round = 0

let phaseIndex = 0
const phase = ['work-counting', 'work-done', 'break-counting', 'break-done']

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

const getCurrentPlace = () => {
  return document.querySelector(`#round-${round}`).className
}


const timer = () => {
  let minutes = startingMinutes - 1
  let seconds = 59

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
        resetTimer(25)
      } else if (phaseIndex === phase.length - 1) {
        round++
        phaseIndex = 0
        resetTimer(25)
      } else {
        phaseIndex++
      }
    }
  }

  intervalID = setInterval(subtractSecond, 1000)
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
}
timerButton.addEventListener('click', clickTimerButton)
