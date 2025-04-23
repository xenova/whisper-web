import { useState, useEffect, useRef } from "react";

import { formatAudioTimestamp } from "../utils/AudioUtils";
import { webmFixDuration } from "../utils/BlobFix";

function getMimeType() {
  const types = [
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
    "audio/wav",
    "audio/aac",
  ];
  for (let i = 0; i < types.length; i++) {
    if (MediaRecorder.isTypeSupported(types[i])) {
      return types[i];
    }
  }
  return undefined;
}

export default function AudioRecorder(props: {
  onRecordingComplete: (blob: Blob) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    undefined
  );

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(
          (device) => device.kind === "audioinput"
        );
        setAvailableDevices(audioInputDevices);
        if (audioInputDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(audioInputDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error enumerating audio devices:", error);
      }
    };

    getAudioDevices();
  }, []);

  const startRecording = async () => {
    // Reset recording (if any)
    setRecordedBlob(null);

    let startTime = Date.now();

    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : true,
      };

      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      }
      console.log("Media Devices: ", streamRef.current);

      const mimeType = getMimeType();
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.addEventListener("dataavailable", async (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
        if (mediaRecorder.state === "inactive") {
          const duration = Date.now() - startTime;

          // Received a stop event
          let blob = new Blob(chunksRef.current, { type: mimeType });

          if (mimeType === "audio/webm") {
            blob = await webmFixDuration(blob, duration, blob.type);
          }

          setRecordedBlob(blob);
          props.onRecordingComplete(blob);

          chunksRef.current = [];
        }
      });
      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
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

  const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDeviceId(event.target.value);
    // Optionally, you might want to stop any ongoing recording and reset the stream
    if (recording) {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  return (
    <div className="flex flex-col justify-center items-center">
      {availableDevices.length > 1 && (
        <div className="mb-4">
          <label htmlFor="audioDevice" className="block text-sm font-medium text-gray-700">
            Select Input Device:
          </label>
          <select
            id="audioDevice"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={selectedDeviceId}
            onChange={handleDeviceChange}
          >
            {availableDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${availableDevices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        className={`m-2 inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all duration-200 ${
          recording
            ? "bg-red-500 hover:bg-red-600"
            : "bg-green-500 hover:bg-green-600"
        }`}
        onClick={handleToggleRecording}
      >
        {recording
          ? `Stop Recording (${formatAudioTimestamp(duration)})`
          : "Start Recording"}
      </button>

      {recordedBlob && (
        <audio className="w-full" ref={audioRef} controls>
          <source src={URL.createObjectURL(recordedBlob)} type={recordedBlob.type} />
        </audio>
      )}
    </div>
  );
}
