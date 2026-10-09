// ===== App Logic: Tab switching, graph initialization, interactive path finder, and query engine =====

let p01Renderer = null;
let p04Renderer = null;
let fullRenderer = null;

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initStats();
    initGraphs();
    initFilters();
    initInteractivePathFinder();
});

// ===== Tab Navigation =====
function initTabs() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tabName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.toggle('active', section.id === `tab-${tabName}`);
    });

    // Initialize graph when tab is shown
    if (tabName === 'p01') initP01Graph();
    if (tabName === 'p04') initP04Graph();
    if (tabName === 'graph') initFullGraph();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.switchTab = switchTab;

// ===== Toast Notification System =====
function showToast(message, icon = '✓') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span style="color: var(--accent-cyan); font-size: 1.1rem;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-fadeout');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.showToast = showToast;

// ===== Copy Draft to Clipboard =====
function copyDraft(elementId) {
    let text = '';
    const el = document.getElementById(elementId);
    if (el) {
        text = el.innerText || el.textContent;
    } else {
        text = elementId;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Draft pesan berhasil disalin ke clipboard!', '📋');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast('Draft pesan berhasil disalin ke clipboard!', '📋');
    } catch (e) {
        showToast('Gagal menyalin draft otomatis', '⚠️');
    }
    document.body.removeChild(ta);
}

window.copyDraft = copyDraft;

// ===== Animated Stats =====
function initStats() {
    const data = GRAPH_DATA;
    const targets = {
        'stat-nodes': data.nodes.length,
        'stat-edges': data.edges.length,
        'stat-paths': Object.keys(data.paths).length,
    };

    Object.entries(targets).forEach(([id, target]) => {
        const el = document.querySelector(`#${id} .stat-number`);
        if (!el) return;
        animateCounter(el, 0, target, 1200);
    });
}

function animateCounter(el, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * ease);
        el.textContent = current;
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}

// ===== Graph Initializations =====
function initGraphs() {
    initP01Graph();
}

function initP01Graph() {
    if (p01Renderer) {
        p01Renderer.stop();
    }

    const data = GRAPH_DATA;
    const p01Nodes = data.nodes.filter(n =>
        ['E03','E06','K017','K089','K052','P01','C01','DL-001','D-2025-11','FEAT-07'].includes(n.id)
    );
    const p01Edges = data.edges.filter(e =>
        p01Nodes.some(n => n.id === e.from) && p01Nodes.some(n => n.id === e.to)
    );

    p01Renderer = new GraphRenderer('p01-graph', {
        highlightPath: ['E03', 'K017', 'K089'],
    });

    p01Renderer.setData(p01Nodes, p01Edges);

    // Preset positions for clean presentation
    const positions = {
        'E03': { x: 120, y: 150 },
        'E06': { x: 120, y: 350 },
        'K017': { x: 380, y: 150 },
        'K052': { x: 380, y: 350 },
        'C01': { x: 250, y: 50 },
        'K089': { x: 620, y: 200 },
        'P01': { x: 780, y: 250 },
        'DL-001': { x: 550, y: 380 },
        'D-2025-11': { x: 120, y: 40 },
        'FEAT-07': { x: 380, y: 40 },
    };

    p01Nodes.forEach(n => {
        if (positions[n.id]) {
            n.x = positions[n.id].x;
            n.y = positions[n.id].y;
            n.vx = 0;
            n.vy = 0;
        }
    });

    p01Renderer.animate();
}

