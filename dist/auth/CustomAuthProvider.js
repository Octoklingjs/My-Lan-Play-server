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
exports.CustomAuthProvider = void 0;
const types_1 = require("./types");
class CustomAuthProvider extends types_1.BasicAuthProvider {
    constructor(username, password) {
        super();
        this.username = username;
        this.password = password;
        this.sha1 = types_1.SHA1(this.password);
    }
    getUserPasswordSHA1(username) {
        return __awaiter(this, void 0, void 0, function* () {
            if (username !== this.username) {
                throw new types_1.AuthError(types_1.AuthErrorType.NoSuchUser, 'No such user');
            }
            return this.sha1;
        });
    }
}
exports.CustomAuthProvider = CustomAuthProvider;
//# sourceMappingURL=CustomAuthProvider.js.map