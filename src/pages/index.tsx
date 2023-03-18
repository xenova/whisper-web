import { pipeline, env } from '@xenova/transformers'

// 2. Disable spawning worker threads
// This is done by setting numThreads to 1
env.onnx.wasm.numThreads = 1


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
            this.instance = await pipeline(this.task, this.model, {
                progress_callback: progressCallback
            });
        }

        return this.instance;
    }
}

class WhisperFactory extends PipelineFactory {
    static task = 'automatic-speech-recognition';
    static model = 'openai/whisper-tiny.en';
}


const HomePage = () => {
    let pipeline = WhisperFactory.getInstance();
    // TODO add logic here

    return <h1>Hello from NextJS 13!</h1>;
};

export default HomePage;