'use client'
import Image from 'next/image'
import {ChangeEvent, useRef, useState} from "react";
import {FileWrap} from "@/app/entities/lib";
import {Embedding} from "@/app/api/fetch/embedding";
import splitAndEmbed from "@/app/api/fetch/embedding";
import {useChat} from "ai/react";
import {embed} from "@/app/cached/embed";
import {set} from "lodash-es";


type Options = {
    content: string;
    docType: string;
    encoding: string;
    message: string;
    chatHistory: [];
    embeddings: Embedding[]
}
export default function Home() {
    const [content, setContent] = useState<string>("")
    const [docType, setDocType] = useState<string>("")
    const [encoding, setEncoding] = useState<string>("")
    const options = useRef<Options>({
        content: "some initial content",
        docType: "",
        encoding: "",
        embeddings: embed,
        message: "",
        chatHistory: []})
    const {handleInputChange,handleSubmit,messages, stop, isLoading } = useChat({
        api: "/api/chat",
        body: options.current
    })
    //const [embeddings, setEmbeddings] = useState<Embedding[]>()
    const oninputChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if(!!event.target.files){
            const file = event.target.files[0];
            const fileWrap = new FileWrap(file);
            const result = await fileWrap.wrapped();
            const body =
                {
                    fileName: fileWrap.name,
                    ...result
                }
            const response = await fetch("./api/fetch",{
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            })
            const data = await response.json();
            const {content, docType, encoding, embeddings} = data
            if (!response.ok) throw new Error(data.error);
            console.log(data.embeddings)
            const message = "Summarize the given context briefly in 200 words or less";
            options.current = {...data, message: message, chatHistory: []}
        }

    }

    return (
        <main className="flex min-h-screen flex-col justify-between items-center p-14 pt-6 h-screen pb-2">
            <h3 className="mb-2">Doc-Query Chat</h3>
            <div className={`p-2 max-w-3xl rounded-t-2xl h-full w-full overflow-y-auto relative border border-white border-b-0`}>
                {messages.map(m => (
                    <div key={m.id}>
                        <h6>
                            {m.role === 'user' ? '' : 'AI: '}
                        </h6>
                        <div key={m.id} className={`p-2 m-2 mb-4 rounded w-fit ${m.role === 'user' ? 'bg-sky-800 ml-auto' : 'bg-gray-900 mr-16'}`}>
                            <p>{m.content}</p>
                        </div>
                    </div>
                ))}
                <button
                    className={`rounded-md bg-pink-900 p-2 pt-1 pb-1 text-white mb-1 active:bg-pink-950 sticky bottom-0 ${isLoading ? '' : 'hidden'}`}
                    onClick={stop}
                >
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-player-stop mr-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M5 5m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z"></path>
                        </svg> <span>Stop</span>
                    </div>
                </button>
            </div>
            <form className="w-full max-w-3xl bottom-0 bg-transparent" onSubmit={handleSubmit}>
                <div className="text-black bg-slate-300 w-full rounded-b-md focus:outline-none flex items-center pt-0 pb-0">
                    <textarea
                        placeholder="Type your messages here"
                        className="text-black bg-slate-300 px-3 py-2 w-full rounded-b-md focus:outline-none resize-none"
                        onChange={handleInputChange}
                    >
                    </textarea>
                    <input className="mt-4 hidden" type="file" id="fileInput" onChange={(e)=>oninputChange(e)}/>
                    <label htmlFor="fileInput" className="p-0 border-none bg-transparent text-cyan-600 cursor-pointer active:text-cyan-950">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-file-upload" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" shapeRendering="auto">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
                            <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path>
                            <path d="M12 11v6"></path>
                            <path d="M9.5 13.5l2.5 -2.5l2.5 2.5"></path>
                        </svg>
                    </label>

                    <button className="p-0 border-none bg-transparent ml-1 mr-1 text-cyan-600 active:text-cyan-950" type="submit" >
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-send antialiased" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" shapeRendering="auto">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M10 14l11 -11"></path>
                            <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"></path>
                        </svg>
                    </button>
                </div>
            </form>
        </main>
  )
}
