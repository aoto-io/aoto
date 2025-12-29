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
                    points: [],
                    rect: { x: -4, y: -3, w: 3, h: 4 }
                }
            ],
            footprints: [
                {
                    key: '',
                    color: '#333',
                    isPoint: false,
                    rect: {x: 0, y: 0}
                },
                {
                    key: '',
                    color: '#333',
                    isPoint: false,
                    rect: {x: 0, y: 1}
                },
                {
                    key: '',
                    color: '#333',
                    isPoint: false,
                    rect: {x: 1, y: 1}
                }
            ],
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