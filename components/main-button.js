class MainButton extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = `
            a {
                width: 180px;
                height: 45px;

                border-radius: 999px;

                font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
                font-weight: 550;
                font-size: x-large;
                color: #000;
                text-align: center;
                line-height: 45px;

                border: 1px solid #0f9a6a;

                background:
                    radial-gradient(closest-side at 50% 50%,
                        #c9f8e8 0%,
                        #a2f0ce 35%,
                        #5edfa8 60%,
                        #22c68e 80%,
                        #0f9a6a 100%);

                box-shadow:
                    inset 0 8px 14px rgba(255, 255, 255, 0.65),
                    inset 0 -6px 10px rgba(0, 0, 0, 0.20),
                    0 2px 6px rgba(0, 0, 0, 0.25);

                letter-spacing: 1px;

                display: inline-block;
                text-decoration: none;
                cursor: pointer;

                text-shadow: 0 1px 0 rgba(255, 255, 255, 0.15);
            }

            a:hover {
                filter: brightness(1.06);
            }

            a:focus {
                outline: 3px solid rgba(0, 153, 102, 0.45);
                outline-offset: 2px;
            }
        `
        const wrapper = document.createElement("span");
        wrapper.style.textAlign = "center";
        const link = document.createElement("a");

        let targetUrl = this.getAttribute("href") || "#";

        if (this.hasAttribute("cache-bust") && targetUrl !== "#") {
            try {
                const url = new URL(targetUrl, window.location.href);
                url.searchParams.set('v', Date.now());
                targetUrl = url.toString();
            } catch (e) {
                console.error("Invalid href provided to <main-button>", e);
            }
        }
        link.href = targetUrl;
        link.textContent = this.getAttribute("label") || "Button";

        shadow.appendChild(style);
        shadow.appendChild(wrapper);
        wrapper.appendChild(link);

    }
}

customElements.define("main-button", MainButton);
