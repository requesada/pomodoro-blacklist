const admonishments = [
  'No', 
  'Stop it', 
  'Get back to work', 
  'Absolutely not',
  'Stay on task',
  'Stop wasting time',
  'Snap out of it',
  'Quit procrastinating',
  'Time to focus'
]
const selection = `${admonishments[Math.floor(Math.random() * admonishments.length)]} `

document.title = selection.trim()
const div = document.querySelector('#go-back')

let duration = 1000
const minimumDuration = 1
const decreaseFactor = 0.98

pasteSelection = () => {
  div.textContent += selection
  duration = Math.max(minimumDuration, duration * decreaseFactor)

  if (div.scrollHeight > 1.1 * window.innerHeight) return

  setTimeout(pasteSelection, duration)
}

pasteSelection()
