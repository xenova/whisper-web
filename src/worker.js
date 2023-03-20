
import { pipeline } from '@xenova/transformers'

// Define model factories
// Ensures only one model is created of each type
class PipelineFactory {
    static task = null;
    static model = null;
    static instance = null;

    constructor(tokenizer, model) {
        this.tokenizer = tokenizer;
        this.model = model;
    }

    static async getInstance(progressCallback = null) {
        if (this.task === null || this.model === null) {
            throw Error("Must set task and model")
        }
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, {
                progress_callback: progressCallback
            });
        }

        return this.instance;
    }
}


self.addEventListener('message', async event => {
    const message = event.data;

    // Do some work...
    // TODO use message data
    let transcript = await transcribe(message.audio);

    // Send the result back to the main thread
    self.postMessage({
        type: 'complete',
        task: 'automatic-speech-recognition',
        data: transcript
    });
});



class AutomaticSpeechRecognitionPipelineFactory extends PipelineFactory {
    static task = 'automatic-speech-recognition';
    static model = 'openai/whisper-tiny.en';
}




const transcribe = async (audio) => {
    // Actually run transcription

    let transcriber = await AutomaticSpeechRecognitionPipelineFactory.getInstance(data => {
        self.postMessage({
            type: 'download',
            task: 'automatic-speech-recognition',
            data: data
        });
    })


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

        self.postMessage({
            type: 'update',
            task: 'automatic-speech-recognition',
            data: t
        });
    }

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

    return output;
};
