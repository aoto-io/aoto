import { layoutPoints, layoutProgram, NODE_SURROUND, type DrawNode, type Program, type Selection } from "./layout/program";

export interface Dragging {
    id: string;
    type: 'node' | 'point',
    pos: { x: number; y: number; };
}

export const BORDER_COLOR = '#BBB';

export class ProgramCanvas {
    private canvas: HTMLCanvasElement;
    private container: HTMLElement;
    private ctx: CanvasRenderingContext2D;
    private scale: number = 16;
    private dpr: number = 1;
    private observer: ResizeObserver;
    private program: Program;
    private size = { width: 0, height: 0 };
    private viewport = { x: 0, y: 0, w: 0, h: 0 };
    private selection: Selection = { nodes: [] };
    private dragging: Dragging | false = false;
    private connectTo: { x: number; y: number };

    constructor(container: HTMLElement) {
        this.dpr = window.devicePixelRatio;
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            this.resize(entry.contentRect.width, entry.contentRect.height);
        })
        this.observer.observe(this.container);
        this.container.appendChild(this.canvas);
        this.bindEvents();
    }

    private bindEvents() {
        this.canvas.addEventListener('wheel', this.onWheel);
        this.canvas.addEventListener('contextmenu', this.onContextMenu);
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        this.canvas.addEventListener('mousemove', this.onMouseMove);
        this.canvas.addEventListener('mouseup', this.onMouseUp);
    }

    private onMouseDown = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const world = this.screenToWorld(mouseX, mouseY);
        const hittest = this.hittest(world);
        if (!hittest) {
            this.selection.nodes = []
            this.dragging = false;
            this.connectTo = null;
            this.redraw();
            return;
        }
        const {type, node, point} = hittest;
        if (type === 'node') {
            this.selection.nodes = [
                { id: node.id }
            ]
            this.dragging = { id: node.id, type: 'node', pos: { x: -world.x + node.rect.x, y: -world.y + node.rect.y } };
        } else if (type === 'point') {
            this.dragging = { id: node.id, type: 'point', pos: { x: point.connect.x, y: point.connect.y } };
        }
        this.redraw();
    }

    private onMouseUp = () => {
        this.dragging = false;
        this.connectTo = null;
        this.redraw();
    }

    private onMouseMove = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const world = this.screenToWorld(mouseX, mouseY);
        if (this.dragging) {
            const { type } = this.dragging;
            if (type === 'node') {
                const node = this.findNode(this.dragging.id);
                node.rect.x = Math.round(this.dragging.pos.x + world.x);
                node.rect.y = Math.round(this.dragging.pos.y + world.y);
            } else if (type === 'point') {
                this.connectTo = world;
                this.canvas.style.cursor = 'default'
            }
            this.redraw();
            return;
        }
        const hittest = this.hittest(world);
        if (hittest) {
            this.canvas.style.cursor = hittest.type === 'point' ? 'crosshair' : 'pointer'
        } else {
            this.canvas.style.cursor = 'default'
        }
    }

    private findNode(id: string) {
        return this.program.nodes.find((item) => item.id === id);
    }

    private hittest(world: { x: number, y: number }) {
        for (const node of this.program.nodes) {
            const { x, y, w, h } = node.rect;
            const sur = NODE_SURROUND;
            const points = layoutPoints(node);
            for (const point of points) {
                if (
                    world.x >= point.x - point.radius && 
                    world.x <= point.x + point.radius &&
                    world.y >= point.y - point.radius &&
                    world.y <= point.y + point.radius
                ) {
                    return {
                        type: 'point',
                        node,
                        point
                    }
                }
            }
            
            const inNode = world.x >= x - sur && world.x <= x + w + sur * 2 && world.y >= y - sur && world.y <= y + h + sur * 2;
            if (inNode) {
                return { 
                    type: 'node',
                    node
                }
            }
        }
    }

    private onContextMenu = (e: PointerEvent) => {
        e.preventDefault();
    }

    private onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (e.ctrlKey || e.metaKey) {
            const world = this.screenToWorld(mouseX, mouseY);
            const scaleRatio = 0.5;
            const newScale = this.scale - e.deltaY * scaleRatio;
            const clampedScale = Math.max(5, Math.min(newScale, 60));
            this.scale = clampedScale;
            this.viewport.w = this.size.width / this.scale;
            this.viewport.h = this.size.height / this.scale;
            this.viewport.x = world.x - mouseX / this.scale;
            this.viewport.y = world.y - mouseY / this.scale;
        } else {
            this.viewport.x += e.deltaX / this.scale;
            this.viewport.y += e.deltaY / this.scale;
        }
        this.redraw();
    }

    dispose() {
        this.observer.disconnect();
        this.container.removeChild(this.canvas);
        this.canvas.removeEventListener('wheel', this.onWheel);
        this.canvas.removeEventListener('contextmenu', this.onContextMenu);
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.canvas.removeEventListener('mouseup', this.onMouseUp);
    }

    private redraw() {
        this.ctx.save()
        this.ctx.clearRect(0, 0, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
        this.ctx.scale(this.scale * this.dpr, this.scale * this.dpr);
        this.drawBackground();
        this.drawGridLines();
        this.drawProgram();
        this.drawConnectTo();
        this.ctx.restore();
    }

    private drawConnectTo() {
        if (!this.dragging || !this.connectTo) {
            return;
        }
        const from = this.worldToScreen(this.dragging.pos.x, this.dragging.pos.y);
        const to = this.worldToScreen(this.connectTo.x, this.connectTo.y);
        const xCtrl = (from.x + to.x) / 2;
        this.ctx.save();
        this.ctx.lineWidth = 0.1;
        this.ctx.strokeStyle = '#6f6f6f';
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.bezierCurveTo(xCtrl, from.y, xCtrl, to.y, to.x, to.y);
        this.ctx.stroke();
        this.ctx.beginPath();

        const triWidth = 0.3;
        const triHeight = triWidth / 1.2;
        const xOffset = 0.05;
        const triangleX = to.x + xOffset;
        this.ctx.fillStyle = '#6f6f6f';
        this.ctx.moveTo(triangleX - triWidth, to.y - triHeight);
        this.ctx.lineTo(triangleX - triWidth, to.y + triHeight);
        this.ctx.lineTo(triangleX, to.y);
        this.ctx.fill();

        this.ctx.restore();
    }

    private drawBackground() {
        this.ctx.save();
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.fillRect(0, 0, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
        this.ctx.restore();
    }
    
    private drawProgram() {
        this.ctx.save()
        const layout = layoutProgram(this.program, this.selection);
        layout.nodes.forEach((node) => {
            this.drawProgramNode(node);
        });
        this.ctx.restore();
    }

    private drawGridLines() {
        const fromX = Math.floor(this.viewport.x) - this.viewport.x;
        const toX = Math.floor(this.viewport.x + this.viewport.w) - this.viewport.x;
        const fromY = Math.floor(this.viewport.y) - this.viewport.y;
        const toY = Math.floor(this.viewport.y + this.viewport.h) - this.viewport.y;

        this.ctx.save();
        const point = 0.1 / this.dpr;
        this.ctx.setLineDash([0, 1])
        this.ctx.lineWidth = point;
        this.ctx.lineCap = this.scale > 20 ? 'round' : 'square';
        this.ctx.strokeStyle = '#666';
        for (let x = fromX; x <= toX; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, fromY);
            this.ctx.lineTo(x, toY + 1e-5);
            // 1e-5: ensure line dash show last line
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    private resize(width: number, height: number) {
        const ratio = this.dpr;
        this.size.width = width;
        this.size.height = height;
        this.canvas.width = width * ratio;
        this.canvas.height = height * ratio;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.viewport.w = this.size.width / this.scale;
        this.viewport.h = this.size.height / this.scale;
        this.viewport.x = - this.viewport.w / 2
        this.viewport.y = - this.viewport.h / 2
        this.redraw();
    }

    update(program: Program) {
        this.program = program;
        this.redraw();
    }

    private drawProgramNode(object: DrawNode) {
        const nodePos = this.worldToScreen(object.rect.x, object.rect.y);
        const x = nodePos.x - NODE_SURROUND;
        const y = nodePos.y - NODE_SURROUND;
        const w = object.rect.w + NODE_SURROUND * 2;
        const h = object.rect.h + NODE_SURROUND * 2;

        this.ctx.save();
        this.ctx.strokeStyle = BORDER_COLOR;
        this.ctx.fillStyle = '#FFF';
        const borderWidth = 0.1;
        const borderRadius = 0.25;
        this.ctx.lineWidth = borderWidth;
        this.ctx.beginPath();
        this.ctx.roundRect(
            x, 
            y, 
            w, 
            h, 
            borderRadius
        );
        this.ctx.stroke();
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        const textPos = this.worldToScreen(object.rect.x + object.rect.w / 2, object.rect.y + object.rect.h);
        this.drawText(textPos.x, textPos.y, object.name, 0.35);
        if (object.selected) {
            // shadow
            this.ctx.globalAlpha = 0.3;
            this.ctx.strokeStyle = '#b7ccdaff'            
            this.ctx.beginPath();
            const lineWidth = 0.3;
            this.ctx.lineWidth = lineWidth;
            this.ctx.roundRect(
                x - lineWidth / 2, 
                y - lineWidth / 2, 
                w + lineWidth,
                h + lineWidth, 
                borderWidth / 2 + borderRadius
            );
            this.ctx.stroke();

            // outline
            this.ctx.globalAlpha = 0.1;
            this.ctx.strokeStyle = '#000'
            this.ctx.beginPath();
            const outLineWidth = 0.02;
            this.ctx.lineWidth = outLineWidth;
            this.ctx.roundRect(
                x - borderWidth / 2, 
                y - borderWidth / 2, 
                w + borderWidth,
                h + borderWidth, 
                borderWidth / 2 + borderRadius
            );
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }

        for (const point of object.points) {
            const screen = this.worldToScreen(point.x, point.y)
            this.ctx.strokeStyle = BORDER_COLOR;
            this.ctx.fillStyle = '#FFF';
            this.ctx.lineWidth = point.borderWidth;
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, point.radius, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    private drawText(x: number, y: number, text: string, linePadding = 0) {
        this.ctx.save();
        const lineHeight = 0.5;
        this.ctx.font = `${lineHeight}px Arial`
        const { width } = this.ctx.measureText(text);
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(text, x - width / 2, y + lineHeight + linePadding);
        this.ctx.restore();
    }

    private worldToScreen(worldX: number, worldY: number, hasScale = true): { x: number; y: number } {
        const scale = hasScale ? 1 : this.scale;
        const screenX = (worldX - this.viewport.x) * scale;
        const screenY = (worldY - this.viewport.y) * scale;
        return { x: screenX, y: screenY };
    }

    private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        const worldX = this.viewport.x + screenX / this.scale;
        const worldY = this.viewport.y + screenY / this.scale;
        return { x: worldX, y: worldY };
    }
}