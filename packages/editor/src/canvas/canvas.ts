import { FootprintLayoutEnum, type FootprintLayoutType } from "./layout/footprint";
import { layoutProgram, type DrawObject, type Program } from "./layout/program";

export const NODE_SURROUND = 0.1;

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
        this.canvas.addEventListener('mousemove', this.onMouseMove);
    }

    private onMouseMove = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const world = this.screenToWorld(mouseX, mouseY);
        if (this.findNode(world)) {
            this.canvas.style.cursor = 'pointer'
        } else {
            this.canvas.style.cursor = 'default'
        }
    }

    private findNode(world: { x: number, y: number }) {
        return this.program.nodes.find((node) => {
            const { x, y, w, h } = node.rect;
            const sur = NODE_SURROUND;
            return world.x >= x - sur && world.x <= x + w + sur * 2 && world.y >= y - sur && world.y <= y + h + sur * 2;
        });
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
    }

    private redraw() {
        this.ctx.save()
        this.ctx.clearRect(0, 0, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
        this.ctx.scale(this.scale * this.dpr, this.scale * this.dpr);
        this.drawBackground();
        this.drawGridLines();
        this.drawProgram();
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
        const layout = layoutProgram(this.program);
        layout.objects.forEach((object) => {
            if (object.type === 'footprint') {
                this.drawFootprint(object);
            } else {
                this.drawProgramNode(object);
            }
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

    private drawFootprint(object: DrawObject) {
        const x = object.rect.x - this.viewport.x;
        const y = object.rect.y - this.viewport.y;        
        this.ctx.fillStyle = object.fillStyle;
        const type = object.params.showType as FootprintLayoutType;
        const size = 0.4;
        const half = size / 2;
        if (type === FootprintLayoutEnum.POINT) {
            this.ctx.fillRect(x + 0.5 - half, y + 0.5 + half, size, size);
        } else if (type === FootprintLayoutEnum.LEFT_RIGHT) {
            this.ctx.fillRect(x, y + 0.5 - half, 1, size);
        } else if (type === FootprintLayoutEnum.TOP_DOWN) {
            this.ctx.fillRect(x + 0.5 - half, y, size, 1);
        } else if (type === FootprintLayoutEnum.TOP_RIGHT) {
            this.ctx.fillRect(x + 0.5 - half, y, size, 0.5 + half);
            this.ctx.fillRect(x + 0.5 - half, y + 0.5 - half, 0.5 + half, size);
        }
    }

    private drawProgramNode(object: DrawObject) {
        const { x, y, w, h } = object.rect;
        const nodePos = this.worldToScreen(x, y);
        this.ctx.save();
        this.ctx.strokeStyle = '#CCC';
        this.ctx.fillStyle = '#FFF';
        this.ctx.lineWidth = 0.12;
        this.ctx.beginPath();
        this.ctx.roundRect(
            nodePos.x - NODE_SURROUND, 
            nodePos.y - NODE_SURROUND, 
            w + NODE_SURROUND * 2, 
            h + NODE_SURROUND * 2, 
            0.25
        );
        this.ctx.stroke();
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        const textPos = this.worldToScreen(x + w / 2, y + h);
        this.drawText(textPos.x, textPos.y, object.params.name, 0.3);
        this.ctx.restore();
    }

    private drawText(x: number, y: number, text: string, linePadding = 0) {
        this.ctx.save();
        const lineHeight = 0.5 ;
        this.ctx.font = `${lineHeight}px Arial`
        const { width } = this.ctx.measureText(text);
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