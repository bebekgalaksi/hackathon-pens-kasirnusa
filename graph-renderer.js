// ===== Graph Renderer: Canvas-based interactive graph visualization =====

class GraphRenderer {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.highlightPath = options.highlightPath || [];
        this.filter = options.filter || 'all';
        this.animationFrame = null;
        this.hoveredNode = null;
        this.selectedNode = null;
        this.time = 0;
        this.dpr = window.devicePixelRatio || 1;

        // Scale canvas for retina
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.onClick(e));

        // Colors by type
        this.colors = {
            kasirnusa: '#6C63FF',
            contact: '#00D9FF',
            dm: '#FF6B9D',
            prospect: '#FFD93D',
            customer: '#36D399',
            org: '#FF9F43',
            deal: '#A78BFA',
            decision: '#FB923C',
            feature: '#34D399',
        };
    }

    setData(nodes, edges) {
        this.nodes = nodes.map((n, i) => ({
            ...n,
            x: n.x || 0,
            y: n.y || 0,
            vx: 0,
            vy: 0,
            radius: this.getNodeRadius(n),
            color: this.colors[n.type] || '#6C63FF',
        }));
        this.edges = edges.map(e => ({
            ...e,
            color: this.getEdgeColor(e),
        }));
    }

    getNodeRadius(node) {
        switch (node.type) {
            case 'dm': return 22;
            case 'kasirnusa': return 18;
            case 'prospect':
            case 'customer': return 24;
            case 'contact': return 16;
            default: return 14;
        }
    }

    getEdgeColor(edge) {
        switch (edge.type) {
            case 'strong': return 'rgba(108, 99, 255, 0.6)';
            case 'knows': return 'rgba(255, 107, 157, 0.6)';
            case 'works_at': return 'rgba(0, 217, 255, 0.3)';
            case 'worked_at': return 'rgba(255, 159, 67, 0.3)';
            case 'manages': return 'rgba(108, 99, 255, 0.3)';
            case 'medium': return 'rgba(0, 217, 255, 0.2)';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    }

    layoutForce(iterations = 80) {
        const w = this.width;
        const h = this.height;
        const nodes = this.nodes;
        const edges = this.edges;

        // Initial positions (spread out)
        nodes.forEach((n, i) => {
            if (!n.x || !n.y) {
                const angle = (i / nodes.length) * Math.PI * 2;
                const r = Math.min(w, h) * 0.3;
                n.x = w / 2 + Math.cos(angle) * r + (Math.random() - 0.5) * 60;
                n.y = h / 2 + Math.sin(angle) * r + (Math.random() - 0.5) * 60;
            }
        });

        const nodeMap = {};
        nodes.forEach(n => nodeMap[n.id] = n);

        for (let iter = 0; iter < iterations; iter++) {
            const alpha = 1 - iter / iterations;
            const repulsionStrength = 8000 * alpha;
            const attractionStrength = 0.02 * alpha;

            // Repulsion between all nodes
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[j].x - nodes[i].x;
                    const dy = nodes[j].y - nodes[i].y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = repulsionStrength / (dist * dist);
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    nodes[i].vx -= fx;
                    nodes[i].vy -= fy;
                    nodes[j].vx += fx;
                    nodes[j].vy += fy;
                }
            }

            // Attraction along edges
            edges.forEach(e => {
                const source = nodeMap[e.from];
                const target = nodeMap[e.to];
                if (!source || !target) return;
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const idealDist = 120;
                const force = (dist - idealDist) * attractionStrength;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                source.vx += fx;
                source.vy += fy;
                target.vx -= fx;
                target.vy -= fy;
            });

            // Center gravity
            nodes.forEach(n => {
                n.vx += (w / 2 - n.x) * 0.001 * alpha;
                n.vy += (h / 2 - n.y) * 0.001 * alpha;
            });

            // Apply velocities with damping
            nodes.forEach(n => {
                n.vx *= 0.85;
                n.vy *= 0.85;
                n.x += n.vx;
                n.y += n.vy;
                // Bounds
                const padding = 40;
                n.x = Math.max(padding, Math.min(w - padding, n.x));
                n.y = Math.max(padding, Math.min(h - padding, n.y));
            });
        }
    }

    layoutPreset(positions) {
        const nodeMap = {};
        this.nodes.forEach(n => nodeMap[n.id] = n);
        Object.entries(positions).forEach(([id, pos]) => {
            if (nodeMap[id]) {
                nodeMap[id].x = pos.x;
                nodeMap[id].y = pos.y;
            }
        });
    }

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        this.time += 0.02;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Draw edges
        this.edges.forEach(edge => {
            const source = this.nodes.find(n => n.id === edge.from);
            const target = this.nodes.find(n => n.id === edge.to);
            if (!source || !target) return;

            const isHighlighted = this.highlightPath.length > 0 &&
                this.highlightPath.includes(edge.from) &&
                this.highlightPath.includes(edge.to);

            ctx.beginPath();
            ctx.moveTo(source.x, source.y);
            ctx.lineTo(target.x, target.y);

            if (isHighlighted) {
                ctx.strokeStyle = edge.type === 'knows' ? '#FF6B9D' : '#6C63FF';
                ctx.lineWidth = 3;
                ctx.setLineDash([]);
                // Glow effect
                ctx.shadowColor = ctx.strokeStyle;
                ctx.shadowBlur = 10;
            } else if (edge.type === 'worked_at' || edge.type === 'reports_to') {
                ctx.strokeStyle = edge.color;
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.shadowBlur = 0;
            } else {
                ctx.strokeStyle = edge.color;
                ctx.lineWidth = edge.type === 'strong' || edge.type === 'knows' ? 2 : 1;
                ctx.setLineDash([]);
                ctx.shadowBlur = 0;
            }

            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;

            // Edge label
            if (isHighlighted || this.hoveredNode === source || this.hoveredNode === target) {
                const mx = (source.x + target.x) / 2;
                const my = (source.y + target.y) / 2;
                ctx.font = '500 9px Inter, sans-serif';
                ctx.fillStyle = isHighlighted ? '#e8e8f0' : '#9090b8';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                
                // Background for readability
                const text = edge.label || '';
                const tw = ctx.measureText(text).width;
                ctx.fillStyle = 'rgba(10, 10, 26, 0.8)';
                ctx.fillRect(mx - tw/2 - 4, my - 14, tw + 8, 14);
                ctx.fillStyle = isHighlighted ? '#e8e8f0' : '#9090b8';
                ctx.fillText(text, mx, my - 2);
            }

            // Arrow
            if (isHighlighted) {
                const angle = Math.atan2(target.y - source.y, target.x - source.x);
                const arrowDist = target.radius + 6;
                const ax = target.x - Math.cos(angle) * arrowDist;
                const ay = target.y - Math.sin(angle) * arrowDist;
                const arrowSize = 8;

                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(ax - arrowSize * Math.cos(angle - 0.4), ay - arrowSize * Math.sin(angle - 0.4));
                ctx.lineTo(ax - arrowSize * Math.cos(angle + 0.4), ay - arrowSize * Math.sin(angle + 0.4));
                ctx.closePath();
                ctx.fillStyle = edge.type === 'knows' ? '#FF6B9D' : '#6C63FF';
                ctx.fill();
            }
        });

        // Draw nodes
        this.nodes.forEach(node => {
            const isHighlighted = this.highlightPath.includes(node.id);
            const isHovered = this.hoveredNode === node;

            // Glow for highlighted/DM nodes
            if (isHighlighted || node.type === 'dm') {
                const glowRadius = node.radius + 8 + Math.sin(this.time * 2) * 3;
                const glow = ctx.createRadialGradient(node.x, node.y, node.radius, node.x, node.y, glowRadius);
                glow.addColorStop(0, node.color + '40');
                glow.addColorStop(1, node.color + '00');
                ctx.beginPath();
                ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();
            }

            // Node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            
            if (isHighlighted || isHovered) {
                ctx.fillStyle = node.color;
                ctx.shadowColor = node.color;
                ctx.shadowBlur = 15;
            } else {
                ctx.fillStyle = node.color + '80';
                ctx.shadowBlur = 0;
            }
            ctx.fill();
            ctx.shadowBlur = 0;

            // Border
            ctx.strokeStyle = isHighlighted ? '#fff' : node.color + '60';
            ctx.lineWidth = isHighlighted ? 2 : 1;
            ctx.stroke();

            // Label
            ctx.font = `${isHighlighted ? '600' : '500'} ${node.radius > 20 ? 10 : 9}px Inter, sans-serif`;
            ctx.fillStyle = isHighlighted ? '#ffffff' : '#d0d0e0';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Text wrapping for short labels
            const label = node.label;
            if (label.length > 12 && node.radius > 18) {
                const words = label.split(' ');
                const mid = Math.ceil(words.length / 2);
                ctx.fillText(words.slice(0, mid).join(' '), node.x, node.y - 5);
                ctx.fillText(words.slice(mid).join(' '), node.x, node.y + 7);
            } else {
                ctx.fillText(label, node.x, node.y);
            }

            // Role below node on hover
            if (isHovered || isHighlighted) {
                ctx.font = '400 8px Inter, sans-serif';
                ctx.fillStyle = '#9090b8';
                ctx.fillText(node.role, node.x, node.y + node.radius + 12);
            }
        });
    }

    animate() {
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.hoveredNode = null;
        for (const node of this.nodes) {
            const dx = x - node.x;
            const dy = y - node.y;
            if (dx * dx + dy * dy < node.radius * node.radius) {
                this.hoveredNode = node;
                this.canvas.style.cursor = 'pointer';
                break;
            }
        }
        if (!this.hoveredNode) {
            this.canvas.style.cursor = 'default';
        }
    }

    onClick(e) {
        if (this.hoveredNode) {
            this.selectedNode = this.hoveredNode;
            if (this.onNodeClick) {
                this.onNodeClick(this.selectedNode);
            }
        }
    }
}

window.GraphRenderer = GraphRenderer;
