class TeamTable extends HTMLElement {
    async connectedCallback() {
        const src = this.getAttribute("data-source");
        if (!src) return console.error("TeamTable: data-source attribute required");

        let data;
        try {
            const res = await fetch(src);
            data = await res.json();
        } catch (e) {
            console.error("TeamTable: failed to load data", e);
            return;
        }

        const shadow = this.attachShadow({ mode: "open" });

        shadow.appendChild(this._createStyles());
        shadow.appendChild(this._createTitle());
        shadow.appendChild(this._createTable(data));
    }

    _createStyles() {
        const style = document.createElement("style");
        style.textContent = `
            :host {
                text-align: center;
                font-family: Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif; 
            }
            .team-list-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: .25rem .5rem;
                max-width: 448px;
                font-family: Arial, sans-serif;
                font-size: 13px;
                background: BurlyWood;
                border: 2px solid black;
                box-sizing: border-box;
                margin: 1rem auto;
                padding: .2rem 1rem;
                text-align: left;
            }
            .team-cell { white-space: nowrap; }
        `;
        return style;
    }

    _createTitle() {
        const title = document.createElement("div");
        title.textContent = "Teams 2026-2027";
        return title;
    }

    _createTable(data) {
        const teamContainer = document.createElement("div");
        teamContainer.className = "team-list-container";

        const entries = Object.keys(data)
            .map(Number)
            .sort((a, b) => a - b)
            .map(n => [n, data[n]]);

        const half = Math.ceil(entries.length / 2);
        for (let i = 0; i < half; i++) {
            const left = entries[i];
            const right = entries[i + half];

            const leftDiv = document.createElement("div");
            leftDiv.className = "team-cell";
            leftDiv.innerHTML = left ? `${left[0]} &nbsp;&nbsp;&nbsp;${left[1]}` : "";
            teamContainer.appendChild(leftDiv);

            const rightDiv = document.createElement("div");
            rightDiv.className = "team-cell";
            rightDiv.innerHTML = right ? `${right[0]} &nbsp;&nbsp;&nbsp;${right[1]}` : "";
            teamContainer.appendChild(rightDiv);
        }

        return teamContainer;
    }
}

customElements.define("team-table", TeamTable);