function initP04Graph() {
    if (p04Renderer) {
        p04Renderer.stop();
    }

    const data = GRAPH_DATA;
    const p04Nodes = data.nodes.filter(n =>
        ['E04','E06','K116','K028','K065','P04','C06','ORG_SENTOSA','DL-004'].includes(n.id)
    );
    const p04Edges = data.edges.filter(e =>
        p04Nodes.some(n => n.id === e.from) && p04Nodes.some(n => n.id === e.to)
    );

    p04Renderer = new GraphRenderer('p04-graph', {
        highlightPath: ['E04', 'K116', 'K028'],
    });

    p04Renderer.setData(p04Nodes, p04Edges);

    const positions = {
        'E04': { x: 120, y: 160 },
        'E06': { x: 120, y: 350 },
        'K116': { x: 360, y: 160 },
        'ORG_SENTOSA': { x: 480, y: 60 },
        'C06': { x: 260, y: 60 },
        'K028': { x: 620, y: 160 },
        'K065': { x: 360, y: 350 },
        'P04': { x: 780, y: 250 },
        'DL-004': { x: 550, y: 380 },
    };

    p04Nodes.forEach(n => {
        if (positions[n.id]) {
            n.x = positions[n.id].x;
            n.y = positions[n.id].y;
            n.vx = 0;
            n.vy = 0;
        }
    });

    p04Renderer.animate();
}

function initFullGraph() {
    if (fullRenderer) {
        fullRenderer.stop();
    }

    const data = GRAPH_DATA;

    fullRenderer = new GraphRenderer('full-graph', {
        highlightPath: [],
    });

    fullRenderer.setData(data.nodes, data.edges);
    fullRenderer.layoutForce(150);

    fullRenderer.onNodeClick = (node) => {
        const panel = document.getElementById('node-detail');
        if (!panel) return;

        // Find connected edges
        const connected = data.edges.filter(e => e.from === node.id || e.to === node.id);
        const connectedNodes = connected.map(e => {
            const otherId = e.from === node.id ? e.to : e.from;
            const other = data.nodes.find(n => n.id === otherId);
            return { edge: e, node: other };
        }).filter(c => c.node);

        panel.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <h3 style="color: ${fullRenderer.colors[node.type] || '#fff'}; font-size: 1.1rem; margin-bottom: 4px;">${node.label}</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem;">${node.role}</p>
                <span style="display: inline-block; padding: 2px 8px; background: ${(fullRenderer.colors[node.type] || '#fff')}20; color: ${fullRenderer.colors[node.type] || '#fff'}; border-radius: 4px; font-size: 0.7rem; font-weight: 600; margin-top: 4px;">${node.type.toUpperCase()}</span>
            </div>
            <h4 style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Koneksi Langsung (${connectedNodes.length})</h4>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 220px; overflow-y: auto;">
                ${connectedNodes.map(c => `
                    <div style="padding: 0.5rem; background: rgba(0,0,0,0.25); border-radius: 6px; font-size: 0.8rem; border-left: 2px solid ${fullRenderer.colors[c.node.type] || '#fff'};">
                        <span style="color: ${fullRenderer.colors[c.node.type] || '#fff'}; font-weight: 600;">${c.node.label}</span>
                        <span style="color: var(--text-muted);"> — ${c.edge.label}</span>
                        ${c.edge.evidence ? `<br><span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-purple);">[${c.edge.evidence.join(', ')}]</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    };

    fullRenderer.animate();
}

function initFilters() {
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            const filter = chip.dataset.filter;
            if (fullRenderer) {
                if (filter === 'all') {
                    fullRenderer.highlightPath = [];
                } else {
                    const matchingIds = GRAPH_DATA.nodes
                        .filter(n => {
                            if (filter === 'kasirnusa') return n.type === 'kasirnusa';
                            if (filter === 'prospect') return n.type === 'prospect' || n.type === 'dm';
                            if (filter === 'customer') return n.type === 'customer';
                            if (filter === 'contact') return n.type === 'contact';
                            return true;
                        })
                        .map(n => n.id);
                    fullRenderer.highlightPath = matchingIds;
                }
            }
        });
    });
}

