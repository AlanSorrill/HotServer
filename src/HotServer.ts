import express, { IRouter, RequestHandler } from 'express'
import webpack, { Configuration, Entry, Stats } from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
// import { clientWebpackConfig, addWebpackListener } from '../Server/ClientWebpackConfig'
import { Server } from 'http'
import path from 'path'
import ws from 'ws'


export type Endpoint = [method: 'GET' | 'POST', path: string, handler: RequestHandler] | [path: string, staticFilePath: string]
export interface HotServer_WebpackConfigOptions { serverIndexPath: string, clientEntries: { [key: string]: Entry } }
export function isEndpointStatic(endpoint: Endpoint): endpoint is [path: string, staticFilePath: string] {
    return endpoint.length == 2;
}
export interface HotServer_Options {
    port: number
    webpackConfigOptions: HotServer_WebpackConfigOptions
}
export class HotServer {
    private options: HotServer_Options
    private endpoints: Endpoint[]
    private httpServer: Server
    private expressApp: express.Express
    private constructor(options: HotServer_Options) {
        this.options = options
    }

    //makes "constructor" async
    static async Create(options: HotServer_Options) {
        let out = new HotServer(options);
        await out.init();
        return out;
    }

    async init() {
        let ths = this;
        console.log('Initializing Server')

        //makes listening for http requests easier
        ths.expressApp = express()

        const router = express.Router();

        const wsServer = new ws.Server({ noServer: true });

        let socketCount = 0;
        wsServer.on('connection', (socket: WebSocket) => {
            let id = `${socketCount++}${Date.now()}`;
            socket.onmessage = message => {
                console.log(message)
            }
            ths.webpackWatchers.set(id, (p: number, m: string) => {
                socket.send(JSON.stringify({ progress: p, message: m }))
            })
            socket.onclose = (closeEvent: CloseEvent) => {
                ths.webpackWatchers.delete(id);
            }
        });

        //static serve files out of the public folder

        ths.expressApp.use(await this.initWebpack())
        ths.expressApp.use(express.json());
        await ths.registerEndpoints();
        // app.post('/registerVoter', async (req, resp) => {
        //     let authToken: string = req.headers.auth as string;
        //     let decodedToken = await firebaseAuth.verifyIdToken(authToken)
        //     let user = await firebaseAuth.getUser(decodedToken.uid);


        //     let fullUserData: User = await database.users.addRow({ email: user.email, role: 'voter', firebaseId: user.uid })

        //     let fullVoterData: Voter = await database.voters.addRow(setValues<Voter>(req.body, { idUser: fullUserData.idUser as any }))
        //     resp.send({
        //         status: 'success',
        //         voterData: fullVoterData
        //     })






        // })
        // app.post('/registerPollMan', async (req, resp) => {
        //     let authToken: string = req.headers.auth as string;
        //     let decodedToken = await firebaseAuth.verifyIdToken(authToken)
        //     let user = await firebaseAuth.getUser(decodedToken.uid);


        //     let fullUserData: User = await database.users.addRow({ email: user.email, role: 'pollMgr', firebaseId: user.uid })

        //     resp.send({
        //         status: 'success',

        //     })


        // })

        // app.post('/registerAdmin', async (req, resp) => {
        //     let authToken: string = req.headers.auth as string;
        //     let decodedToken = await firebaseAuth.verifyIdToken(authToken)
        //     let user = await firebaseAuth.getUser(decodedToken.uid);


        //     let fullUserData: User = await database.users.addRow({ email: user.email, role: 'admin', firebaseId: user.uid })

        //     resp.send({
        //         status: 'success',

        //     })


        // })

        // app.post('/getVoterData', (req, resp) => {
        //     let authToken = req.headers.authToken;
        //     console.log(`Getting voter data for auth token ${authToken}`)
        // });

        // app.use('/', express.static('public'))
        // app.use('*', express.static('public/index.html')) // Allow react router access to generic page matching so not Cannot /GET error appears
        // app.use('/login', express.static('public/index.html')) //Allow react router to route to /login
        // app.use('/register', express.static('public/index.html')) //Allow react router to route to /register
        // app.use('/dashboard', express.static('public/index.html')) //Allow react router to route to /dashboard
        // app.use('/admin', express.static('public/index.html')) //Allow react router to route to /admin
        // app.use('/sql/', router)


        ths.httpServer = ths.expressApp.listen(ths.port, () => {
            console.log(`NodeJS listening on port ${ths.port}`)
        })
        ths.httpServer.on('upgrade', (request, socket, head) => {
            wsServer.handleUpgrade(request, socket, head, socket => {
                wsServer.emit('connection', socket, request);
            });
        });
        // let row = database.users.getLinkedRow('1')
        // database.getUser('1').getUsername();
        // console.log('setting user')
        // database.getUser('1').setUsername('tst')
        // console.log('setUser')
    }
    private buildWebpackConfig(): Configuration {
        let ths = this;

        let out: Configuration = {
            devtool: 'eval-source-map',

            entry: {
                businessServerPackage: {
                    import: ths.webpackConfigOptions.serverIndexPath
                },
                hotServerPackage: {
                    import: './src/HotServer/HotServer.ts'
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
                        ths.onWebpackBuildUpdate(percentage, msg, args)

                    }
                })
            ],
            output: {
                path: path.join(__dirname, '/../public'),
                filename: '[name].js',

                chunkFilename: '[id].[chunkhash].js'
            },


        };
        Object.keys(ths.webpackConfigOptions.clientEntries).forEach((packageName: string) => {
            out.entry[packageName] = ths.webpackConfigOptions.clientEntries[packageName]
        })
        return out;
    }
    private onWebpackBuildUpdate(progress: number, message: string, args: string[]) {
        console.log(`Webpack build ${progress}:${message} ${args.join(' ')}`);
    }
    private async registerEndpoints() {
        let ths = this;
        this.endpoints.forEach((endpoint: Endpoint) => {
            if (isEndpointStatic(endpoint)) {
                ths.expressApp.use(endpoint[0], express.static(endpoint[1]))
                return;
            } else {
                switch (endpoint[0]) {
                    case 'GET':

                        break;
                    case 'POST':
                        // ths.expressApp.post(endpoint[1], (req: , resp) => {

                        // });
                        break;
                }
            }

        })
    }
    async loadServerPackage(packageName: string) {
        let response = await fetch(`localhost:${this.port}/wp/${packageName}.js`)
        let responseText = await response.text();
        let code = eval(responseText);
        console.log(code);
    }
    webpackWatchers: Map<string, (p: number, m: string) => void> = new Map();
    async initWebpack(): Promise<webpackDevMiddleware.API<webpackDevMiddleware.IncomingMessage, webpackDevMiddleware.ServerResponse>> {
        let ths = this;
        return new Promise((acc, rej) => {
            const compiler = webpack(ths.buildWebpackConfig(), (err?: Error, stats?: Stats) => {
                if (stats.hasErrors())
                    console.log(`Webpack Build Error`, err)
            }) as webpack.Compiler;

            let webpackMiddle = webpackDevMiddleware(compiler, {
                publicPath: '/wp/'
            });
            webpackMiddle.waitUntilValid(() => {
                // addWebpackListener((p: number, m: string, a: any[]) => {
                //     this.webpackWatchers.forEach((callback) => {
                //         callback(p, m);
                //     })
                // })
                console.log(`Webpack Initialized`);
                acc(webpackMiddle)
            })
        })
    }


    get port(): number {
        return this.options.port
    }
    get webpackConfigOptions(): HotServer_WebpackConfigOptions {
        return this.options.webpackConfigOptions
    }
}