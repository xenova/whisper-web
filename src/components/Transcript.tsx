import { TranscriberData } from "../hooks/useTranscriber"

interface Props {
    transcribedData: TranscriberData | undefined
}

function padTime(time: number){
    return String(time).padStart(2, "0");
}

function formatAudioTimestamp(time: number){
    const hours = (time / (60*60)) | 0;
    time -= hours * (60*60);
    const minutes = (time / 60) | 0;
    time -= minutes * 60;
    const seconds = time | 0;
    return `${hours ? padTime(hours) + ":" : ""}${padTime(minutes)}:${padTime(seconds)}`
}

export default function Transcript({ transcribedData }: Props) {
    return <div className="flex flex-col my-2">
        {transcribedData &&
        transcribedData.chunks.map(chunk => 
            <div key={chunk.text} className="flex flex-row w-[41rem] mb-2 bg-white rounded-lg p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10">
                <div className="mr-5">{formatAudioTimestamp(chunk.timestamp[0])}</div>
                {chunk.text}
            </div>
        )}
    </div>;
}