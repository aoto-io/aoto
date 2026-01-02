import { useMemo, type ChangeEvent, type MouseEvent } from 'react';
import classNames from "classnames";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState, type ForwardedRef } from "react";
import type { ProgramNode } from "../../canvas/layout";
import Close from '../../assets/close.svg'
import { Icon } from '../../utils/icon';

export interface IPropertyItem {
    name: string;
    title: string;
    value: string;
}

export interface IPropertyItemProps {
    name: string;
    title: string;
    value: string;
    onChange(name: string, value: string): void;
}

export function PropertyItem(props: IPropertyItemProps) {
    const { name } = props;

    const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        props.onChange(name, e.currentTarget.value);
    }, [props, name]);

    return (
        <div className='node-property mb-[16px]'>
            <div className='node-property-name pb-[4px]'>{props.title}</div>  
            <input 
                className='outline-0 w-[100%] h-[30px] leading-[30px] pl-[8px] pr-[8px] rounded-[4px] border border-gray-200' 
                value={props.value}
                onChange={onChange}
            >
            </input>
        </div>
    )
}

export interface IPropertyListProps {
    data: IPropertyItem[];
    onChange: (data: IPropertyItem[]) => void;
}

export function PropertyList(props: IPropertyListProps) {
    const { data, onChange } = props;

    const elems = useMemo(() => {
        const onItemChange = (name: string, value: string) => {
            const newData = [...data];
            const find = newData.find((item) => item.name === name);
            if (!find) {
                return;
            }
            find.value = value;
            onChange(newData);
        }
        return data.map((item: IPropertyItem, idx: number) => {
            return (
                <PropertyItem key={idx} name={item.name} title={item.title} value={item.value} onChange={onItemChange} />
            )
        })
    }, [data, onChange])

    return (
        <div className='node-properties flex-1 p-[16px]'>
            {elems}
        </div>
    )
}

export interface INodeSettingsRef {
    showDialog(value: ProgramNode): void;
}

export const NodeSettings = forwardRef(function NodeSettings(_, ref: ForwardedRef<INodeSettingsRef>) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [node, setNode] = useState<ProgramNode>(null);
    const [properties, setProperties] = useState<IPropertyItem[]>([
        { name: '1', title: '标题1', value: '内容1'},
        { name: '2', title: '标题2', value: '内容2'},
        { name: '3', title: '标题3', value: '内容3'},
    ]);

    useImperativeHandle(ref, () => ({
        showDialog: (value: ProgramNode) => {
            setNode(value);
        }
    }));

    const onClose = useCallback(() => {
        setNode(null);
    }, []);

    const onClickAndClose = useCallback((e: MouseEvent) => {
        if (!dialogRef.current?.contains(e.target as Node)) {
            onClose();
        }
    }, [onClose]);

    const onPropertiesChange = useCallback((data: IPropertyItem[]) => {
        setProperties(data);
    }, []);

    const cs = classNames("aoto-dialog absolute inset-[0] flex justify-center items-center bg-[rgba(0,0,0,0.6)]", {
        'hidden': !node
    });

    return (
        <div className={cs} onClick={onClickAndClose}>
            <dialog ref={dialogRef} open={Boolean(node)} className="w-[500px] h-[300px] bg-[#FFF] rounded-[8px] flex flex-col select-none overflow-hidden relative text-[12px]">
                <header className="flex relative h-[32px] w-[100%] absolute justify-between p-[4px] items-center border-b border-gray-200">
                    <div className='dialog-title'>{node?.name}</div>
                    <button className='cursor-pointer p-[6px]' onClick={onClose}>
                        <Icon url={Close}></Icon>
                    </button>
                </header>
                <main className='flex flex-1'>
                    <PropertyList data={properties} onChange={onPropertiesChange} />
                </main>
            </dialog>
        </div>
    )
})