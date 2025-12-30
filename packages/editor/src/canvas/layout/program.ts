export const NODE_SURROUND = 0.1;

export interface NodePoint {
    type: 'input' | 'output'
    key: string;
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
    id: string;
    type: string;
    name: string;
    icon: string;
    points: NodePoint[];
    rect: { x: number; y: number, w: number; h: number };
}

export interface Program {
    nodes: ProgramNode[],
    // connections: [],
}

export interface PointLayout {
    x: number;
    y: number;
    radius: number;
    name: string;
}

export interface DrawNode {
    rect: {x: number; y: number; w: number; h: number;};
    points: PointLayout[];
    fillStyle: string;
    selected: boolean;
    name: string;
}

export interface ProgramObject {
    id: string;
}

export interface Selection {
    nodes: ProgramObject[];
}

export interface ProgramLayout {
    nodes: DrawNode[]
}

export function isInSelection(selection: Selection, id: string) {
    return Boolean(selection.nodes.find((item) => {
        return item.id === id;
    }));
}

export function layoutPoints(node: ProgramNode) {
    const radius = 0.25;
    return node.points.map((item) => {
        const half = 0.5;
        const side = item.position.side;
        if (side === 'top') {
            return {
                x: node.rect.x + item.position.x + half,
                y: node.rect.y - NODE_SURROUND,
                name: node.name,
                radius
            }
        } else if (side === 'right') {
            return {
                x: node.rect.x + node.rect.w + NODE_SURROUND,
                y: node.rect.y + item.position.x + half,
                name: node.name,
                radius
            }
        } else if (side === 'bottom') {
            return {
                x: node.rect.x + item.position.x + half,
                y: node.rect.y + node.rect.h + NODE_SURROUND,
                name: node.name,
                radius
            }
        } else {
            return {
                x: node.rect.x - NODE_SURROUND,
                y: node.rect.y + item.position.x + half,
                name: node.name,
                radius
            }
        }
    })
}

export function layoutProgram(program: Program, selection: Selection): ProgramLayout {
    const result: ProgramLayout = { nodes: [] }
    program.nodes.forEach((node) => {
        result.nodes.push({
            rect: node.rect,
            fillStyle: '',
            selected: isInSelection(selection, node.id),
            name: node.name,
            points: layoutPoints(node),
        });
    })
    return result;
}
