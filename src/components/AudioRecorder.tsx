import React, { useState, useEffect, useRef } from 'react';

import { formatAudioTimestamp } from '../utils/AudioUtils';

export default function AudioRecorder(props: {
    onRecordingComplete: (blob: Blob) => void;
}) {
    const [recording, setRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const startRecording = async () => {
        // Reset recording (if any)
        setRecordedBlob(null);

        try {
            if (!streamRef.current) {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            const mediaRecorder = new MediaRecorder(streamRef.current);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.addEventListener('dataavailable', (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
                if (mediaRecorder.state === "inactive") {
                    // Received a stop event
                    let blob = new Blob(chunksRef.current, { type: 'audio/wav' });
                    setRecordedBlob(blob);
                    props.onRecordingComplete(blob);

                    chunksRef.current = [];
                }
            });
            mediaRecorder.start();
            setRecording(true);

        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop(); // set state to inactive
            setDuration(0);
            setRecording(false);
        }
    };

    useEffect(() => {
        let stream: MediaStream | null = null;

        if (recording) {
            const timer = setInterval(() => {
                setDuration((prevDuration) => prevDuration + 1);
            }, 1000);

            return () => {
                clearInterval(timer);
            };
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [recording]);

    const handleToggleRecording = () => {
        if (recording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.play().then(
                x => audioRef.current?.pause()
            );
        }
    }, [recordedBlob]);

    return (
        <div className='flex flex-col justify-center items-center'>
            <button
                type='button'
                className={`m-2 inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all duration-200 ${
                    recording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}
                onClick={handleToggleRecording}
            >
                {recording ? `Stop Recording (${formatAudioTimestamp(duration)})` : 'Start Recording'}
            </button>

            {recordedBlob && (
                <audio className='w-full' ref={audioRef} controls>
                    <source src={URL.createObjectURL(recordedBlob)} type={recordedBlob.type} />
                </audio>
            )}
        </div>
    );
};
