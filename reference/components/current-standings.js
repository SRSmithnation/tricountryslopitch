class CurrentStandingsTable extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this._renderPlaceholder();
        this._loadAndRender().catch(err => {
            console.error("current-standings: failed to load data", err);
            this._renderError();
        });
    }

    async _loadAndRender() {
        const dataSource = this.getAttribute("data-source");
        if (!dataSource) throw new Error("data-source attribute required");
        const csvText = await fetch(dataSource).then(r => { if (!r.ok) throw new Error(`failed to fetch ${dataSource}: ${r.status}`); return r.text(); });
        const data = this._parseCsvToTeamMap(csvText);

        this._shadow.innerHTML = "";
        this._shadow.appendChild(this._createStyles());
        this._shadow.appendChild(this._createTitle("Current Standings"));
        const entries = this._buildEntries(data);
        this._shadow.appendChild(this._renderTable(entries, data.__meta));
    }

    _renderPlaceholder() {
        this._shadow.innerHTML = "";
        const wrapper = document.createElement('div');
        wrapper.className = 'placeholder';
        wrapper.style.cssText = 'display:flex;align-items:center;justify-content:center;height:40px;width:100%;';
        const p = document.createElement('div');
        p.textContent = 'Loading standings...';
        p.className = 'placeholder-text';
        p.style.fontStyle = 'italic';
        wrapper.appendChild(p);
        this._shadow.appendChild(wrapper);
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
                margin-bottom:12px;
            }
            table {
                border-collapse: collapse;
                max-width:430px;
                margin: 0 auto;
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
            tr.incomplete td { background: #FFF2D8; }
            .warning { color: #B85C00; margin-left:6px; }
            table { border-top: 1px solid black; }
            th { font-weight: 700; height: 21px; border-top: 1px solid black; }
            .missing-details { text-align: center; margin-top: 8px; }
            .missing-details ul { display: inline-block; text-align: left; margin: 6px 0; padding-left: 1.1em; }
        `;
        return style;
    }

    _createTitle(text) {
        const span = document.createElement("span");
        span.className = "title";
        span.textContent = text;
        return span;
    }

    _parseCsvToTeamMap(text) {
        const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length < 3) return { __meta: {} };
        const dataRows = lines.slice(2);
        const teamMap = {};
        const meta = { anyMissing: false, missingDetails: [] };

        dataRows.forEach(line => {
            const cols = line.split(',');
            for (let i = 0; i < cols.length; i++) cols[i] = (cols[i] || '').trim();
            const teamName = cols[0] || '';
            if (!teamName) return;
            const wins = cols[1] !== undefined && cols[1] !== '' && !isNaN(cols[1]) ? Number(cols[1]) : 0;
            const losses = cols[2] !== undefined && cols[2] !== '' && !isNaN(cols[2]) ? Number(cols[2]) : 0;
            const missing = cols[3] || '';
            const pctNum = (wins + losses) ? (wins / (wins + losses)) : 0;
            const key = teamName;
            teamMap[key] = { key, teamName, wins, losses, pctNum, missing };
            if (missing) {
                meta.anyMissing = true;
                meta.missingDetails.push({ key, teamName, detail: missing });
            }
        });

        teamMap.__meta = meta;
        return teamMap;
    }

    _buildEntries(teamMap) {
        const entries = Object.keys(teamMap || {}).filter(k => k !== '__meta').map(key => {
            const t = teamMap[key];
            return {
                key,
                teamName: t.teamName,
                wins: Number(t.wins) || 0,
                losses: Number(t.losses) || 0,
                pctNum: Number(t.pctNum) || 0,
                missing: t.missing
            };
        });

        entries.sort((a, b) => {
            if (b.pctNum !== a.pctNum) return b.pctNum - a.pctNum;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return a.teamName.localeCompare(b.teamName);
        });

        let rank = 0;
        entries.forEach((e, idx) => {
            if (idx === 0) {
                rank = 1;
            } else {
                const prev = entries[idx - 1];
                if (e.pctNum === prev.pctNum && e.wins === prev.wins) {
                } else {
                    rank = idx + 1;
                }
            }
            e.rank = rank;
        });

        return entries;
    }

    _renderTable(entries, meta) {
        const table = document.createElement('table');
        const colGroup = document.createElement('colgroup');
        const col1 = document.createElement('col'); col1.className = 'rank';
        const col2 = document.createElement('col'); col2.className = 'team';
        const col3 = document.createElement('col'); col3.className = 'stat'; col3.span = 3;
        colGroup.append(col1, col2, col3);
        table.appendChild(colGroup);

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Rank', 'Team', 'Win', 'Loss', 'W/L'].forEach(txt => {
            const th = document.createElement('th'); th.textContent = txt; headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        const fragment = document.createDocumentFragment();

        // ⚠️
        const WARNING = '\u26A0\uFE0F';
        entries.forEach((e, idx) => {
            const tr = document.createElement('tr');
            if (e.missing) tr.classList.add('incomplete');

            const tdRank = document.createElement('td'); tdRank.textContent = e.rank || (idx + 1); tr.appendChild(tdRank);

            const tdTeam = document.createElement('td'); tdTeam.textContent = e.teamName;
            if (e.missing) {
                const s = document.createElement('span'); s.className = 'warning'; s.textContent = WARNING; s.title = e.missing || 'Missing score details'; tdTeam.appendChild(s);
            }
            tr.appendChild(tdTeam);

            const tdWins = document.createElement('td'); tdWins.textContent = e.wins; tr.appendChild(tdWins);
            const tdLoss = document.createElement('td'); tdLoss.textContent = e.losses; tr.appendChild(tdLoss);
            const tdPct = document.createElement('td'); tdPct.textContent = e.pctNum ? (e.pctNum * 100).toFixed(2) + '%' : '0.00%'; tr.appendChild(tdPct);

            fragment.appendChild(tr);
        });

        tbody.appendChild(fragment);
        table.appendChild(tbody);

        let anyMissing = meta && meta.anyMissing;
        if (meta && (anyMissing || (meta && Array.isArray(meta.dates) && meta.dates && meta.dates.length))) {
            const caption = table.createCaption(); caption.style.fontStyle = 'italic'; caption.style.fontSize = '0.9em';
            if (anyMissing) caption.textContent = 'Scores incomplete: see details below.';
        }

        if (meta && Array.isArray(meta.missingDetails) && meta.missingDetails.length) {
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'missing-details';
            const h = document.createElement('div'); h.style.fontWeight = '700'; h.textContent = 'Missing score details:'; detailsDiv.appendChild(h);
            const ul = document.createElement('ul');
            meta.missingDetails.forEach(m => {
                const li = document.createElement('li'); li.textContent = `${m.teamName}: ${m.detail}`; ul.appendChild(li);
            });
            detailsDiv.appendChild(ul);
            const container = document.createElement('div');
            container.appendChild(table);
            container.appendChild(detailsDiv);
            return container;
        }

        return table;
    }


}

customElements.define("current-standings", CurrentStandingsTable);
