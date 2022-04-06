import { RequestHandler } from 'express';
import { Entry } from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
export declare type Endpoint = [method: 'GET' | 'POST', path: string, handler: RequestHandler] | [path: string, staticFilePath: string];
export interface HotServer_WebpackConfigOptions {
    serverIndexPath: string;
    clientEntries: {
        [key: string]: Entry;
    };
}
export declare function isEndpointStatic(endpoint: Endpoint): endpoint is [path: string, staticFilePath: string];
export interface HotServer_Options {
    port: number;
    webpackConfigOptions: HotServer_WebpackConfigOptions;
}
export declare class HotServer {
    private options;
    private endpoints;
    private httpServer;
    private expressApp;
    private constructor();
    static Create(options: HotServer_Options): Promise<HotServer>;
    init(): Promise<void>;
    private buildWebpackConfig;
    private onWebpackBuildUpdate;
    private registerEndpoints;
    loadServerPackage(packageName: string): Promise<void>;
    webpackWatchers: Map<string, (p: number, m: string) => void>;
    initWebpack(): Promise<webpackDevMiddleware.API<webpackDevMiddleware.IncomingMessage, webpackDevMiddleware.ServerResponse>>;
    get port(): number;
    get webpackConfigOptions(): HotServer_WebpackConfigOptions;
}
//# sourceMappingURL=HotServer.d.ts.map