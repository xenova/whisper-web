import { useRef, useEffect, useState } from "react";

import { TranscriberData } from "../hooks/useTranscriber";
import { formatAudioTimestamp } from "../utils/AudioUtils";

interface Props {
    transcribedData: TranscriberData | undefined;
}

export default function Transcript({ transcribedData }: Props) {
    const divRef = useRef<HTMLDivElement>(null);
    const [filename, setFilename] = useState("transcript"); // Default filename

    const saveBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportTXT = () => {
        const chunks = transcribedData?.chunks ?? [];
        const text = chunks
            .map((chunk) => chunk.text)
            .join("")
            .trim();

        const blob = new Blob([text], { type: "text/plain" });
        saveBlob(blob, `${filename}.txt`);
    };

    const exportJSON = () => {
        let jsonData = JSON.stringify(transcribedData?.chunks ?? [], null, 2);

        // post-process the JSON to make it more readable
        const regex = /( {4}"timestamp": )\[\s+(\S+)\s+(\S+)\s+\]/gm;
        jsonData = jsonData.replace(regex, "$1[$2 $3]");

        const blob = new Blob([jsonData], { type: "application/json" });
        saveBlob(blob, `${filename}.json`);
    };

    // Scroll to the bottom when the component updates
    useEffect(() => {
        if (divRef.current) {
            const diff = Math.abs(
                divRef.current.offsetHeight +
                    divRef.current.scrollTop -
                    divRef.current.scrollHeight,
            );

            if (diff <= 100) {
                // We're close enough to the bottom, so scroll to the bottom
                divRef.current.scrollTop = divRef.current.scrollHeight;
            }
        }
    });

    return (
        <div
            ref={divRef}
            className='w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto'
        >
            {transcribedData?.chunks &&
                transcribedData.chunks.map((chunk, i) => (
                    <div
                        key={`${i}-${chunk.text}`}
                        className={`w-full flex flex-row mb-2 ${transcribedData?.isBusy ? "bg-gray-100" : "bg-white"} rounded-lg p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10`}
                    >
                        <div className='mr-5'>
                            {formatAudioTimestamp(chunk.timestamp[0])}
                        </div>
                        {chunk.text}
                    </div>
                ))}
            {transcribedData?.tps && (
                <p className='text-sm text-center mt-4 mb-1'>
                    <span className='font-semibold text-black'>
                        {transcribedData?.tps.toFixed(2)}
                    </span>{" "}
                    <span className='text-gray-500'>tokens/second</span>
                </p>
            )}
            {transcribedData && !transcribedData.isBusy && (
                <div className='w-full text-right'>
                    {/* Input field for the custom filename */}
                    <input
                        type="text"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        placeholder="Enter filename"
                        className='border rounded-lg p-2 mr-2'
                    />
                    <button
                        onClick={exportTXT}
                        className='text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 inline-flex items-center'
                    >
                        Export TXT
                    </button>
                    <button
                        onClick={exportJSON}
                        className='text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 inline-flex items-center'
                    >
                        Export JSON
                    </button>
                </div>
            )}
        </div>
    );
}
