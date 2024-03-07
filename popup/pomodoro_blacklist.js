const template = document.createElement('template')
template.innerHTML = `
    <style>
        span {color: red}
    </style>
    <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
    >
        <slot></slot>
    </svg>
`

class OliveCounter extends HTMLElement {
    constructor() {
        super()
        const shadow = this.attachShadow({mode: 'open'})
        shadow.append(template.content.cloneNode(true))
    }
}

customElements.define('olive-counter', OliveCounter)