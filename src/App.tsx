import { useCallback, useEffect, useState } from 'react';
import AudioPlayer from './components/AudioPlayer'
import { TranscribeButton } from './components/TranscribeButton';
import Transcript from './components/Transcript'
import { UrlInput } from './components/UrlInput';
import { useTranscriber } from './hooks/useTranscriber';
import Constants from './utils/Constants';

function App() {
    const [url, setUrl] = useState(Constants.DEFAULT_AUDIO_URL);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [audioData, setAudioData] = useState<AudioBuffer | undefined>(undefined);
    const transcriber = useTranscriber();

    const loadAudio = async(requestAbortController: AbortController) => {
        try{
            setAudioData(undefined);
            setIsAudioLoading(true);
            const samplingRate = 16000;
            // Since AudioContext is not available in web worker, we get the audio data first
            const audioCTX = new AudioContext({ sampleRate: samplingRate })
            const response = await (await fetch(url, {signal: requestAbortController.signal})).arrayBuffer()
            const decoded = await audioCTX.decodeAudioData(response)
            setAudioData(decoded);
        }
        catch(error) {
            console.log("Request failed or aborted");
        }
        finally{
            setIsAudioLoading(false);
        }
    }

    useEffect(() => {
        // Offload the actual work to the web worker (allowing the UI thread to not be blocked
        transcriber.start(audioData);
        // TODO: Add cleanup function
    }, [audioData])

    const transcribe = async () => {
        const requestAbortController = new AbortController();
        // First load audio data from URL
        await loadAudio(requestAbortController);
    };

    return (
        <div className="flex flex-col justify-center items-center h-screen">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-7xl">Whisper Web</h1>
            <h2 className="mt-3 mb-3 text-1xl font-semibold tracking-tight text-slate-900 sm:text-2xl">AI speech-to-text directly in your browser</h2>

            <AudioPlayer />

            <UrlInput onChange={(event) => {
                setUrl(event.target.value);
            }} value={url} />

            <TranscribeButton onClick={transcribe} isLoading={isAudioLoading || transcriber.isBusy}/>

            <Transcript value={transcriber.output} />

        </div>
    );
}

export default App;
