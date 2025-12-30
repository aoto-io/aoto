export const NODE_SURROUND = 0.1;

export interface NodePoint {
    type: 'input' | 'output'
    name: string;
    position: {
        /**
         * 哪一边
         */
        side: 'top' | 'left' | 'bottom' | 'right',
        /**
         * 位置在哪
         */
        x: number;
    };
}

export interface ProgramNode {
    type: string;
    name: string;
    icon: string;
    points: NodePoint[];
    rect: { x: number; y: number, w: number; h: number };
}

export interface NodeConnection {
    fromNode: string;
    fromPoint: string;
    toNode: string;
    toPoint: string;
}

export interface Program {
    nodes: ProgramNode[],
    connections: NodeConnection[],
}

export interface PointLayout {
    x: number;
    y: number;
    borderWidth: number;
    connect: { x: number; y: number };
    radius: number;
    name: string;
    node: string;
}

export interface DrawNode {
    rect: {x: number; y: number; w: number; h: number;};
    points: PointLayout[];
    fillStyle: string;
    selected: boolean;
    name: string;
}

export interface DrawConnection {
    id: string;
    active: boolean;
    fromPoint: { x: number; y: number };
    toPoint: { x: number; y: number };
    path: Path2D;
}

export interface ProgramObject {
    id: string;
}

export interface Selection {
    nodes: ProgramObject[];
}

export interface ProgramLayoutResult {
    nodes: DrawNode[];
    connections: DrawConnection[];
}

export function isInSelection(selection: Selection, id: string) {
    return Boolean(selection.nodes.find((item) => {
        return item.id === id;
    }));
}

export function layoutPoint(item: NodePoint, node: ProgramNode) {
    const radius = 0.25;
    const borderWidth = 0.1;
    const half = 0.5;
    const side = item.position.side;
    if (side === 'top') {
        const x = node.rect.x + item.position.x + half;
        const y = node.rect.y - NODE_SURROUND
        return {
            x: x,
            y: y,
            connect: {
                x,
                y: y - radius - borderWidth / 2,
            },
            name: item.name,
            node: node.name,
            radius,
            borderWidth,
            point: item,
        }
    } else if (side === 'right') {
        const x = node.rect.x + node.rect.w + NODE_SURROUND;
        const y = node.rect.y + item.position.x + half
        return {
            x,
            y,
            connect: {
                x: x + radius + borderWidth / 2,
                y,
            },
            name: item.name,
            node: node.name,
            radius,
            borderWidth,
            point: item,
        }
    } else if (side === 'bottom') {
        const x = node.rect.x + item.position.x + half;
        const y = node.rect.y + node.rect.h + NODE_SURROUND
        return {
            x,
            y,
            connect: {
                x,
                y: y + radius + borderWidth / 2,
            },
            name: item.name,
            node: node.name,
            radius,
            borderWidth,
            point: item,
        }
    } else {
        const x = node.rect.x - NODE_SURROUND;
        const y = node.rect.y + item.position.x + half;
        return {
            x,
            y,
            connect: {
                x: x - radius - borderWidth / 2,
                y,
            },
            name: item.name,
            node: node.name,
            radius,
            borderWidth,
            point: item,
        }
    }
}

export function layoutPoints(node: ProgramNode): PointLayout[] {
    return node.points.map((item) => {
        return layoutPoint(item, node);
    })
}

export class ProgramLayout {
    private program: Program;
    private viewport = { x: 0, y: 0, w: 0, h: 0 };
    private result: ProgramLayoutResult;
    private scale: number;
    private ctx: CanvasRenderingContext2D; // for connections hittest
    private activeConnections = new Map<string, boolean>();

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    getResult() {
        return this.result;
    }

    layout(
        program: Program, 
        selection: Selection,
        scale: number,
        viewport: { x: number, y: number, w: number, h: number },
    ) {
        this.viewport = viewport;
        this.scale = scale;
        this.program = program;
        this.result = { nodes: [], connections: [] }
        program.nodes.forEach((node) => {
            this.result.nodes.push({
                rect: node.rect,
                fillStyle: '',
                selected: isInSelection(selection, node.name),
                name: node.name,
                points: layoutPoints(node),
            });
        })
        this.layoutConnections(program);
        return this.result;
    }

    layoutConnections(program: Program) {
        for (const connection of program.connections) {
            const from = this.findPointByName(connection.fromNode, connection.fromPoint);
            const to = this.findPointByName(connection.toNode, connection.toPoint);
            if (!from || !to) {
                continue;
            }
            const fromPoint = this.worldToScreen(layoutPoint(from.point, from.node).connect);
            const toPoint = this.worldToScreen(layoutPoint(to.point, to.node).connect);
            const xCtrl = (fromPoint.x + toPoint.x) / 2;
            const path = new Path2D();
            path.moveTo(fromPoint.x, fromPoint.y);
            path.bezierCurveTo(xCtrl, fromPoint.y, xCtrl, toPoint.y, toPoint.x, toPoint.y);
            const id = `${connection.fromNode}:${connection.fromPoint}:${connection.toNode}:${connection.toPoint}`;
            this.result.connections.push({ id, fromPoint, toPoint, path, active: this.activeConnections.has(id) });
        }
    }

    findPointByName(node: string, point: string) {
        const findNode = this.program.nodes.find((item) => item.name === node);
        if (!findNode) {
            return null;
        }
        const findPoint = findNode.points.find((item) => item.name === point);
        if (!findPoint) {
            return null;
        }
        return { node: findNode, point: findPoint };
    }

    worldToScreen(world: { x: number; y: number }, hasScale = true): { x: number; y: number } {
        const scale = hasScale ? 1 : this.scale;
        const screenX = (world.x - this.viewport.x) * scale;
        const screenY = (world.y - this.viewport.y) * scale;
        return { x: screenX, y: screenY };
    }

    screenToWorld(screen: {x: number; y: number}): { x: number; y: number } {
        const worldX = this.viewport.x + screen.x / this.scale;
        const worldY = this.viewport.y + screen.y / this.scale;
        return { x: worldX, y: worldY };
    }

    activeConnection(id: string, active: boolean) {
        const connection = this.result.connections.find((item) => {
            return item.id === id;
        })
        if (connection) {
            if (active) {
                this.activeConnections.set(id, active);
            } else {
                this.activeConnections.delete(id);
            }
        }
    }

    deactiveConnection(id: string) {
        this.activeConnections.delete(id);
    }

    hittest(world: { x: number, y: number }) {
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
        const screen = this.worldToScreen(world);
        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        for (const connection of this.result.connections) {
            if (this.ctx.isPointInStroke(connection.path, screen.x, screen.y)) {
                return {
                    type: 'connection',
                    id: connection.id,
                }
            }
        }
    }
}