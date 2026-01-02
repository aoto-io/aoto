export interface IIconProps {
    url: string;
}

export function Icon(icon: IIconProps) {
    return (
        <div className="flex w-[12px] h-[12px]">
            <img className="flex-1" src={icon.url}></img>
        </div>
    )
}
