class PriorStandingsTable extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this._renderPlaceholder();
        this._loadAndRender().catch(err => {
            console.error("prior-standings-table: failed to load data", err);
            this._renderError();
        });
    }

    async _loadAndRender() {
        const dataSource = this.getAttribute("data-source");
        const seasonTitle = this.getAttribute("season-title") || "";

        if (!dataSource) throw new Error("data-source attribute required");

        const resp = await fetch(dataSource);
        if (!resp.ok) throw new Error(`failed to fetch ${dataSource}: ${resp.status}`);
        const data = await resp.json();

        this._shadow.innerHTML = "";
        this._shadow.appendChild(this._createStyles());
        this._shadow.appendChild(this._createTitle(seasonTitle));
        this._shadow.appendChild(this._createTable(data));
    }

    _renderPlaceholder() {
        this._shadow.innerHTML = "";
        const p = document.createElement("div");
        p.textContent = "Loading standings...";
        p.style.fontStyle = "italic";
        this._shadow.appendChild(p);
    }

    _renderError() {
        this._shadow.innerHTML = "";
        const p = document.createElement("div");
        p.textContent = "Failed to load past standings.";
        p.style.color = "red";
        this._shadow.appendChild(p);
    }

    _createStyles() {
        const style = document.createElement("style");
        style.textContent = `
            :host {
                display: block;
                text-align: center;
            }
            .title {
                font-family: Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif;
                display:block;
                margin-bottom:6px;
            }
            table {
                border-collapse: collapse;
                max-width:430px;
                margin: 0 auto;
                background: #FFFFC0;
                border-spacing: 0;
            }
            col.rank { width:64px; }
            col.team { width:174px; }
            col.stat { width:64px; }
            td, th {
                text-align:center;
                font-family: Calibri, sans-serif;
                font-size: 15px;
                border-left: 1px solid black;
                border-right:1px solid black;
                border-bottom:1px solid black;
                padding:2px 4px;
            }
            table { border-top: 1px solid black; }
            th { font-weight: 700; height: 21px; border-top: 1px solid black; }
        `;
        return style;
    }

    _createTitle(text) {
        const span = document.createElement("span");
        span.className = "title";
        span.textContent = text;
        return span;
    }

    _createTable(data) {
        const table = document.createElement("table");

        const colGroup = document.createElement("colgroup");
        const col1 = document.createElement("col"); col1.className = "rank";
        const col2 = document.createElement("col"); col2.className = "team";
        const col3 = document.createElement("col"); col3.className = "stat"; col3.span = 3;
        colGroup.append(col1, col2, col3);
        table.appendChild(colGroup);

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        ["Rank", "Team", "Win", "Loss", "Pct"].forEach(txt => {
            const th = document.createElement("th");
            th.textContent = txt;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        const fragment = document.createDocumentFragment();

        const keys = Object.keys(data || {});
        keys.forEach(key => {
            const team = data[key] || {};
            const wins = Number(team.wins) || 0;
            const losses = Number(team.losses) || 0;
            const pct = (wins + losses)
                ? ((100 * wins) / (wins + losses)).toFixed(2) + "%"
                : "0.00%";

            const tr = document.createElement("tr");
            const cols = [key, team.team_name || "", wins, losses, pct];
            cols.forEach(c => {
                const td = document.createElement("td");
                td.textContent = c;
                tr.appendChild(td);
            });
            fragment.appendChild(tr);
        });

        tbody.appendChild(fragment);
        table.appendChild(tbody);
        return table;
    }
}

customElements.define("prior-standings-table", PriorStandingsTable);
