import { FootprintLayoutEnum, type FootprintLayoutType } from "./layout/footprint";
import { layoutProgram, type DrawObject, type Program } from "./layout/program";

export class ProgramCanvas {
    private canvas: HTMLCanvasElement;
    private container: HTMLElement;
    private ctx: CanvasRenderingContext2D;
    private scale: number = 300;
    private observer: ResizeObserver;
    private program: Program;

    constructor(container: HTMLElement) {
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
        this.ctx.clearRect(0, 0, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
        this.ctx.save()
        this.ctx.scale(this.scale, this.scale);
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

    private resize(width: number, height: number) {
        const ratio = window.devicePixelRatio;
        this.canvas.width = width * ratio;
        this.canvas.height = height * ratio;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.redraw();
    }

    update(program: Program) {
        this.program = program;
        this.redraw();
    }

    private drawFootprint(object: DrawObject) {
        const {x, y} = object.rect;
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