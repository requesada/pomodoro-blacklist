class OliveCounter extends HTMLElement {
    constructor() {
        super()
        const shadowRoot = this.attachShadow({mode: 'open'})
        const template = document.createElement('template')
        template.innerHTML = `
            <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
            >
                <circle cx="12" cy="12" r="11px" stroke="#001011" stroke-width="1px" fill="#92DE91" />
                <circle cx="12" cy="12" r="4.5px" stroke="#001011" stroke-width="1px" fill="#F95738" />
            </svg>
        `
        shadowRoot.append(template.content.cloneNode(true))
    }
}

customElements.define('olive-counter', OliveCounter)