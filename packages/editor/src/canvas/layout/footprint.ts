import type { NodePoint, Program, ProgramNode } from "./program";

export interface FootPrint {
    id: string;
    /**
     * 不同颜色的连线不互相冲突
     */
    key: string;
    color: string;
    /**
     * 在节点上
     */
    isPoint: boolean;
    rect: { x: number; y: number };
}

export const FootprintLayoutEnum = {
  POINT: 'POINT', // .(无连接)
  LEFT_RIGHT: 'LEFT_RIGHT', // ─(横线)
  TOP_DOWN: 'TOP_DOWN', // |(垂直)
  TOP_LEFT: 'TOP_LEFT', //  ┘
  TOP_RIGHT: 'TOP_RIGHT', // └
  RIGHT_BOTTOM: 'RIGHT_BOTTOM', // ┌
  LEFT_BOTTOM: 'LEFT_BOTTOM', // 	┐
  THREE_DOWN: 'LEFT_BOTTOM_RIGHT', // ┬
  THREE_UP: 'LEFT_TOP_RIGHT', // ┴
  FULL: 'FULL', // +
}

export type FootprintLayoutType = keyof typeof FootprintLayoutEnum;

export interface FootPrintLayout {
  id: string;
  type: FootprintLayoutType;
  color: string;
  rect: { x: number; y: number };
}

export function getFootprintType(
  up: boolean, 
  down: boolean, 
  left: boolean, 
  right: boolean,
) {

  // 四向
  if (up && down && left && right) return FootprintLayoutEnum.FULL;

  // 三向（T型）
  if (left && right && up && !down) return FootprintLayoutEnum.THREE_UP; // _|_ （上T）
  if (left && right && down && !up) return FootprintLayoutEnum.THREE_DOWN; // ┬ （下T）
  if (up && down && left && !right) return FootprintLayoutEnum.TOP_DOWN; // ├ → fallback to |
  if (up && down && right && !left) return FootprintLayoutEnum.TOP_DOWN; // ┤ → fallback to |

  // 两向
  if (left && right) return FootprintLayoutEnum.LEFT_RIGHT; // -
  if (up && down) return FootprintLayoutEnum.TOP_DOWN;    // |
  if (left && up) return FootprintLayoutEnum.LEFT_BOTTOM;    // -|
  if (right && up) return FootprintLayoutEnum.TOP_RIGHT;   // |-
  if (left && down) return FootprintLayoutEnum.TOP_LEFT;  // _|
  if (right && down) return FootprintLayoutEnum.TOP_RIGHT; // |_

  // 单向或无连接：Minecraft 中单向仍显示为线
  if (left || right) return FootprintLayoutEnum.LEFT_RIGHT; // 横向线（哪怕只一边）
  if (up || down) return FootprintLayoutEnum.TOP_DOWN;    // 纵向线

  return FootprintLayoutEnum.POINT;
}

export function getNodePointPosition(node: ProgramNode, point: NodePoint) {
  if (point.position.side === 'left') {
    return { x: node.rect.x, y: node.rect.y + point.position.x };
  } else if (point.position.side === 'top') {
    return { x: node.rect.x + point.position.x, y: node.rect.y };
  } else if (point.position.side === 'right') {
    return { x: node.rect.x + node.rect.w, y: node.rect.y + point.position.x };
  } else if (point.position.side === 'bottom') {
    return { x: node.rect.x + point.position.x, y: node.rect.y + node.rect.h };
  }
  throw new Error('unknown');
}

export function layoutFootprints(footprints: FootPrint[]) {
  const hash = new Map();
  footprints.forEach((fp) => {
    hash.set(`${fp.rect.x},${fp.rect.y}`, true);
  });

  const result: FootPrintLayout[] = [];
  footprints.forEach((fp) => {
    const up = hash.has(`${fp.rect.x},${fp.rect.y - 1}`);
    const down = hash.has(`${fp.rect.x},${fp.rect.y + 1}`);
    const left = hash.has(`${fp.rect.x - 1},${fp.rect.y}`);
    const right = hash.has(`${fp.rect.x + 1},${fp.rect.y}`);
    result.push({
      type: getFootprintType(up, down, left, right) as FootprintLayoutType,
      color: fp.color,
      rect: fp.rect,
      id: fp.id,
    });
  });
  return result;
}


export function layoutProgramFootprints(program: Program) {
  const footprints: FootPrint[] = [];
  footprints.push(...program.footprints);
  program.nodes.forEach((node) => {
    node.points.forEach((point) => {
      const rect = getNodePointPosition(node, point);
      footprints.push({
        key: '',
        color: '',
        rect: rect,
        isPoint: true,
        id: node.id,
      })
    })
  })
  return layoutFootprints(footprints);
}