import { useEffect, useRef, useState } from "react";

enum Status {
    playing = "PLAYING",
    paused = "PAUSED",
    initialised = "INIT",
    ended = "ENDED",
    reset = "RESET",
}

export default function AudioPlayer(props: { audioUrl: string }) {
    const [status, setStatus] = useState(Status.initialised);

    const audioPlayer = useRef<HTMLAudioElement>(null);

    // Updates src when url changes
    useEffect(() => {
        if (audioPlayer.current) {
            audioPlayer.current.src = props.audioUrl;
            audioPlayer.current.load();
        }
        setStatus(Status.initialised);
    }, [props.audioUrl]);

    // Updates current time (ontimeupdate event is not frequent enough)
    useEffect(() => {
        if(audioPlayer.current === null) return;

        let c = audioPlayer.current;
        
        // Reset player at end of clip
        if (status === Status.ended) {
            c.currentTime = 0;
            setStatus(Status.reset);
            return;
        }
    }, [status]);

    return (
        <div className='flex'>
            <div className='relative z-10 p-4'>
                <div className='h-14 flex w-[41rem] rounded-lg bg-white shadow-xl shadow-black/5 ring-1 ring-slate-700/10'>
                    <audio ref={audioPlayer} controls className="w-full h-full">
                    </audio>
                </div>
            </div>
        </div>
    );
}
