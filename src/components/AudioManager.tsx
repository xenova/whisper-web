import React, { useEffect, useState } from "react";
import Constants from "../utils/Constants";
import Modal from "./modal/Modal";
import { UrlInput } from "./modal/UrlInput";
import { ModelSelect } from "./modal/ModelSelect";
import { TaskSelect } from "./modal/TaskSelect";
import axios from "axios";
import { TranscribeButton } from "./TranscribeButton";
import { Transcriber } from "../hooks/useTranscriber";
import AudioPlayer from "./AudioPlayer";

export enum AudioSource {
    URL = "URL",
    FILE = "FILE",
}

export function AudioManager(props: {
    transcriber: Transcriber;
}) {
    const [progress, setProgress] = useState<number | undefined>(undefined);
    const [audioData, setAudioData] = useState<
        { buffer: AudioBuffer; url: string; source: AudioSource } | undefined
    >(undefined);
    const [audioDownloadUrl, setAudioDownloadUrl] = useState<
        string | undefined
    >(undefined);

    const isAudioLoading = progress !== undefined;

    const resetAudio = () => {
        setAudioData(undefined);
        setAudioDownloadUrl(undefined);
    };
    const setAudioFromDownload = async (data: ArrayBuffer) => {
        const audioCTX = new AudioContext({
            sampleRate: Constants.SAMPLING_RATE,
        });
        const blobUrl = URL.createObjectURL(
            new Blob([data], { type: "audio/*" }),
        );
        const decoded = await audioCTX.decodeAudioData(data);
        setAudioData({
            buffer: decoded,
            url: blobUrl,
            source: AudioSource.URL,
        });
    };

    const downloadAudioFromUrl = async (
        requestAbortController: AbortController,
    ) => {
        if (audioDownloadUrl) {
            try {
                setAudioData(undefined);
                setProgress(0);
                const { data } = (await axios.get(audioDownloadUrl, {
                    signal: requestAbortController.signal,
                    responseType: "arraybuffer",
                    headers: {
                        "Content-Type": "audio/wav",
                    },
                    onDownloadProgress(progressEvent) {
                        setProgress(progressEvent.progress || 0);
                    },
                })) as { data: ArrayBuffer };
                setAudioFromDownload(data);
            } catch (error) {
                console.log("Request failed or aborted", error);
            } finally {
                setProgress(undefined);
            }
        }
    };

    // When URL changes, download audio
    useEffect(() => {
        if (audioDownloadUrl) {
            const requestAbortController = new AbortController();
            downloadAudioFromUrl(requestAbortController);
            return () => {
                requestAbortController.abort();
            };
        }
    }, [audioDownloadUrl]);

    return (
        <>
            <div className='flex flex-col justify-center items-center rounded-lg bg-white shadow-xl shadow-black/5 ring-1 ring-slate-700/10'>
                <div className='flex flex-row space-x-2 py-2 w-full px-2'>
                    <UrlTile
                        icon={<AnchorIcon />}
                        text={"From URL"}
                        onUrlUpdate={setAudioDownloadUrl}
                    />
                    <VerticalBar />
                    <FileTile
                        icon={<FolderIcon />}
                        text={"From file"}
                        onFileUpdate={(decoded, blobUrl) => setAudioData({
                            buffer: decoded,
                            url: blobUrl,
                            source: AudioSource.FILE,
                        })}
                    />
                </div>
                {
                    <AudioDataBar
                        progress={isAudioLoading ? progress : +!!audioData}
                    />
                }
            </div>
            {audioData && (
                <>
                    <AudioPlayer audioUrl={audioData.url} />

                    <div className="relative w-full flex justify-center items-center">
                        <TranscribeButton
                            onClick={() => {
                                props.transcriber.start(audioData.buffer);
                            }}
                            isModelLoading={false}
                            // isAudioLoading || 
                            isTranscribing={props.transcriber.isBusy}
                        />


                        <SettingsTile
                            className="absolute right-4"
                            transcriber={props.transcriber}
                            icon={<SettingsIcon />
                            } />
                    </div>
                </>
            )}
        </>
    );
}

