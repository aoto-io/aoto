import { FootprintLayoutEnum, type FootprintLayoutType } from "./layout/footprint";
import { layoutProgram, type DrawObject, type Program } from "./layout/program";

export class ProgramCanvas {
    private canvas: HTMLCanvasElement;
    private container: HTMLElement;
    private ctx: CanvasRenderingContext2D;
    private scale: number = 10;
    private dpr: number = 1;
    private observer: ResizeObserver;
    private program: Program;
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
    }

    dispose() {
        this.observer.disconnect();
        this.container.removeChild(this.canvas);
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
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = '#000';
        for (let x = fromX; x <= toX; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, fromY);
            this.ctx.lineTo(x, toY);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    private resize(width: number, height: number) {
        const ratio = this.dpr;
        this.canvas.width = width * ratio;
        this.canvas.height = height * ratio;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.viewport.w = width / this.scale;
        this.viewport.h = height / this.scale;
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
}