import { FootprintLayoutEnum, type FootprintLayoutType } from "./layout/footprint";
import { layoutProgram, type DrawObject, type Program } from "./layout/program";

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
    }

    private onContextMenu = (e: PointerEvent) => {
        e.preventDefault();
    }

    private onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        console.log({ mouseX, mouseY, rect })
        if (e.ctrlKey || e.metaKey) {
            const world = this.screenToWorld(mouseX, mouseY);
            const scaleRatio = 0.5;
            const newScale = this.scale - e.deltaY * scaleRatio;
            console.log({newScale})
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
        this.drawProgram();
        this.drawGridLines();
        this.ctx.restore();
    }

    private drawProgram() {
        this.ctx.save()
        const layout = layoutProgram(this.program);
        console.log(layout)
        layout.objects.forEach((object) => {
            if (object.type === 'footprint') {
                this.drawFootprint(object);
            } else if (object.type === '') {
                // something else 
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
        const point = 0.1;
        this.ctx.setLineDash([0, 1])
        this.ctx.lineWidth = point;
        this.ctx.lineCap = this.scale > 20 ? 'round' : 'square';
        this.ctx.strokeStyle = '#4d4d4d88';
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

    private worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
        const screenX = (worldX - this.viewport.x) * this.scale;
        const screenY = (worldY - this.viewport.y) * this.scale;
        return { x: screenX, y: screenY };
    }

    private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        const worldX = this.viewport.x + screenX / this.scale;
        const worldY = this.viewport.y + screenY / this.scale;
        return { x: worldX, y: worldY };
    }
}