// ===== Interactive Path Finder Engine (BFS Shortest Path) =====
function initInteractivePathFinder() {
    const sourceSelect = document.getElementById('finder-source');
    const targetSelect = document.getElementById('finder-target');
    if (!sourceSelect || !targetSelect) return;

    const sources = [
        { id: 'E03', label: 'Sari Puspita (Account Manager C01, C03)' },
        { id: 'E04', label: 'Wahyu Nugroho (Account Manager C06 Saiyo)' },
        { id: 'E06', label: 'Bagus Prakoso (Sales Executive P01 & P04)' },
        { id: 'E07', label: 'Citra Ayuningtyas (Sales Executive P02)' },
        { id: 'E08', label: 'Doni Saputra (Sales Executive P03)' },
        { id: 'E01', label: 'Andi Wiratama (VP Sales)' },
        { id: 'K116', label: 'Budi Santoso (CFO Saiyo Group C06)' },
        { id: 'K056', label: 'Michael Tanoto (Dirut C01 Kopi Lintas)' }
    ];

    const targets = [
        { id: 'K017', label: 'Rina Hapsari (GM Operations P01 / ex-C01)' },
        { id: 'K089', label: 'Steven Wijaya (Direktur Utama P01)' },
        { id: 'K028', label: 'Hartono Gunawan (Direktur Utama P04)' },
        { id: 'K065', label: 'Yuli Astuti (Purchasing Manager P04)' },
        { id: 'K076', label: 'Teddy Kurniawan (Pemilik Teras Kafe P02)' },
        { id: 'K114', label: 'Hanif Maulana (Direktur Klinik Pratama P03)' },
        { id: 'K049', label: 'Ratna Dewi (Kepala Apotek P03)' },
        { id: 'P01', label: 'Grup Ritel Mandala (Akun P01)' },
        { id: 'P04', label: 'Nirwana Hotel & Resto (Akun P04)' }
    ];

    sourceSelect.innerHTML = sources.map(s => `<option value="${s.id}">${s.label}</option>`).join('');
    targetSelect.innerHTML = targets.map(t => `<option value="${t.id}">${t.label}</option>`).join('');

    // Pre-select Sari -> Rina
    sourceSelect.value = 'E03';
    targetSelect.value = 'K017';
}

