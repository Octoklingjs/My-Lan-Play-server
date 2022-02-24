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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHA1 = exports.BasicAuthProvider = exports.AuthError = exports.AuthErrorType = void 0;
const crypto_1 = require("crypto");
var AuthErrorType;
(function (AuthErrorType) {
    AuthErrorType[AuthErrorType["NoSuchUser"] = 0] = "NoSuchUser";
    AuthErrorType[AuthErrorType["UpstreamError"] = 1] = "UpstreamError";
})(AuthErrorType = exports.AuthErrorType || (exports.AuthErrorType = {}));
class AuthError extends Error {
    constructor(type, message) {
        super(message);
        this.type = type;
    }
}
exports.AuthError = AuthError;
class BasicAuthProvider {
    verify(username, challenge, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const sha1 = yield this.getUserPasswordSHA1(username);
            return SHA1(Buffer.concat([sha1, challenge])).equals(response);
        });
    }
}
exports.BasicAuthProvider = BasicAuthProvider;
function SHA1(data) {
    const hash = crypto_1.createHash('SHA1');
    hash.update(data);
    return hash.digest();
}
exports.SHA1 = SHA1;
//# sourceMappingURL=types.js.map