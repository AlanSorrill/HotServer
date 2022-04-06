import webpack, { Configuration } from 'webpack';
import path from 'path';

let webpackBuildListeners: ((p: number, m: string, a: any[])=>void)[] = []
function addWebpackListener(callback: (p: number, m: string, a: any[])=>void){
    webpackBuildListeners.push(callback);
}
let clientWebpackConfig: Configuration = {
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
            use: ["style-loader","css-loader"]
            
        }]
    },
    // externals: [

    // ],

    mode: 'development',
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],


    },
    plugins: [
        new webpack.ProgressPlugin({
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
            handler: (percentage: number, msg: string, ...args) => {
                webpackBuildListeners.forEach((value: (p: number, m: string, a: any[])=>void)=>{
                    value(percentage, msg, args);
                })
                
            }
        })
    ],
    output: {
        path: path.join(__dirname, '/../public'),
        filename: '[name].js',

        chunkFilename: '[id].[chunkhash].js'
    },


};
export { clientWebpackConfig, addWebpackListener }