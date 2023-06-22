const HOURS_IN_SECONDS = 3600;
const MINUTES_IN_SECONDS = 60;

function padTime(time: number, padding: number = 2) {
    return String(time).padStart(padding, "0");
}

function formatTimestamp(time: number) {

    const hours = Math.floor(time / HOURS_IN_SECONDS);
    const hoursRemainder = time - hours * HOURS_IN_SECONDS;

    const minutes = Math.floor(hoursRemainder / MINUTES_IN_SECONDS);
    const minutesRemainder = hoursRemainder - minutes * MINUTES_IN_SECONDS;

    const seconds = Math.floor(minutesRemainder);
    const secondsRemainder = minutesRemainder - seconds;

    const milliseconds = Math.floor(secondsRemainder * 1000);

    return { hours, minutes, seconds, milliseconds };
}

export function formatAudioTimestamp(time: number) {

    const { hours, minutes, seconds } = formatTimestamp(time);

    // Hide hours if not needed
    const hoursString = hours ? padTime(hours) + ":" : "";
    const minutesString = padTime(minutes) + ":";
    const secondsString = padTime(seconds);

    return `${hoursString}${minutesString}${secondsString}`;
}

function formatSrtTimestamp(time: number) {

    const { hours, minutes, seconds, milliseconds } = formatTimestamp(time);

    const hoursString = padTime(hours) + ":";
    const minutesString = padTime(minutes) + ":";
    const secondsString = padTime(seconds) + ",";
    const millisecondsString = padTime(milliseconds, 3);

    return `${hoursString}${minutesString}${secondsString}${millisecondsString}`;
}


export function formatSrtTimeRange(start: number, end: number) {
    return `${formatSrtTimestamp(start)} --> ${formatSrtTimestamp(end)}`;
}