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
exports.HttpAuthProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("./types");
class HttpAuthProvider extends types_1.BasicAuthProvider {
    constructor(url) {
        super();
        this.url = url;
    }
    getUserPasswordSHA1(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.url}?username=${encodeURIComponent(username)}`;
            const { data: ret } = yield axios_1.default.get(url);
            if (ret.error) {
                console.error('http auth', username, ret.error);
                throw new types_1.AuthError(types_1.AuthErrorType.UpstreamError, 'http auth: upstream error');
            }
            return Buffer.from(ret.passwordSHA1, 'hex');
        });
    }
}
exports.HttpAuthProvider = HttpAuthProvider;
//# sourceMappingURL=httpAuthProvider.js.map