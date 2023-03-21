interface Props {
    value: string
}

export default function Transcript({ value }: Props) {
    return (
        <div className="flex w-[41rem] max-h-[16rem] overflow-y-scroll mt-5 bg-white rounded-lg p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10">
            {value}
        </div>
    )
}