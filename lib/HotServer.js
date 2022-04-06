"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotServer = exports.isEndpointStatic = void 0;
const express_1 = __importDefault(require("express"));
const webpack_1 = __importDefault(require("webpack"));
const webpack_dev_middleware_1 = __importDefault(require("webpack-dev-middleware"));
const path_1 = __importDefault(require("path"));
const ws_1 = __importDefault(require("ws"));
function isEndpointStatic(endpoint) {
    return endpoint.length == 2;
}
exports.isEndpointStatic = isEndpointStatic;
class HotServer {
    constructor(options) {
        this.webpackWatchers = new Map();
        this.options = options;
    }
    //makes "constructor" async
    static Create(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let out = new HotServer(options);
            yield out.init();
            return out;
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            let ths = this;
            console.log('Initializing Server');
            //makes listening for http requests easier
            ths.expressApp = (0, express_1.default)();
            const router = express_1.default.Router();
            const wsServer = new ws_1.default.Server({ noServer: true });
            let socketCount = 0;
            wsServer.on('connection', (socket) => {
                let id = `${socketCount++}${Date.now()}`;
                socket.onmessage = message => {
                    console.log(message);
                };
                ths.webpackWatchers.set(id, (p, m) => {
                    socket.send(JSON.stringify({ progress: p, message: m }));
                });
                socket.onclose = (closeEvent) => {
                    ths.webpackWatchers.delete(id);
                };
            });
            //static serve files out of the public folder
            ths.expressApp.use(yield this.initWebpack());
            ths.expressApp.use(express_1.default.json());
            yield ths.registerEndpoints();
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
                console.log(`NodeJS listening on port ${ths.port}`);
            });
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
        });
    }
    buildWebpackConfig() {
        let ths = this;
        let out = {
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
                        ths.onWebpackBuildUpdate(percentage, msg, args);
                    }
                })
            ],
            output: {
                path: path_1.default.join(__dirname, '/../public'),
                filename: '[name].js',
                chunkFilename: '[id].[chunkhash].js'
            },
        };
        Object.keys(ths.webpackConfigOptions.clientEntries).forEach((packageName) => {
            out.entry[packageName] = ths.webpackConfigOptions.clientEntries[packageName];
        });
        return out;
    }
    onWebpackBuildUpdate(progress, message, args) {
        console.log(`Webpack build ${progress}:${message} ${args.join(' ')}`);
    }
    registerEndpoints() {
        return __awaiter(this, void 0, void 0, function* () {
            let ths = this;
            this.endpoints.forEach((endpoint) => {
                if (isEndpointStatic(endpoint)) {
                    ths.expressApp.use(endpoint[0], express_1.default.static(endpoint[1]));
                    return;
                }
                else {
                    switch (endpoint[0]) {
                        case 'GET':
                            break;
                        case 'POST':
                            // ths.expressApp.post(endpoint[1], (req: , resp) => {
                            // });
                            break;
                    }
                }
            });
        });
    }
    loadServerPackage(packageName) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield fetch(`localhost:${this.port}/wp/${packageName}.js`);
            let responseText = yield response.text();
            let code = eval(responseText);
            console.log(code);
        });
    }
    initWebpack() {
        return __awaiter(this, void 0, void 0, function* () {
            let ths = this;
            return new Promise((acc, rej) => {
                const compiler = (0, webpack_1.default)(ths.buildWebpackConfig(), (err, stats) => {
                    if (stats.hasErrors())
                        console.log(`Webpack Build Error`, err);
                });
                let webpackMiddle = (0, webpack_dev_middleware_1.default)(compiler, {
                    publicPath: '/wp/'
                });
                webpackMiddle.waitUntilValid(() => {
                    // addWebpackListener((p: number, m: string, a: any[]) => {
                    //     this.webpackWatchers.forEach((callback) => {
                    //         callback(p, m);
                    //     })
                    // })
                    console.log(`Webpack Initialized`);
                    acc(webpackMiddle);
                });
            });
        });
    }
    get port() {
        return this.options.port;
    }
    get webpackConfigOptions() {
        return this.options.webpackConfigOptions;
    }
}
exports.HotServer = HotServer;
//# sourceMappingURL=HotServer.js.map