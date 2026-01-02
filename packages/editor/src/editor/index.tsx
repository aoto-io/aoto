import { useCallback, useRef } from "react";
import { CanvasEditor } from "../canvas";
import classNames from "classnames";
import type { ProgramNode } from "../canvas/layout";
import { NodeSettings, type INodeSettingsRef } from "./node-settings";

export interface IEditorProps {
    className: string;
}

export function Editor(props: IEditorProps) {
    const nodeSettingsRef = useRef<INodeSettingsRef>(null);

    const onNodeSettings = useCallback((node: ProgramNode) => {
        nodeSettingsRef?.current.showDialog(node);
    }, []);

    return (
        <div className={classNames("aoto-editor", "antialiased", "flex", "relative", props.className)}>
            <div className="aoto-canvas-editor flex flex-1">
                <CanvasEditor className="flex-1" onNodeSettings={onNodeSettings} />
            </div>
            <NodeSettings ref={nodeSettingsRef}></NodeSettings>
        </div>
    )

}