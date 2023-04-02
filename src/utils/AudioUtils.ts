function padTime(time: number) {
    return String(time).padStart(2, "0");
}

export function formatAudioTimestamp(time: number) {
    const hours = (time / (60 * 60)) | 0;
    time -= hours * (60 * 60);
    const minutes = (time / 60) | 0;
    time -= minutes * 60;
    const seconds = time | 0;
    return `${hours ? padTime(hours) + ":" : ""}${padTime(minutes)}:${padTime(
        seconds,
    )}`;
}
