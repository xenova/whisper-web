import React from "react"

export function AudioManager(){
    return <div className="flex space-x-4 justify-center items-center p-4 w-[41rem] rounded-lg bg-white shadow-xl shadow-black/5 ring-1 ring-slate-700/10">
        < Tile icon={<AnchorIcon />} text={"Download from URL"}/>
        < Tile icon={<FolderIcon />} text={"Drag and drop a file"}/>    
        < Tile icon={<MicrophoneIcon />} text={"Record with microphone"}/>
    </div>
}

function Tile(props: { icon: JSX.Element; text: string }){
    return <div className="flex flex-col items-center rounded-lg p-4 bg-blue text-slate-500 hover:text-indigo-600 transition-all duration-400">
        <div className="w-7 h-7 mb-3">
            {props.icon}
        </div>
        <div className="break-text text-center text-md w-30">
            {props.text}
        </div>
    </div>
}

function AnchorIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
}

function FolderIcon(){
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
  </svg>
}

function MicrophoneIcon(){
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
  
}