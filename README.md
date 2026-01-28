# Whisper Web

ML-powered speech recognition directly in your browser! Built with [🤗 Transformers.js](https://github.com/xenova/transformers.js).

Check out the demo site [here](https://huggingface.co/spaces/Xenova/whisper-web). 


https://github.com/xenova/whisper-web/assets/26504141/fb170d84-9678-41b5-9248-a112ecc74c27

## Running locally

1. Clone the repo and install dependencies:

    ```bash
    git clone https://github.com/xenova/whisper-web.git
    cd whisper-web
    npm install
    ```

2. Run the development server:

    ```bash
    npm run dev
    ```
    > Firefox users need to change the `dom.workers.modules.enabled` setting in `about:config` to `true` to enable Web Workers.
    > Check out [this issue](https://github.com/xenova/whisper-web/issues/8) for more details.

3. Open the link (e.g., [http://localhost:5173/](http://localhost:5173/)) in your browser.

## Using WebGPU for faster inference

For improved performance, you can enable WebGPU acceleration:

1. **Select WebGPU in the application**: When running the app, you'll find a device selector option where you can choose "WebGPU" instead of "CPU (WASM)" for hardware-accelerated inference.

2. **Enable WebGPU in Chrome** (if not already enabled):
   - Open `chrome://flags` in your browser
   - Search for and enable the following flags:
     - **`#enable-unsafe-webgpu`** - Set to "Enabled"
     - **`#enable-vulkan`** - Set to "Enabled" (required for WebGPU backend)
     - **`#default-angle-vulkan`** - - Set to "Enabled" (required for WebGPU on Linux)
   - Restart Chrome for changes to take effect
   - Verify WebGPU is available by checking `chrome://gpu` and looking for "WebGPU: Hardware accelerated", and ensuring the correct GPU is selected.

> **Note**: WebGPU support varies by platform and browser. Ensure your GPU drivers are up to date for the best experience.
