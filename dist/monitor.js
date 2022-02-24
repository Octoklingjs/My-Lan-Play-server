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
exports.ServerMonitor = void 0;
const koa_1 = __importDefault(require("koa"));
const koa2_cors_1 = __importDefault(require("koa2-cors"));
const koa_router_1 = __importDefault(require("koa-router"));
const path_1 = require("path");
const pkg = require(path_1.join(__dirname, '..', 'package.json'));
class ServerMonitor {
    constructor(server) {
        this.server = server;
        this.router = new koa_router_1.default();
        this.app = new koa_1.default();
        this.router.all('*', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield next();
            }
            catch (err) {
                console.error(err);
                ctx.status = err.statusCode || err.status || 500;
                ctx.body = {
                    error: 'server exceptions'
                };
            }
        }));
        this.router.get('/info', (ctx) => __awaiter(this, void 0, void 0, function* () { return this.handleGetInfo(ctx); }));
    }
    start(port) {
        this.app.use(koa2_cors_1.default());
        this.app.use(this.router.routes());
        this.app.listen(port);
        console.log(`\nMonitor service started on port ${port}/tcp`);
        console.log(`***************************************`);
    }
    handleGetInfo(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const size = this.server.getClientSize();
            ctx.type = 'application/json';
            ctx.body = {
                online: size,
                version: pkg.version
            };
        });
    }
}
exports.ServerMonitor = ServerMonitor;
//# sourceMappingURL=monitor.js.map