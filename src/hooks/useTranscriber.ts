import { useCallback, useMemo, useState } from "react";
import { useWorker } from "./useWorker";

export function useTranscriber() {
    const [transcript, setTranscript] = useState("");
    const [isBusy, setIsBusy] = useState(false);
    const webWorker = useWorker(event => {
        const message = event.data;
        // Update the state with the result
        switch (message.type) {
            case 'download':
                // Received a download message
                // TODO add download/loading bar
                console.log('download', message)
                break;
            case 'update':
                // Received partial update
                setTranscript(JSON.stringify(message.data))
                console.log('update', message)
                break;
            case 'complete':
                // Received complete transcript
                setTranscript(JSON.stringify(message.data))
                setIsBusy(false);
                console.log('complete', message)
                break;
        }
    });

    const postAudioData = useCallback(async (audioData: AudioBuffer | undefined) => {
        if (audioData) {
            setIsBusy(true);
            webWorker.postMessage({ audio: audioData.getChannelData(0) });
        }
    }, [webWorker]);

    const transcriber = useMemo(() => {
        return {
            isBusy,
            start: postAudioData,
            output: transcript
        };
    }, [postAudioData, transcript]);

    return transcriber;
}