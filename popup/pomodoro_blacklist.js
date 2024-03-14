let round = 0
const phases = ['ready', 'counting', 'done']
const directives = ['work', 'break']

const state = [
  {phase: 'ready', directive: 'work'},
  {phase: 'ready', directive: 'work'},
  {phase: 'ready', directive: 'work'},
  {phase: 'ready', directive: 'work'}
]

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
