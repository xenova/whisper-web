/** @type {import('next').NextConfig} */

const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");



const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  assetPrefix: '.', // https://github.com/vercel/next.js/issues/8158#issuecomment-687707467


  // https://onnxruntime.ai/docs/tutorials/web/classify-images-nextjs-github-template.html#nextconfigjs
  webpack: (config, { }) => {

    config.resolve.extensions.push(".ts", ".tsx");
    config.resolve.fallback = { fs: false };

    config.plugins.push(
      // new NodePolyfillPlugin(),
      new CopyPlugin({
        patterns: [
          {
            from: './node_modules/@xenova/transformers/dist/ort-wasm.wasm',
            to: 'server/dist',
          }, {
            from: './node_modules/@xenova/transformers/dist/ort-wasm-simd.wasm',
            to: 'server/dist',
          }, {
            from: './node_modules/@xenova/transformers/dist/ort-wasm-simd-threaded.wasm',
            to: 'server/dist',
          },
        ],
      }),
    );

    return config;
  }
}

module.exports = nextConfig
