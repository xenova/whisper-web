import { useCallback, useMemo, useState } from "react";
import { useWorker } from "./useWorker";

interface TranscriberUpdateData {
    data: [
        string,
        { chunks: { text: string; timestamp: [number, number | null] }[] },
    ];
    text: string;
}

interface TranscriberCompleteData {
    data: {
        text: string;
        chunks: { text: string; timestamp: [number, number | null] }[];
    };
}

export interface TranscriberData {
    text: string;
    chunks: { text: string; timestamp: [number, number | null] }[];
}

export interface Transcriber {
    isBusy: boolean;
    start: (audioData: AudioBuffer | undefined) => void;
    output?: TranscriberData;
}

export function useTranscriber(): Transcriber {
    const [transcript, setTranscript] = useState<TranscriberData | undefined>(
        undefined,
    );
    const [isBusy, setIsBusy] = useState(false);
    const webWorker = useWorker((event) => {
        const message = event.data;
        // Update the state with the result
        switch (message.type) {
            case "download":
                // Received a download message
                // TODO add download/loading bar
                console.log("download", message);
                break;
            case "update":
                // Received partial update
                console.log("update", message);
                // eslint-disable-next-line no-case-declarations
                const updateMessage = message as TranscriberUpdateData;
                setTranscript({
                    text: updateMessage.data[0],
                    chunks: updateMessage.data[1].chunks,
                });
                break;
            case "complete":
                // Received complete transcript
                console.log("complete", message);
                // eslint-disable-next-line no-case-declarations
                const completeMessage = message as TranscriberCompleteData;
                setTranscript({
                    text: completeMessage.data.text,
                    chunks: completeMessage.data.chunks,
                });
                setIsBusy(false);
                break;
        }
    });

    const postAudioData = useCallback(
        async (audioData: AudioBuffer | undefined) => {
            if (audioData) {
                setIsBusy(true);
                webWorker.postMessage({ audio: audioData.getChannelData(0) });
            }
        },
        [webWorker],
    );

    const transcriber = useMemo(() => {
        return {
            isBusy,
            start: postAudioData,
            output: transcript,
        };
    }, [isBusy, postAudioData, transcript]);

    return transcriber;
}
