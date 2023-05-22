import { DetailedHTMLProps, SelectHTMLAttributes } from "react";
import { Transcriber } from "../../hooks/useTranscriber";

export function ModelSelect(props: {
    transcriber: Transcriber;
}) {
    return (
        <>
            <label>Select the model to use.</label>
            <select
                className='mt-1 mb-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                defaultValue={props.transcriber.model}
                onChange={(e) => {
                    props.transcriber.onModelChange(e.target.value);
                }}
            >
                <option>whisper-tiny.en (61MB)</option>
                <option>whisper-tiny (61MB)</option>
                <option>whisper-base.en (103MB)</option>
                <option>whisper-base (103MB)</option>
                <option>whisper-small.en (290MB)</option>
                <option>whisper-small (290MB)</option>
            </select>
        </>
    );
}
