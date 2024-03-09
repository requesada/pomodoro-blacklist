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
                    fill: var(--lightGreen);
                    r: calc(var(--oliveSize) / 2 - var(--oliveStrokes));
                }
                #pimento {
                    fill: var(--tomato);
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