function SettingsTile(props: {
    icon: JSX.Element;
    className?: string;
    transcriber: Transcriber,
}) {
    const [showModal, setShowModal] = useState(false);

    const onClick = () => {
        setShowModal(true);
    };

    const onClose = () => {
        setShowModal(false);
    };

    const onSubmit = (url: string) => {
        onClose();
    };

    return (
        <div className={props.className}>
            <Tile icon={props.icon} onClick={onClick} />
            <SettingsModal
                show={showModal}
                onSubmit={onSubmit}
                onClose={onClose}
                transcriber={props.transcriber}
            />
        </div>
    );
}

function SettingsModal(props: {
    show: boolean;
    onSubmit: (url: string) => void;
    onClose: () => void;
    transcriber: Transcriber;
}) {
    return (
        <Modal
            show={props.show}
            title={"Settings"}
            content={
                <>
                    <ModelSelect
                        transcriber={props.transcriber}
                    />
                    <TaskSelect
                        transcriber={props.transcriber}
                    />
                </>
            }
            onClose={props.onClose}
            onSubmit={() => { }}
        />
    );
}


function VerticalBar() {
    return <div className='w-[1px] bg-slate-200'></div>;
}

function AudioDataBar(props: { progress: number }) {
    return <ProgressBar progress={`${Math.round(props.progress * 100)}%`} />;
}

function ProgressBar(props: { progress: string }) {
    return (
        <div className='w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700'>
            <div
                className='bg-blue-600 h-1 rounded-full transition-all duration-100'
                style={{ width: props.progress }}
            ></div>
        </div>
    );
}


function UrlTile(props: {
    icon: JSX.Element;
    text: string;
    onUrlUpdate: (url: string) => void;
}) {
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

    return (
        <>
            <Tile icon={props.icon} text={props.text} onClick={onClick} />
            <UrlModal show={showModal} onSubmit={onSubmit} onClose={onClose} />
        </>
    );
}

function UrlModal(props: {
    show: boolean;
    onSubmit: (url: string) => void;
    onClose: () => void;
}) {
    const [url, setUrl] = useState(Constants.DEFAULT_AUDIO_URL);

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(event.target.value);
    };

    const onSubmit = () => {
        props.onSubmit(url);
    };

    return (
        <Modal
            show={props.show}
            title={"From URL"}
            content={
                <>
                    {"Enter the URL of the audio file you want to load."}
                    <UrlInput onChange={onChange} value={url} />
                </>
            }
            onClose={props.onClose}
            submitText={"Load"}
            onSubmit={onSubmit}
        />
    );
}


function FileTile(props: {
    icon: JSX.Element;
    text: string;
    onFileUpdate: (decoded: AudioBuffer, blobUrl: string) => void;
}) {

    // const audioPlayer = useRef<HTMLAudioElement>(null);

    // Create hidden input element
    let elem = document.createElement('input');
    elem.type = "file";
    elem.oninput = (event) => {
        let files = (event.target as HTMLInputElement).files;
        if (!files) return;

        // Make sure we have files to use

        // Create a blob that we can use as an src for our audio element
        const urlObj = URL.createObjectURL(files[0]);

        const reader = new FileReader();
        reader.addEventListener('load', async (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer; // Get the ArrayBuffer
            if (!arrayBuffer) return;

            const audioCTX = new AudioContext({
                sampleRate: Constants.SAMPLING_RATE,
            });

            const decoded = await audioCTX.decodeAudioData(arrayBuffer);

            props.onFileUpdate(decoded, urlObj)
        });
        reader.readAsArrayBuffer(files[0]);


        // Reset files
        elem.value = '';
    };

    return (
        <>
            <Tile icon={props.icon} text={props.text} onClick={() => elem.click()} />
        </>
    );
}


function Tile(props: {
    icon: JSX.Element;
    text?: string;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={props.onClick}
            className='flex items-center justify-center rounded-lg p-2 bg-blue text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200'
        >
            <div className='w-7 h-7'>{props.icon}</div>
            {
                props.text && <div className='ml-2 break-text text-center text-md w-30'>
                    {props.text}
                </div>
            }
        </button>
    );
}

function AnchorIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='1.5'
            stroke='currentColor'
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244'
            />
        </svg>
    );
}

function FolderIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='1.5'
            stroke='currentColor'
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776'
            />
        </svg>
    );
}

function SettingsIcon() {

    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.25" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}