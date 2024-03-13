const lightGreen = '#92DE91'
const richBlack = '#001011'

class OliveCounter extends HTMLElement {
    constructor() {
        super()
        const shadowRoot = this.attachShadow({mode: 'open'})
        const template = document.createElement('template')
        template.innerHTML = `
            <style>
                :host {
                    width: var(--oliveSize);
                    height: var(--oliveSize);
                    display: block;
                }
                svg {
                    width: 100%;
                    height: 100%;
                }
                #olive,
                #pimento {
                    cx: calc(var(--oliveSize) / 2);
                    cy: calc(var(--oliveSize) / 2);
                    stroke: var(--richBlack);
                    stroke-width: var(--oliveStrokes);
                }
                #olive {
                    fill: var(--oliveColor);
                    r: calc(var(--oliveSize) / 2 - var(--oliveStrokes));
                }
                #pimento {
                    fill: var(--pimentoColor);
                    r: calc(0.47 * var(--oliveSize) / 2 - var(--oliveStrokes));
                }
            </style>
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
                <circle id="olive" />
                <circle id="pimento" />
            </svg>
        `
        shadowRoot.append(template.content.cloneNode(true))
    }

    static get observedAttributes() {
        return ['test']
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(name, oldValue, newValue)
    }
}

customElements.define('olive-counter', OliveCounter)

const changeTestAttribute = (event) => {
    event.target.attributes.test.value = 'hi'
}
document.querySelector('#counter-0').addEventListener('click', changeTestAttribute)

const timer = (startingMinutes) => {
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

const clickStartButton = () => {
    const startButton = document.querySelector('#start-button')
    startButton.id = 'stop-button'
    startButton.innerHTML = 'Stop'
    timer(25)
}