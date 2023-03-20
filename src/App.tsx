import { useState } from 'react';
import { pipeline } from '@xenova/transformers';

import AudioPlayer from './components/AudioPlayer'
import Transcript from './components/Transcript'


function App() {

  const [model, setModel] = useState<Promise<any> | null>(null);
  const [transcript, setTranscript] = useState('');


  const loadModel = async () => {
    const model = await pipeline('automatic-speech-recognition');
    return model;
  }

  const transcribe = async () => {

    // Little trick to do the following:
    //  (1) only load the model once
    //  (2) pause if function run and model still loading
    let transcriber = await model;
    if (!transcriber) {
      transcriber = loadModel();
      setModel(transcriber);
      transcriber = await transcriber;
    }

    // Actually run transcription

    // Specify audio track(s)
    // TODO allow user to change/upload
    let audio = 'https://xenova.github.io/transformers.js/assets/audio/ted_60.wav';


    const time_precision = transcriber.processor.feature_extractor.config.chunk_length / transcriber.model.config.max_source_positions;
    let all_chunks = [{
      tokens: [],
      finalised: false
    }];




    // Inject custom callback function to handle merging of chunks
    function callback_function(item) {
      let last = all_chunks[all_chunks.length - 1];

      // TODO add type to callback
      // For now, we determine whether it is a beam, or a chunk by its type:
      let isBeam = Array.isArray(item);
      if (isBeam) { // beam 
        last.tokens = [...item[0].output_token_ids];
      } else { // chunk
        // Overwrite last chunk with new info
        Object.assign(last, item);
        last.finalised = true;
      }

      let chunks = all_chunks.filter(x => x.finalised);
      let [t, _] = transcriber.tokenizer._decode_asr(chunks, {
        time_precision: time_precision,
        return_timestamps: true,
        force_full_sequences: false
      })

      if (!last.finalised) {
        // last one isn't finalsed, so we append text
        t += transcriber.tokenizer.decode(last.tokens, {
          skip_special_tokens: true,
        })
      }

      // Create an empty chunk after
      if (!isBeam && !item.is_last) {
        all_chunks.push({
          tokens: [],
          finalised: false
        })
      }

      setTranscript(t);
    }



    // TODO run in worker.js
    // Currently, it runs in the main thread, which freezes the UI and prevents any updates
    let output = await transcriber(audio, {
      max_new_tokens: Infinity,

      // Greedy
      top_k: 0,
      do_sample: false,

      // Sliding window
      chunk_length_s: 30,
      stride_length_s: 5,

      // Return timestamps
      return_timestamps: true,

      // Return finalised chunks
      return_chunks: true,

      // Run callback after each generation step
      callback_function: callback_function
    });

    // TODO format properly
    setTranscript(JSON.stringify(output));
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-7xl">Whisper Web</h1>
      <h2 className="mt-3 mb-3 text-1xl font-semibold tracking-tight text-slate-900 sm:text-2xl">AI speech-to-text directly in your browser</h2>

      <AudioPlayer />

      <button
        onClick={transcribe}
        className="bg-slate-900 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 text-white font-semibold h-12 px-6 rounded-lg w-full flex items-center justify-center sm:w-auto dark:bg-sky-500 dark:highlight-white/20 dark:hover:bg-sky-400">
        Transcribe
      </button>

      <Transcript value={transcript} />
    </div>
  );
}

export default App;
