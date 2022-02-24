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
exports.JsonAuthProvider = void 0;
const fs_1 = require("fs");
const util_1 = require("util");
const types_1 = require("./types");
const readFile = util_1.promisify(fs_1.readFile);
class JsonAuthProvider extends types_1.BasicAuthProvider {
    constructor(filename) {
        super();
        this.filename = filename;
        this.table = {};
        fs_1.watch(filename, {
            persistent: false
        }, (event, filename) => {
            console.log(event, filename);
            this.read();
        });
        this.read();
    }
    read() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.table = {};
                this.table = JSON.parse(yield readFile(this.filename, 'utf-8'));
                this.table['$schema'] = undefined;
            }
            catch (e) {
                console.error(`Fail to parse: ${e}`);
            }
        });
    }
    getUserPasswordSHA1(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const pw = this.table[username];
            if (pw === undefined) {
                throw new types_1.AuthError(types_1.AuthErrorType.NoSuchUser, 'No such user');
            }
            let ret;
            if (typeof pw === 'string') {
                ret = types_1.SHA1(pw);
            }
            else {
                ret = Buffer.from(pw.sha1, 'hex');
            }
            return ret;
        });
    }
}
exports.JsonAuthProvider = JsonAuthProvider;
//# sourceMappingURL=jsonAuthProvider.js.map