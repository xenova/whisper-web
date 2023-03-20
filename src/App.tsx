import { useState } from 'react';

import AudioPlayer from './components/AudioPlayer'
import Transcript from './components/Transcript'


function App() {

    const [transcript, setTranscript] = useState('');

    const [worker, setWorker] = useState<Promise<any> | null>(null);

    const loadWorker = async () => {
        const workerUrl = new URL('./worker.js', import.meta.url);
        const worker = new Worker(workerUrl, { type: 'module' });

        // Listen for messages from the Web Worker
        worker.addEventListener('message', event => {
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
                    setTranscript(message.data)
                    console.log('update', message)
                    break;
                case 'complete':
                    // Received complete transcript
                    setTranscript(JSON.stringify(message.data))
                    console.log('complete', message)
                    break;
            }
        });

        return worker
    }

    async function transcribe() {
        // TODO disable button, then re-enable once complete
        // (do not allow multiple clicks)

        // Little trick to do the following:
        //  (1) only load the worker once
        //  (2) pause if function run and worker still loading
        let workerObj = await worker;
        if (!workerObj) {
            workerObj = loadWorker();
            setWorker(workerObj);
            workerObj = await workerObj;
        }

        // Next, we offload the actual work to the web worker (allowing the UI thread to not be blocked)
        // Since AudioContext is not available in web worker, we get the audio data first

        // Specify audio track(s)
        // TODO allow user to change/upload
        let audio = 'https://xenova.github.io/transformers.js/assets/audio/ted_60.wav';

        const sampling_rate = 16000;
        const audioCTX = new AudioContext({ sampleRate: sampling_rate })
        const response = await (await fetch(audio)).arrayBuffer()
        const decoded = await audioCTX.decodeAudioData(response)

        let data = {
            audio: decoded.getChannelData(0)
        }

        workerObj.postMessage(data);
    }

    return (
        <div className="flex flex-col justify-center items-center h-screen">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-7xl">Whisper Web</h1>
            <h2 className="mt-3 mb-3 text-1xl font-semibold tracking-tight text-slate-900 sm:text-2xl">AI speech-to-text directly in your browser</h2>

            <AudioPlayer />

            <button
                onClick={transcribe}
                className="bg-slate-900 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 text-white font-semibold h-12 px-6 rounded-lg w-full flex items-center justify-center sm:w-auto dark:bg-sky-500 dark:highlight-white/20 dark:hover:bg-sky-400">
                Transcribe
            </button>

            <Transcript value={transcript} />

        </div>
    );
}

export default App;
