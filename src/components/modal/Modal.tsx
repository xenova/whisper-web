import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

export interface Props {
    show: boolean;
    onClose: () => void;
    onSubmit: () => void;
    submitText?: string;
    submitEnabled?: boolean;
    title: string | JSX.Element;
    content: string | JSX.Element;
}

export default function Modal({
    show,
    onClose,
    onSubmit,
    title,
    content,
    submitText,
    submitEnabled = true,
}: Props) {
    return (
        <Transition appear show={show} as={Fragment}>
            <Dialog as='div' className='relative z-10' onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter='ease-out duration-300'
                    enterFrom='opacity-0'
                    enterTo='opacity-100'
                    leave='ease-in duration-200'
                    leaveFrom='opacity-100'
                    leaveTo='opacity-0'
                >
                    <div className='fixed inset-0 bg-black bg-opacity-25' />
                </Transition.Child>

                <div className='fixed inset-0 overflow-y-auto'>
                    <div className='flex min-h-full items-center justify-center p-4 text-center'>
                        <Transition.Child
                            as={Fragment}
                            enter='ease-out duration-300'
                            enterFrom='opacity-0 scale-95'
                            enterTo='opacity-100 scale-100'
                            leave='ease-in duration-200'
                            leaveFrom='opacity-100 scale-100'
                            leaveTo='opacity-0 scale-95'
                        >
                            <Dialog.Panel className='w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all'>
                                <Dialog.Title
                                    as='h3'
                                    className='text-lg font-medium leading-6 text-gray-900'
                                >
                                    {title}
                                </Dialog.Title>
                                <div className='mt-3 text-sm text-gray-500'>
                                    {content}
                                </div>

                                <div className='mt-4 flex flex-row-reverse'>
                                    {submitText && (
                                        <button
                                            type='button'
                                            disabled={!submitEnabled}
                                            className={`inline-flex ml-4 justify-center rounded-md border border-transparent ${
                                                submitEnabled
                                                    ? "bg-indigo-600"
                                                    : "bg-grey-300"
                                            } px-4 py-2 text-sm font-medium text-indigo-100 ${
                                                submitEnabled
                                                    ? "hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                                    : ""
                                            } transition-all duration-300`}
                                            onClick={onSubmit}
                                        >
                                            {submitText}
                                        </button>
                                    )}
                                    <button
                                        type='button'
                                        className='inline-flex justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all duration-300'
                                        onClick={onClose}
                                    >
                                        Close
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
