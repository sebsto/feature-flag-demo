// Import path for resolving file paths
var path = require("path");
module.exports = {

    // Specify the entry point for our app.
    entry: {
      evidently : path.join(__dirname, "src/evidently.ts"), 
      cognito : path.join(__dirname, "src/cognito.ts"),
      appconfig : path.join(__dirname, "src/appconfig.ts")
    },

    // Specify the output file containing our bundled code.
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: '[name].js',
        libraryTarget: "var",
        library: ['EvidentlyDemo', '[name]']
    },

    // Enable WebPack to use the 'path' package.
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        fallback: { path: require.resolve("path-browserify") }
    },

    module: {
        rules: [
          // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
          { test: /\.tsx?$/, use: "ts-loader", exclude: '/node_modules/' }
        ],
      },    

    target: ['web', 'es2022'],

    mode: 'development',

    experiments: {
      topLevelAwait: true,
    },
};