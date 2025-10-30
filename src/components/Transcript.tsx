import { useRef, useEffect, useState } from "react";

import { TranscriberData } from "../hooks/useTranscriber";
import { formatAudioTimestamp } from "../utils/AudioUtils";
import { sentimentAnalyzer, SentimentResult } from "../utils/SentimentAnalyzer";

interface Props {
    transcribedData: TranscriberData | undefined;
}

interface ChunkWithSentiment {
    text: string;
    timestamp: [number, number | null];
    sentiment?: SentimentResult;
}

export default function Transcript({ transcribedData }: Props) {
    const divRef = useRef<HTMLDivElement>(null);
    const [sentimentResults, setSentimentResults] = useState<ChunkWithSentiment[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const saveBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };
    const exportTXT = () => {
        let chunks = transcribedData?.chunks ?? [];
        let text = chunks
            .map((chunk) => chunk.text)
            .join("")
            .trim();

        const blob = new Blob([text], { type: "text/plain" });
        saveBlob(blob, "transcript.txt");
    };
    const exportJSON = () => {
        let jsonData = JSON.stringify(transcribedData?.chunks ?? [], null, 2);

        // post-process the JSON to make it more readable
        const regex = /(    "timestamp": )\[\s+(\S+)\s+(\S+)\s+\]/gm;
        jsonData = jsonData.replace(regex, "$1[$2 $3]");

        const blob = new Blob([jsonData], { type: "application/json" });
        saveBlob(blob, "transcript.json");
    };

    const analyzeSentiment = async () => {
        if (!transcribedData?.chunks || transcribedData.chunks.length === 0) {
            alert("No transcript available to analyze. Please record some audio first.");
            return;
        }

        setIsAnalyzing(true);
        try {
            console.log("Starting sentiment analysis...");
            const results = await sentimentAnalyzer.analyzeTranscript(transcribedData.chunks);
            setSentimentResults(results);
            console.log("Sentiment analysis completed:", results);
        } catch (error) {
            console.error("Error analyzing sentiment:", error);
            alert("Error analyzing sentiment. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'positive':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'negative':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment) {
            case 'positive':
                return '+';
            case 'negative':
                return '-';
            default:
                return '=';
        }
    };

    // Clear sentiment results when new transcription data arrives
    useEffect(() => {
        if (transcribedData?.chunks && transcribedData.chunks.length > 0) {
            setSentimentResults([]);
            setIsAnalyzing(false);
        }
    }, [transcribedData?.chunks]);

    // Scroll to the bottom when the component updates
    useEffect(() => {
        if (divRef.current) {
            const diff = Math.abs(
                divRef.current.offsetHeight +
                    divRef.current.scrollTop -
                    divRef.current.scrollHeight,
            );

            if (diff <= 64) {
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
            {sentimentResults.length > 0 ? (
                <>
                    <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                        <h3 className='text-lg font-semibold text-blue-800 mb-2'>Sentiment Analysis Results</h3>
                        <div className='text-sm text-blue-600'>
                            Total segments: {sentimentResults.length} | 
                            Positive: {sentimentResults.filter(r => r.sentiment?.sentiment === 'positive').length} | 
                            Negative: {sentimentResults.filter(r => r.sentiment?.sentiment === 'negative').length}
                        </div>
                    </div>
                    {sentimentResults.map((chunk, i) => (
                        <div
                            key={`${i}-${chunk.text}-sentiment`}
                            className='w-full flex flex-col mb-2 bg-white rounded-lg p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10'
                        >
                            <div className='flex flex-row items-start'>
                                <div className='mr-5 text-sm text-gray-500 min-w-[60px]'>
                                    {formatAudioTimestamp(chunk.timestamp[0])}
                                </div>
                                <div className='flex-1'>
                                    <div className='mb-2'>{chunk.text}</div>
                                    {chunk.sentiment && (
                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSentimentColor(chunk.sentiment.sentiment)}`}>
                                            <span className='mr-1 font-bold'>{getSentimentIcon(chunk.sentiment.sentiment)}</span>
                                            <span className='uppercase'>{chunk.sentiment.sentiment}</span>
                                            <span className='ml-2 text-xs opacity-75'>
                                                ({(chunk.sentiment.maxScore * 100).toFixed(1)}%)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            ) : (
                <>
                    {transcribedData?.chunks &&
                        transcribedData.chunks.map((chunk, i) => (
                            <div
                                key={`${i}-${chunk.text}`}
                                className='w-full flex flex-row mb-2 bg-white rounded-lg p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10'
                            >
                                <div className='mr-5'>
                                    {formatAudioTimestamp(chunk.timestamp[0])}
                                </div>
                                {chunk.text}
                            </div>
                        ))}
                </>
            )}
            {transcribedData && !transcribedData.isBusy && (
                <div className='w-full text-right'>
                    <button
                        onClick={analyzeSentiment}
                        disabled={isAnalyzing}
                        className='text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Sentiment'}
                    </button>
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
