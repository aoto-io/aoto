import { useEffect, useRef } from "react"
import { ProgramCanvas } from "./canvas";

export function Canvas() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = new ProgramCanvas(containerRef.current);
        canvas.update({
            nodes: [
                {
                    id: '1',
                    type: 'Code',
                    name: '执行代码',
                    icon: '',
                    points: [
                        {
                            type: 'output',
                            key: '',
                            name: '',
                            position: {
                                side: 'right',
                                x: 0
                            }
                        },
                        {
                            type: 'output',
                            key: '',
                            name: '',
                            position: {
                                side: 'right',
                                x: 1
                            }
                        },
                        
                    ],
                    rect: { x: -4, y: -4, w: 3, h: 4 }
                },
                 {
                    id: '2',
                    type: 'Code',
                    name: '执行代码',
                    icon: '',
                    points: [
                        {
                            type: 'input',
                            key: '',
                            name: '',
                            position: {
                                side: 'left',
                                x: 0
                            }
                        },
                        {
                            type: 'input',
                            key: '',
                            name: '',
                            position: {
                                side: 'left',
                                x: 1
                            }
                        },
                        
                    ],
                    rect: { x: 6, y: -4, w: 3, h: 3 }
                },
                
            ]
        })
        return () => {
            canvas.dispose();
        }
    }, []);

    return (
        <div ref={containerRef} className="container flex-1 flex overflow-hidden">
        </div>
    )
}