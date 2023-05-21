import { AudioManager } from "./components/AudioManager";
import Transcript from "./components/Transcript";
import { useTranscriber } from "./hooks/useTranscriber";

function App() {
    const transcriber = useTranscriber();

    return (
        <div className='flex justify-center items-center min-h-screen'>
            <div className='w-[41rem] flex flex-col justify-center items-center'>
                <h1 className='text-4xl font-extrabold tracking-tight text-slate-900 sm:text-7xl'>
                    Whisper Web
                </h1>
                <h2 className='mt-3 mb-5 text-1xl font-semibold tracking-tight text-slate-900 sm:text-2xl'>
                    ML-powered audio transcription directly in your browser
                </h2>
                <AudioManager transcriber={transcriber} />
                <Transcript transcribedData={transcriber.output} />
            </div>
        </div>
    );
}

export default App;
