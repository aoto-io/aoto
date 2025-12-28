import { useEffect, useRef } from "react"
import { ProgramCanvas } from "./canvas";

export function Canvas() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const programCanvas = new ProgramCanvas(containerRef.current);
        programCanvas.update({
            nodes: [],
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
                },
            ],
        })
        return () => {
            programCanvas.dispose();
        }
    }, []);

    return (
        <div ref={containerRef} className="container flex-1 flex overflow-hidden">
        </div>
    )
}