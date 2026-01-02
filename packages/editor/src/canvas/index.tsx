import { useEffect, useRef } from "react"
import { Editor } from "./editor";
import classNames from "classnames";
import type { ProgramNode } from "./layout";

export interface ICanvasEditorProps {
    className?: string;
    onNodeSettings: (node: ProgramNode) => void;
}

export function CanvasEditor(props: ICanvasEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = new Editor(containerRef.current);
        canvas.onNodeSettings = (node: ProgramNode) => {
            props.onNodeSettings?.(node);
        }
        canvas.update({
            nodes: [
                {
                    type: 'Code',
                    name: '执行代码',
                    icon: '',
                    points: [
                        {
                            type: 'output',
                            name: 'event1',
                            position: {
                                side: 'right',
                                x: 0
                            }
                        },
                        {
                            type: 'output',
                            name: 'event2',
                            position: {
                                side: 'right',
                                x: 1
                            }
                        },
                        
                    ],
                    rect: { x: -4, y: -4, w: 3, h: 4 }
                },
                 {
                    type: 'Code',
                    name: '执行代码2',
                    icon: '',
                    points: [
                        {
                            type: 'input',
                            name: 'event1',
                            position: {
                                side: 'left',
                                x: 0
                            }
                        },
                        {
                            type: 'input',
                            name: 'event2',
                            position: {
                                side: 'left',
                                x: 1
                            }
                        },
                        
                    ],
                    rect: { x: 6, y: -4, w: 3, h: 3 }
                },
                
            ],
            connections: [
                {
                    fromNode: '执行代码',
                    fromPoint: 'event1',
                    toNode: '执行代码2',
                    toPoint: 'event2'
                }
            ]
        })
        return () => {
            canvas.dispose();
        }
    }, []);

    return (
        <div ref={containerRef} className={classNames("container flex-1 flex overflow-hidden", props.className)}>
        </div>
    )
}