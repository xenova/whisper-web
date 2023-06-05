import { Transcriber } from "../../hooks/useTranscriber";


export function TaskSelect(props: {
    transcriber: Transcriber;
}) {
    return (
        <>
            <label>Select the task to perform.</label>
            <select
                className='mt-1 mb-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                defaultValue={props.transcriber.subtask}
                onChange={e => {
                    props.transcriber.onSubtaskChange(e.target.value);
                }}
            >
                <option>Transcribe</option>
                <option>Translate</option>
            </select>
        </>
    );
}
