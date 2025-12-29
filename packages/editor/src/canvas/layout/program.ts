import { layoutProgramFootprints, type FootPrint } from "./footprint";

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
    footprints: FootPrint[],
}

export interface DrawObject {
    rect: {x: number; y: number; w: number; h: number;};
    type: string;
    fillStyle: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: Record<string, any>;
}

export interface ProgramLayout {
    objects: DrawObject[]
}

export function layoutProgram(program: Program): ProgramLayout {
    const result: ProgramLayout = { objects: [] }
    layoutProgramFootprints(program).forEach((item) => {
        result.objects.push({
            rect: {
                ...item.rect,
                w: 1,
                h: 1,
            },
            fillStyle: item.color,
            type: 'footprint',
            params: {
                showType: item.type
            },
        })
    });
    program.nodes.forEach((node) => {
        result.objects.push({
            rect: node.rect,
            type: node.type,
            fillStyle: '',
            params: {
                name: node.name,
            }
        });
    })
    return result;
}
