import { TranscriberData } from "../hooks/useTranscriber";
import { formatAudioTimestamp } from "../utils/AudioUtils";

interface Props {
    transcribedData: TranscriberData | undefined;
}

export default function Transcript({ transcribedData }: Props) {
    return (
        <div className='flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto'>
            {transcribedData &&
                transcribedData.chunks.map((chunk) => (
                    <div
                        key={chunk.text}
                        className='flex flex-row w-[41rem] mb-2 bg-white rounded-lg p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10'
                    >
                        <div className='mr-5'>
                            {formatAudioTimestamp(chunk.timestamp[0])}
                        </div>
                        {chunk.text}
                    </div>
                ))}
        </div>
    );
}
