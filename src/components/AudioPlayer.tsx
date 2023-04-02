import { useEffect, useState } from "react";
import { formatAudioTimestamp } from "../utils/AudioUtils";

enum Status {
    playing = "PLAYING",
    paused = "PAUSED",
    initialised = "INIT",
    ended = "ENDED",
    reset = "RESET",
}

export default function AudioPlayer(props: {audioUrl: string}) {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [status, setStatus] = useState(Status.initialised);
    const progress = duration ? currentTime/duration*100 : 0;

    // Setup audio player on initial render
    const createAudioPlayer = () => {
        const _audioPlayer = new Audio();
        // TODO: Issue with duration of audio recordings (sometimes duration is not set in metadata by recording component)
        _audioPlayer.ondurationchange = () => !isNaN(_audioPlayer.duration) && setDuration(_audioPlayer.duration);
        _audioPlayer.ontimeupdate = () => setCurrentTime(_audioPlayer.currentTime);
        _audioPlayer.onplay = () => setStatus(Status.playing);
        _audioPlayer.onpause = () => setStatus(Status.paused);
        _audioPlayer.onended = () => setStatus(Status.ended);
        return _audioPlayer;
    };

    // Using this like a useRef (audioPlayer is initialized and reference never changes - works better with TS)
    const [audioPlayer] = useState<HTMLAudioElement>(createAudioPlayer());

    // Updates src when url changes
    useEffect(() => {
        audioPlayer.src = props.audioUrl;
        audioPlayer.load();
        setDuration(audioPlayer.duration);
        setCurrentTime(0);
        setStatus(Status.initialised);
    }, [props.audioUrl]);

    // Updates current time (ontimeupdate event is not frequent enough)
    useEffect(() => {
        if(status === Status.playing){
            const id = setInterval(() => {
                setCurrentTime(audioPlayer.currentTime);
            }, 100);
            return () => clearInterval(id);
        }
        // Reset player at end of clip
        if(status === Status.ended){
            audioPlayer.currentTime = 0;
            setStatus(Status.reset);
            return;
        }
    }, [status]);

    return (
        <div className="flex">
            <div className="relative z-10 p-4">
                <div className="flex w-[41rem] rounded-lg bg-white shadow-xl shadow-black/5 ring-1 ring-slate-700/10">
                    <div className="flex items-center space-x-4 py-4 px-6">
                        <svg className="h-6 w-6 flex-none" fill="none">
                            <path d="M6.22 11.03a.75.75 0 1 0 1.06-1.06l-1.06 1.06ZM3 6.75l-.53-.53a.75.75 0 0 0 0 1.06L3 6.75Zm4.28-3.22a.75.75 0 0 0-1.06-1.06l1.06 1.06ZM13.5 18a.75.75 0 0 0 0 1.5V18ZM7.28 9.97 3.53 6.22 2.47 7.28l3.75 3.75 1.06-1.06ZM3.53 7.28l3.75-3.75-1.06-1.06-3.75 3.75 1.06 1.06Zm16.72 5.47c0 2.9-2.35 5.25-5.25 5.25v1.5a6.75 6.75 0 0 0 6.75-6.75h-1.5ZM15 7.5c2.9 0 5.25 2.35 5.25 5.25h1.5A6.75 6.75 0 0 0 15 6v1.5ZM15 6H3v1.5h12V6Zm0 12h-1.5v1.5H15V18Z" fill="#64748B"></path>
                            <path d="M3 15.75h.75V21" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                            <path d="M9 16.5A.75.75 0 0 0 9 15v1.5Zm-2.25-.75V15a.75.75 0 0 0-.75.75h.75Zm0 2.25H6c0 .414.336.75.75.75V18Zm0 2.25a.75.75 0 0 0 0 1.5v-1.5ZM9 15H6.75v1.5H9V15Zm-3 .75V18h1.5v-2.25H6Zm.75 3h1.5v-1.5h-1.5v1.5Zm1.5 1.5h-1.5v1.5h1.5v-1.5ZM9 19.5a.75.75 0 0 1-.75.75v1.5a2.25 2.25 0 0 0 2.25-2.25H9Zm-.75-.75a.75.75 0 0 1 .75.75h1.5a2.25 2.25 0 0 0-2.25-2.25v1.5Z" fill="#64748B"></path>
                        </svg>
                        <button onClick={() => {status === Status.playing ? audioPlayer.pause() : audioPlayer.play()}}>
                            {status === Status.playing ? 
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM9 8.25a.75.75 0 00-.75.75v6c0 .414.336.75.75.75h.75a.75.75 0 00.75-.75V9a.75.75 0 00-.75-.75H9zm5.25 0a.75.75 0 00-.75.75v6c0 .414.336.75.75.75H15a.75.75 0 00.75-.75V9a.75.75 0 00-.75-.75h-.75z" clipRule="evenodd" />
                                </svg>
                                : 
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd" />
                                </svg>
                            }
                        </button>
                        <svg className="h-6 w-6 flex-none" fill="none">
                            <path d="M16.72 9.97a.75.75 0 1 0 1.06 1.06l-1.06-1.06ZM21 6.75l.53.53a.75.75 0 0 0 0-1.06l-.53.53Zm-3.22-4.28a.75.75 0 1 0-1.06 1.06l1.06-1.06ZM10.5 19.5a.75.75 0 0 0 0-1.5v1.5Zm3.75-4.5a.75.75 0 0 0 0 1.5V15Zm.75.75h.75A.75.75 0 0 0 15 15v.75ZM14.25 21a.75.75 0 0 0 1.5 0h-1.5Zm6-4.5a.75.75 0 0 0 0-1.5v1.5ZM18 15.75V15a.75.75 0 0 0-.75.75H18ZM18 18h-.75c0 .414.336.75.75.75V18Zm0 2.25a.75.75 0 0 0 0 1.5v-1.5Zm-.22-9.22 3.75-3.75-1.06-1.06-3.75 3.75 1.06 1.06Zm3.75-4.81-3.75-3.75-1.06 1.06 3.75 3.75 1.06-1.06ZM2.25 12.75A6.75 6.75 0 0 0 9 19.5V18a5.25 5.25 0 0 1-5.25-5.25h-1.5ZM9 6a6.75 6.75 0 0 0-6.75 6.75h1.5C3.75 9.85 6.1 7.5 9 7.5V6Zm0 1.5h12V6H9v1.5Zm0 12h1.5V18H9v1.5Zm5.25-3H15V15h-.75v1.5Zm0-.75V21h1.5v-5.25h-1.5Zm6-.75H18v1.5h2.25V15Zm-3 .75V18h1.5v-2.25h-1.5Zm.75 3h1.5v-1.5H18v1.5Zm1.5 1.5H18v1.5h1.5v-1.5Zm.75-.75a.75.75 0 0 1-.75.75v1.5a2.25 2.25 0 0 0 2.25-2.25h-1.5Zm-.75-.75a.75.75 0 0 1 .75.75h1.5a2.25 2.25 0 0 0-2.25-2.25v1.5Z" fill="#64748B"></path>
                        </svg>
                    </div>
                    <div className="flex flex-auto items-center border-l border-slate-200/60 pr-4 pl-6 text-[0.8125rem] leading-5 text-slate-700">
                        <div>{formatAudioTimestamp(currentTime)}</div>
                        <div onClick={(event) => {
                            const bounds = event.currentTarget.getBoundingClientRect();
                            const position = (event.clientX - bounds.x)/bounds.width*duration;
                            audioPlayer.currentTime = position;
                        }}
                        className="ml-4 flex flex-auto rounded-full bg-slate-100">
                            <div className="h-2 flex-none rounded-l-full rounded-r-[1px] bg-indigo-600" style={{ width: `${progress}%` }}></div>
                            {/* <div className="-my-[0.3125rem] ml-0.5 h-[1.125rem] w-1 rounded-full bg-indigo-600 transition-all duration-500"></div> */}
                        </div>
                        <div className="ml-4">{formatAudioTimestamp(duration)}</div>
                        <svg className="ml-6 h-6 w-6 flex-none" fill="none">
                            <path d="M14 5 9 9H6a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l5 4V5Z" fill="#64748B" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                            <path d="M19 12c0-1.5-1-2-1-2v4s1-.5 1-2Z" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                        <svg className="ml-6 h-6 w-6 flex-none" fill="none">
                            <path d="M12 8v1a1 1 0 0 0 1-1h-1Zm0 0h-1a1 1 0 0 0 1 1V8Zm0 0V7a1 1 0 0 0-1 1h1Zm0 0h1a1 1 0 0 0-1-1v1ZM12 12v1a1 1 0 0 0 1-1h-1Zm0 0h-1a1 1 0 0 0 1 1v-1Zm0 0v-1a1 1 0 0 0-1 1h1Zm0 0h1a1 1 0 0 0-1-1v1ZM12 16v1a1 1 0 0 0 1-1h-1Zm0 0h-1a1 1 0 0 0 1 1v-1Zm0 0v-1a1 1 0 0 0-1 1h1Zm0 0h1a1 1 0 0 0-1-1v1Z" fill="#64748B"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}