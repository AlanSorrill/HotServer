"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addWebpackListener = exports.clientWebpackConfig = void 0;
const webpack_1 = __importDefault(require("webpack"));
const path_1 = __importDefault(require("path"));
let webpackBuildListeners = [];
function addWebpackListener(callback) {
    webpackBuildListeners.push(callback);
}
exports.addWebpackListener = addWebpackListener;
let clientWebpackConfig = {
    devtool: 'source-map',
    entry: {
        lib: {
            import: ['react', 'react-dom']
        },
        clientBundle: {
            import: './src/Client/ClientIndex.tsx',
            dependOn: 'lib'
        },
    },
    watch: true,
    cache: {
        type: 'memory'
    },
    target: 'web',
    module: {
        rules: [{
                test: /.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
                exclude: /node_modules/
            }, {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            }]
    },
    // externals: [
    // ],
    mode: 'development',
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        new webpack_1.default.ProgressPlugin({
            //   /**
            //  * Show active modules count and one active module in progress message
            //  * Default: true
            //  */
            // activeModules?: boolean;
            // /**
            //  * Show entries count in progress message
            //  * Default: false
            //  */
            // entries?: boolean;
            // /**
            //  * Function that executes for every progress step
            //  */
            // handler?: Handler;
            // /**
            //  * Show modules count in progress message
            //  * Default: true
            //  */
            // modules?: boolean;
            // /**
            //  * Minimum modules count to start with, only for mode = modules
            //  * Default: 500
            //  */
            // modulesCount?: number;
            // /**
            //  * Collect profile data for progress steps
            //  * Default: false
            //  */
            // profile?: boolean | null;
            //   percentBy: 'dependencies',
            handler: (percentage, msg, ...args) => {
                webpackBuildListeners.forEach((value) => {
                    value(percentage, msg, args);
                });
            }
        })
    ],
    output: {
        path: path_1.default.join(__dirname, '/../public'),
        filename: '[name].js',
        chunkFilename: '[id].[chunkhash].js'
    },
};
exports.clientWebpackConfig = clientWebpackConfig;
//# sourceMappingURL=HotServerWebpackConfig.js.map