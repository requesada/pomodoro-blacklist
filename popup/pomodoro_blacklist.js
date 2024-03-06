class OliveCounter extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = "Hi, I'm custom"
    }
}

customElements.define('olive-counter', OliveCounter)