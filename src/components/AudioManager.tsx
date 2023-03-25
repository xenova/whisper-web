import React, { useEffect, useState } from "react"
import Constants from "../utils/Constants";
import Modal from "./modal/Modal";
import { UrlInput } from "./modal/UrlInput";
import axios from "axios";
import { TranscribeButton } from "./TranscribeButton";
import { Transcriber } from "../hooks/useTranscriber";
import AudioPlayer from "./AudioPlayer";

export function AudioManager(props: {transcriber: Transcriber;}){
    const [progress, setProgress] = useState<number | undefined>(undefined);
    const [audioData, setAudioData] = useState<{audio: AudioBuffer, url: string} | undefined>(undefined);
    const [url, setUrl] = useState<string | undefined>(undefined);

    const isAudioLoading = progress !== undefined;

    const downloadAudioFromUrl = async (requestAbortController: AbortController) => {
        if(url){
            try {
                setAudioData(undefined);
                setProgress(0);
                // Since AudioContext is not available in web worker, we get the audio data first
                const audioCTX = new AudioContext({ sampleRate: Constants.SAMPLING_RATE })
                const { data } = await axios.get(url, 
                    { 
                        signal: requestAbortController.signal, 
                        responseType: "arraybuffer",
                        headers: {
                            'Content-Type': 'audio/wav'
                        },
                        onDownloadProgress(progressEvent) {
                            setProgress(progressEvent.progress || 0);
                        },
                    }
                ) as { data: ArrayBuffer;};
                const blobUrl = URL.createObjectURL(new Blob([data], { type: "audio/*" }));
                const decoded = await audioCTX.decodeAudioData(data);
                setAudioData({audio: decoded, url: blobUrl});
            }
            catch (error) {
                console.log("Request failed or aborted", error);
            }
            finally {
                setProgress(undefined);
            }
        }
    }

    useEffect(() => {
        const requestAbortController = new AbortController();
        downloadAudioFromUrl(requestAbortController);
        return () => {requestAbortController.abort();}
    }, [url]);

    return <>
        <div className="flex flex-col justify-center items-center w-[41rem] rounded-lg bg-white shadow-xl shadow-black/5 ring-1 ring-slate-700/10">
            <div className="flex flex-row space-x-4 py-4 w-full justify-center align-center">
                < UrlTile icon={<AnchorIcon />} text={"Download from URL"} onUrlUpdate={url => setUrl(url)}/>
                < VerticalBar />
                < Tile icon={<FolderIcon />} text={"Drag and drop a file"}/>    
                < VerticalBar />
                < Tile icon={<MicrophoneIcon />} text={"Record with microphone"}/>
            </div>
            {<AudioDataBar progress={isAudioLoading ? progress : +!!audioData}/>}
        </div>
        {audioData && <>
            <TranscribeButton onClick={() => {props.transcriber.start(audioData.audio)}} isLoading={isAudioLoading || props.transcriber.isBusy} /> 
            <AudioPlayer audioUrl={audioData.url}/>
        </>}
    </>
}

function VerticalBar(){
    return <div className="w-[1px] bg-slate-200"></div>
}

function AudioDataBar(props: {progress: number}){
    return <ProgressBar progress={`${Math.round(props.progress * 100)}%`} />
}

function ProgressBar(props: {progress: string}){
    return <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{width: props.progress}}></div>
    </div>
}

function UrlTile(props: { icon: JSX.Element; text: string; onUrlUpdate: (url: string) => void; }){
    const [showModal, setShowModal] = useState(false);

    const onClick = () => {
        setShowModal(true);
    };

    const onClose = () => {
      setShowModal(false);  
    };

    const onSubmit = (url: string) => {
        props.onUrlUpdate(url);
        onClose();
    };

    return <>
        <Tile icon={props.icon} text={props.text} onClick={onClick} />
        <UrlModal show={showModal} onSubmit={onSubmit} onClose={onClose}/>
    </>
}

function UrlModal(props: {show: boolean; onSubmit: (url: string) => void; onClose: () => void;}) {
    const [url, setUrl] = useState(Constants.DEFAULT_AUDIO_URL);

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(event.target.value);
    }

    const onSubmit = () => {
        props.onSubmit(url);
    };

    return <Modal 
        show={props.show} 
        title={"Download from URL"}
        content={
            <>
                {"Enter the URL of the audio file you want to download."}
                <UrlInput onChange={onChange} value={url} />
            </>
        }
        onClose={props.onClose}
        submitText={"Download"}    
        onSubmit={onSubmit}
    />
}

function Tile(props: { icon: JSX.Element; text: string; onClick?: () => void; }){
    return <button onClick={props.onClick} className="flex flex-col items-center rounded-lg p-4 bg-blue text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200">
        <div className="w-7 h-7 mb-3">
            {props.icon}
        </div>
        <div className="break-text text-center text-md w-30">
            {props.text}
        </div>
    </button>
}

function AnchorIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
}

function FolderIcon(){
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
  </svg>
}

function MicrophoneIcon(){
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
  
}