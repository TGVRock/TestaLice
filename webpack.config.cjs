const path = require('path');
const webpack = require('webpack')

module.exports = {
  mode: "development",
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [{
      test: /\.ts$/,
      use: 'ts-loader',
      exclude: /node_modules/
    }]
  },
  resolve: {
    extensions: ['.ts', '.js', '.wasm'],
    fallback: {
      assert: require.resolve("assert"),
      buffer: require.resolve("buffer"),
      crypto: require.resolve("crypto-browserify"),
      path: require.resolve('path-browserify'),
      process: require.resolve('process/browser'),
      stream: require.resolve('stream-browserify'),
      url: require.resolve('url'),
      fs: false,
    },
  },
  experiments : {
    asyncWebAssembly: true,
    topLevelAwait: true,
    layers: true,
  },
  plugins: [
    // fix "process is not defined" error:
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
    new webpack.NormalModuleReplacementPlugin(
      /symbol-crypto-wasm-node/,
      '../../../symbol-crypto-wasm-web/symbol_crypto_wasm.js'
    ),
  ]
}
