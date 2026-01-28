/* eslint-disable camelcase */
import { pipeline, env, WhisperTextStreamer } from "@huggingface/transformers";

// Disable local models
env.allowLocalModels = false;

// Define model factories
// Ensures only one model is created of each type
class PipelineFactory {
    static task = null;
    static model = null;
    static quantized = null;
    static device = null;
    static instance = null;

    constructor(tokenizer, model, quantized, device) {
        this.tokenizer = tokenizer;
        this.model = model;
        this.quantized = quantized;
        this.device = device;
    }

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            const pipelineOptions = {
                progress_callback,
                // For medium models, we need to load the `no_attentions` revision to avoid running out of memory
                revision: this.model.includes("/whisper-medium") ? "no_attentions" : "main"
            };

            // Configure for WebGPU or CPU
            if (this.device === "webgpu") {
                pipelineOptions.dtype = {
                    encoder_model:
                        this.model === "onnx-community/whisper-large-v3-turbo"
                            ? "fp16"
                            : "fp32",
                    decoder_model_merged: "q4", // or 'fp32' ('fp16' is broken)
                };
                pipelineOptions.device = "webgpu";
            } else {
                // CPU mode
                pipelineOptions.quantized = this.quantized;
            }

            this.instance = pipeline(this.task, this.model, pipelineOptions);
        }

        return this.instance;
    }
}

self.addEventListener("message", async (event) => {
    const message = event.data;

    // Do some work...
    let transcript = await transcribe(
        message.audio,
        message.model,
        message.multilingual,
        message.quantized,
        message.subtask,
        message.language,
        message.device || "cpu", // Default to CPU if not specified
    );
    if (transcript === null) return;

    // Send the result back to the main thread
    self.postMessage({
        status: "complete",
        task: "automatic-speech-recognition",
        data: transcript,
    });
});

class AutomaticSpeechRecognitionPipelineFactory extends PipelineFactory {
    static task = "automatic-speech-recognition";
    static model = null;
    static quantized = null;
    static device = null;
}

const transcribe = async (
    audio,
    model,
    multilingual,
    quantized,
    subtask,
    language,
    device,
) => {

    const isDistilWhisper = model.startsWith("distil-whisper/");

    let modelName = model;
    if (!isDistilWhisper && !multilingual && device === "cpu") {
        modelName += ".en"
    }

    const p = AutomaticSpeechRecognitionPipelineFactory;
    if (p.model !== modelName || p.quantized !== quantized || p.device !== device) {
        // Invalidate model if different
        p.model = modelName;
        p.quantized = quantized;
        p.device = device;

        if (p.instance !== null) {
            (await p.getInstance()).dispose();
            p.instance = null;
        }
    }

    // Load transcriber model
    let transcriber = await p.getInstance((data) => {
        self.postMessage(data);
    });

    const time_precision =
        transcriber.processor.feature_extractor.config.chunk_length /
        transcriber.model.config.max_source_positions;

    const chunk_length_s = isDistilWhisper ? 20 : 30;
    const stride_length_s = isDistilWhisper ? 3 : 5;

    // WebGPU mode uses different streaming approach
    if (device === "webgpu") {
        // Storage for chunks to be processed
        const chunks = [];
        let chunk_count = 0;
        let start_time;
        let num_tokens = 0;
        let tps;

        const streamer = new WhisperTextStreamer(transcriber.tokenizer, {
            time_precision,
            on_chunk_start: (x) => {
                const offset = (chunk_length_s - stride_length_s) * chunk_count;
                chunks.push({
                    text: "",
                    timestamp: [offset + x, null],
                    finalised: false,
                    offset,
                });
            },
            token_callback_function: (x) => {
                start_time ??= performance.now();
                if (num_tokens++ > 0) {
                    tps = (num_tokens / (performance.now() - start_time)) * 1000;
                }
            },
            callback_function: (x) => {
                if (chunks.length === 0) return;
                // Append text to the last chunk
                chunks.at(-1).text += x;

                self.postMessage({
                    status: "update",
                    task: "automatic-speech-recognition",
                    data: {
                        text: "", // No need to send full text yet
                        chunks,
                        tps,
                    },
                });
            },
            on_chunk_end: (x) => {
                const current = chunks.at(-1);
                current.timestamp[1] = x + current.offset;
                current.finalised = true;
            },
            on_finalize: () => {
                start_time = null;
                num_tokens = 0;
                ++chunk_count;
            },
        });

        // Actually run transcription with WebGPU streamer
        const output = await transcriber(audio, {
            // Greedy
            top_k: 0,
            do_sample: false,

            // Sliding window
            chunk_length_s,
            stride_length_s,

            // Language and task
            language,
            task: subtask,

            // Return timestamps
            return_timestamps: true,
            force_full_sequences: false,

            // Callback functions
            streamer,
        }).catch((error) => {
            console.error(error);
            self.postMessage({
                status: "error",
                task: "automatic-speech-recognition",
                data: error,
            });
            return null;
        });

        return {
            tps,
            ...output,
        };
    } else {
        // CPU mode - use original callback approach
        // Storage for chunks to be processed. Initialise with an empty chunk.
        let chunks_to_process = [
            {
                tokens: [],
                finalised: false,
            },
        ];

        function chunk_callback(chunk) {
            let last = chunks_to_process[chunks_to_process.length - 1];

            // Overwrite last chunk with new info
            Object.assign(last, chunk);
            last.finalised = true;

            // Create an empty chunk after, if it not the last chunk
            if (!chunk.is_last) {
                chunks_to_process.push({
                    tokens: [],
                    finalised: false,
                });
            }
        }

        // Inject custom callback function to handle merging of chunks
        function callback_function(item) {
            let last = chunks_to_process[chunks_to_process.length - 1];

            // Update tokens of last chunk
            last.tokens = [...item[0].output_token_ids];

            // Merge text chunks
            let data = transcriber.tokenizer._decode_asr(chunks_to_process, {
                time_precision: time_precision,
                return_timestamps: true,
                force_full_sequences: false,
            });

            self.postMessage({
                status: "update",
                task: "automatic-speech-recognition",
                data: data,
            });
        }

        // Actually run transcription
        let output = await transcriber(audio, {
            // Greedy
            top_k: 0,
            do_sample: false,

            // Sliding window
            chunk_length_s,
            stride_length_s,

            // Language and task
            language: language,
            task: subtask,

            // Return timestamps
            return_timestamps: true,
            force_full_sequences: false,

            // Callback functions
            callback_function: callback_function, // after each generation step
            chunk_callback: chunk_callback, // after each chunk is processed
        }).catch((error) => {
            self.postMessage({
                status: "error",
                task: "automatic-speech-recognition",
                data: error,
            });
            return null;
        });

        return output;
    }
};
