import { DetailedHTMLProps, InputHTMLAttributes } from "react";

export function UrlInput(
    props: DetailedHTMLProps<
        InputHTMLAttributes<HTMLInputElement>,
        HTMLInputElement
    >,
) {
    return (
        <div>
            <input
                {...props}
                type='url'
                className='my-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                placeholder='www.example.com'
                required
            />
        </div>
    );
}