function runInteractivePathFinder() {
    const sourceId = document.getElementById('finder-source')?.value;
    const targetId = document.getElementById('finder-target')?.value;
    const resultBox = document.getElementById('finder-result-box');
    if (!sourceId || !targetId || !resultBox) return;

    const result = findShortestPath(sourceId, targetId);

    if (!result || result.path.length === 0) {
        resultBox.innerHTML = `
            <div style="padding: 1rem; background: rgba(255, 107, 157, 0.1); border: 1px solid var(--accent-pink); border-radius: var(--radius-md);">
                <p style="color: var(--accent-pink); font-weight: 600;">Tidak ditemukan jalur langsung antar kedua entitas dalam graph.</p>
            </div>
        `;
        return;
    }

    const nodeObjects = result.path.map(id => GRAPH_DATA.nodes.find(n => n.id === id) || { id, label: id, type: 'node', role: '' });
    const score = calculatePathScore(result.edges);

    let pathVisualHtml = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 10px;">
            <div>
                <span style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Jalur Ditemukan (${result.path.length - 1} Hops)</span>
                <h4 style="font-size: 1.1rem; color: var(--text-primary); margin-top: 2px;">${nodeObjects[0].label} ➔ ${nodeObjects[nodeObjects.length - 1].label}</h4>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; background: rgba(108, 99, 255, 0.15); border: 1px solid var(--accent-purple); padding: 6px 14px; border-radius: var(--radius-md);">
                <span style="font-size: 0.8rem; color: var(--text-secondary);">Kekuatan Relasi:</span>
                <span style="font-size: 1.2rem; font-weight: 800; color: ${score >= 8 ? 'var(--accent-green)' : score >= 6 ? 'var(--accent-yellow)' : 'var(--accent-pink)'};">${score}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">/10</span>
            </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; overflow-x: auto; padding: 12px 6px 16px 6px; margin-bottom: 1.25rem;">
    `;

    for (let i = 0; i < nodeObjects.length; i++) {
        const n = nodeObjects[i];
        const color = getNodeColor(n.type);
        pathVisualHtml += `
            <div style="flex-shrink: 0; background: var(--bg-card); border: 2px solid ${color}; padding: 10px 14px; border-radius: var(--radius-md); text-align: center; min-width: 130px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                <div style="font-weight: 700; font-size: 0.9rem; color: #fff;">${n.label}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 3px;">${n.role || n.type}</div>
            </div>
        `;
        if (i < result.edges.length) {
            const edge = result.edges[i];
            pathVisualHtml += `
                <div style="flex-shrink: 0; display: flex; flex-direction: column; align-items: center; padding: 0 4px;">
                    <span style="font-size: 0.7rem; color: var(--accent-cyan); font-weight: 500; max-width: 140px; text-align: center; line-height: 1.2; margin-bottom: 2px;">${edge.label}</span>
                    <span style="color: var(--accent-purple); font-size: 1.1rem; font-weight: bold;">➔</span>
                </div>
            `;
        }
    }

    pathVisualHtml += `</div>`;

    // Strategy & Recommendation based on endpoints
    let strategyHtml = generatePathStrategy(sourceId, targetId, nodeObjects);

    resultBox.innerHTML = `
        <div class="finder-result">
            ${pathVisualHtml}
            ${strategyHtml}
        </div>
    `;

    // Highlight on full graph if available
    if (fullRenderer) {
        fullRenderer.highlightPath = result.path;
    }
}

window.runInteractivePathFinder = runInteractivePathFinder;

function findShortestPath(startId, targetId) {
    if (startId === targetId) return { path: [startId], edges: [] };

    // Build adjacency list (undirected for relationship discovery)
    const adj = {};
    GRAPH_DATA.nodes.forEach(n => { adj[n.id] = []; });

    GRAPH_DATA.edges.forEach(e => {
        if (!adj[e.from]) adj[e.from] = [];
        if (!adj[e.to]) adj[e.to] = [];
        adj[e.from].push({ neighbor: e.to, edge: e });
        adj[e.to].push({ neighbor: e.from, edge: e });
    });

    // BFS
    const queue = [[startId]];
    const edgeQueue = [[]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
        const path = queue.shift();
        const edgePath = edgeQueue.shift();
        const current = path[path.length - 1];

        if (current === targetId) {
            return { path, edges: edgePath };
        }

        const neighbors = adj[current] || [];
        for (const { neighbor, edge } of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push([...path, neighbor]);
                edgeQueue.push([...edgePath, edge]);
            }
        }
    }

    return null;
}

function calculatePathScore(edges) {
    if (!edges || edges.length === 0) return 5.0;
    let total = 0;
    edges.forEach(e => {
        total += (e.weight || 6);
    });
    const avg = total / edges.length;
    // Length penalty: 1 hop = direct, 2 hops = good, 3+ hops slightly diluted
    const lengthPenalty = Math.max(0, (edges.length - 1) * 0.4);
    return Math.max(4.0, Math.min(9.8, (avg - lengthPenalty))).toFixed(1);
}

function getNodeColor(type) {
    switch (type) {
        case 'kasirnusa': return '#6C63FF';
        case 'dm': return '#FF6B9D';
        case 'prospect': return '#FFD93D';
        case 'customer': return '#36D399';
        case 'org': return '#FF9F43';
        case 'contact': return '#00D9FF';
        case 'deal': return '#A020F0';
        default: return '#6C63FF';
    }
}

function generatePathStrategy(sourceId, targetId, nodes) {
    if ((sourceId === 'E03' && targetId === 'K017') || (sourceId === 'E03' && targetId === 'K089')) {
        return `
            <div style="background: rgba(108, 99, 255, 0.1); border-left: 3px solid var(--accent-purple); padding: 12px 16px; border-radius: var(--radius-sm); font-size: 0.88rem;">
                <h5 style="color: var(--accent-purple); font-weight: 700; margin-bottom: 4px;">🎯 Strategi Outreach Utama:</h5>
                <p>Sari Puspita (AM) memiliki ikatan profesional 3+ tahun dengan Rina Hapsari di C01 (13 interaksi positif). Rina kini menjadi GM Operations di P01 dan memegang wewenang penuh pengadaan sistem kasir 60 gerai (I0343). Hubungi Rina secara personal memberi selamat atas jabatan barunya, lalu tawarkan sesi demo eksekutif bersama Bagus Prakoso (Sales).</p>
            </div>
        `;
    }

    if ((sourceId === 'E04' && targetId === 'K028') || (sourceId === 'K116' && targetId === 'K028')) {
        return `
            <div style="background: rgba(0, 217, 255, 0.1); border-left: 3px solid var(--accent-cyan); padding: 12px 16px; border-radius: var(--radius-sm); font-size: 0.88rem;">
                <h5 style="color: var(--accent-cyan); font-weight: 700; margin-bottom: 4px;">🎯 Strategi Outreach Utama:</h5>
                <p>Budi Santoso (CFO Saiyo Group C06) dan Hartono Gunawan (Dirut P04) pernah bekerja bersama selama 5 tahun (2015–2019) di PT Sentosa Abadi Group. Karena Hartono memblokir deal P04 dengan syarat minta referensi dari pelaku usaha sejenis (I0335), Wahyu Nugroho (AM C06) meminta kesediaan Budi memberikan referensi rekanan.</p>
            </div>
        `;
    }

    if (sourceId === 'E06' && targetId === 'K017') {
        return `
            <div style="background: rgba(255, 217, 61, 0.1); border-left: 3px solid var(--accent-yellow); padding: 12px 16px; border-radius: var(--radius-sm); font-size: 0.88rem;">
                <h5 style="color: var(--accent-yellow); font-weight: 700; margin-bottom: 4px;">🎯 Rekomendasi Kolaborasi Sales-CS:</h5>
                <p>Bagus Prakoso (Sales P01) sebaiknya tidak mendekati Rina sendirian secara cold outreach. Libatkan Sari Puspita (AM C01) untuk melakukan warm introduction via email/telepon ke Rina terlebih dahulu.</p>
            </div>
        `;
    }

    return `
        <div style="background: rgba(54, 211, 153, 0.1); border-left: 3px solid var(--accent-green); padding: 12px 16px; border-radius: var(--radius-sm); font-size: 0.88rem;">
            <h5 style="color: var(--accent-green); font-weight: 700; margin-bottom: 4px;">🎯 Analisis Jalur Relasi:</h5>
            <p>Jalur menghubungkan ${nodes[0].label} menuju ${nodes[nodes.length - 1].label} melalui perantara ${nodes.slice(1, -1).map(n => n.label).join(' ➔ ') || 'langsung'}. Manfaatkan hubungan perantara ini untuk membangun kredibilitas dan mempercepat proses persetujuan komersial.</p>
        </div>
    `;
}

// ===== Query Engine =====
function runQuery(queryId) {
    const answer = GRAPH_DATA.queryAnswers[queryId];
    if (!answer) return;

    const resultEl = document.getElementById('query-result');
    resultEl.innerHTML = `
        <div class="query-answer" style="animation: fadeIn 0.4s ease;">
            <h3>${answer.title}</h3>
            <div class="answer-path">${answer.path}</div>
            ${answer.explanation}
        </div>
    `;

    // Highlight the preset button
    document.querySelectorAll('.query-preset').forEach(btn => {
        btn.style.borderColor = '';
    });
    const clickedBtn = document.querySelector(`[onclick="runQuery('${queryId}')"]`);
    if (clickedBtn) {
        clickedBtn.style.borderColor = 'var(--accent-purple)';
    }

    // Scroll smoothly to answer
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

window.runQuery = runQuery;

function runCustomQuery() {
    const input = document.getElementById('query-input');
    const query = input.value.trim().toLowerCase();
    if (!query) return;

    const resultEl = document.getElementById('query-result');

    // Route table with keyword weighting
    const routes = [
        { keywords: ['p01', 'mandala', 'rina', 'steven', 'fajar', '60 outlet', 'ritel'], queryId: 'path_p01' },
        { keywords: ['p04', 'nirwana', 'hartono', 'yuli', 'budi', 'hotel', 'hospitality', '35 outlet'], queryId: 'path_p04' },
        { keywords: ['sentosa', 'abadi', 'kolega', 'riwayat', 'kerja', 'employment', 'saling kenal', 'kenal'], queryId: 'who_knows_who' },
        { keywords: ['lintas', 'track', 'cross', 'bonus', 'customer success', 'advocacy'], queryId: 'cross_track' },
        { keywords: ['diskon', 'preseden', 'harga', 'volume', 'd-2025-11', 'd-2025-02', 'd-2025-06', '20%', '15%'], queryId: 'precedent' },
        { keywords: ['risiko', 'risk', 'feat-07', 'integrasi', 'akuntansi', 'accurate', 'janji'], queryId: 'risk_p01' },
        { keywords: ['decision maker', 'pembuat keputusan', 'tim 2', 'siapa memutuskan', 'dm', 'stakeholder'], queryId: 'tim2_dm' },
        { keywords: ['akselerasi', 'acceleration', 'prioritas', 'pipeline', 'tim 4', 'langkah berikutnya'], queryId: 'tim4_accel' },
        { keywords: ['ekspansi', 'expansion', 'c06', 'saiyo', 'jakarta', 'tim 5', 'peluang'], queryId: 'tim5_expansion' },
        { keywords: ['churn', 'berisiko', 'retensi', 'c01', 'c02', 'c03', 'warning', 'tim 1', 'bahaya'], queryId: 'tim1_churn' },
    ];

    let matched = null;
    let bestScore = 0;

    routes.forEach(route => {
        const score = route.keywords.reduce((sum, kw) => sum + (query.includes(kw) ? 1 : 0), 0);
        if (score > bestScore) {
            bestScore = score;
            matched = route.queryId;
        }
    });

    if (matched && bestScore > 0) {
        runQuery(matched);
    } else {
        // Universal entity search fallback
        const queryTerms = query.split(' ').filter(t => t.length > 2);
        const matchedNodes = GRAPH_DATA.nodes.filter(n => {
            const str = `${n.id} ${n.label} ${n.role} ${n.type}`.toLowerCase();
            return queryTerms.some(term => str.includes(term));
        });

        if (matchedNodes.length > 0) {
            const firstNode = matchedNodes[0];
            const connectedEdges = GRAPH_DATA.edges.filter(e => e.from === firstNode.id || e.to === firstNode.id);

            resultEl.innerHTML = `
                <div class="query-answer" style="animation: fadeIn 0.4s ease;">
                    <h3>🔍 Hasil Analisis Entitas: ${firstNode.label}</h3>
                    <div class="answer-path">${firstNode.id} · ${firstNode.role} (${firstNode.type.toUpperCase()})</div>
                    <p>Ditemukan dalam context graph dengan <strong>${connectedEdges.length} relasi langsung</strong>:</p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        ${connectedEdges.slice(0, 5).map(e => {
                            const otherId = e.from === firstNode.id ? e.to : e.from;
                            const other = GRAPH_DATA.nodes.find(n => n.id === otherId);
                            return `<li><strong>${e.label}</strong> ➔ ${other ? other.label : otherId} ${e.evidence ? `<span class="evidence-tag">${e.evidence.join(', ')}</span>` : ''}</li>`;
                        }).join('')}
                    </ul>
                    <p style="margin-top: 10px; font-size: 0.88rem; color: var(--text-secondary);">
                        💡 Untuk analisis jalur strategis ke decision maker, gunakan dropdown <strong>Interactive Path Finder</strong> di atas atau pilih salah satu preset query utama.
                    </p>
                </div>
            `;
        } else {
            resultEl.innerHTML = `
                <div class="query-answer">
                    <h3>🔍 Pencarian: "${input.value}"</h3>
                    <p>Pertanyaan ini tidak cocok langsung dengan kata kunci umum. Silakan pilih salah satu dari <strong>10 preset pertanyaan utama hackathon</strong> di atas, atau masukkan kata kunci seperti: <strong>P01, P04, Mandala, Nirwana, Hartono, Budi, Rina, Diskon, Churn, Lintas Track, atau Preseden</strong>.</p>
                </div>
            `;
        }
    }

    input.value = '';
}

window.runCustomQuery = runCustomQuery;

// Enter key for query
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement?.id === 'query-input') {
        runCustomQuery();
    }
});
