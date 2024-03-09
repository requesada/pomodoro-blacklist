const lightGreen = '#92DE91'
const richBlack = '#001011'

class OliveCounter extends HTMLElement {
    constructor() {
        super()
        const shadowRoot = this.attachShadow({mode: 'open'})
        const template = document.createElement('template')
        template.innerHTML = `
            <style>
                svg {
                    width: var(--oliveSize);
                    height: var(--oliveSize);
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
            <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle 
                    id="olive"
                />
                <circle 
                    id="pimento"
                />
            </svg>
        `
        shadowRoot.append(template.content.cloneNode(true))
    }
}

customElements.define('olive-counter', OliveCounter)

const rootElement = document.querySelector(':root')
const setOliveFillGreen = () => {
    rootElement.style.setProperty('--oliveColor', lightGreen)
}
// setOliveFillGreen()