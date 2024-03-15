let round = 0

let phaseIndex = 0
const phase = ['ready', 'counting', 'done']

let directiveIndex = 0
const directive = ['work', 'break']

const incrementRound = () => {
  if (round < 3) {
    round++
  } else {
    round = 0
  }
}

const incrementPhase = () => {
  if (phaseIndex < phase.length - 1) {
    phaseIndex++
  } else {
    phaseIndex = 0
  }
}

const incrementDirective = () => {
  directiveIndex = directiveIndex === 0 ? 1 : 0
}

const timer = (startingMinutes, setTime) => {
  if (setTime) {
    document.querySelector('#display').innerHTML = `${String(startingMinutes).padStart(2, '0')}:00`
  } else {
    let minutes = startingMinutes - 1
    let seconds = 59
    let intervalID

    const subtractSecond = () => {
      document.querySelector('#display').innerHTML = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      if (seconds === 0 && minutes > 0) {
        minutes--
        seconds = 59
      } else if (seconds > 0) {
        seconds--
      } else {
        clearInterval(intervalID)
      }
    }

    intervalID = setInterval(subtractSecond, 1000)
  }
}

const clickStartButton = () => {
  const startButton = document.querySelector('#start-button')
  startButton.id = 'stop-button'
  startButton.innerHTML = 'Stop'
  timer(25)
}
