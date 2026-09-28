class SubpageTitle extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });
        const title = this.getAttribute("data-title");
        if (!title) {
            console.error("data-title not specified for SubpageTitle");
            return;
        }
        const div = document.createElement("div");
        div.style.backgroundImage = "url('./images9054COB9.gif')";
        div.style.textAlign = "center";
        div.style.fontFamily = 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif';
        const websiteTitle = document.createElement("span");
        websiteTitle.style.fontWeight = "bold";
        websiteTitle.style.fontSize = "xx-large";
        websiteTitle.style.fontStyle = "italic";
        websiteTitle.textContent = "Kitchener Co-ed Volleyball League";
        const homeLink = document.createElement("a");
        homeLink.style.fontWeight = "bolder";
        homeLink.style.fontStyle = "italic";
        homeLink.style.fontSize = "medium";
        homeLink.href = "./index.html";
        homeLink.textContent = "home";

        const divisionTitle = document.createElement("span");
        divisionTitle.textContent = title;
        divisionTitle.style.fontStyle = "italic";
        divisionTitle.style.fontSize = "xx-large";

        div.appendChild(document.createElement("br"));
        div.appendChild(document.createElement("br"));
        div.appendChild(websiteTitle);
        div.appendChild(document.createElement("br"));
        div.appendChild(document.createElement("br"));
        div.appendChild(homeLink);
        div.appendChild(document.createElement("br"));
        div.appendChild(divisionTitle);
        shadow.appendChild(div);
    }
}

customElements.define("subpage-title", SubpageTitle);
