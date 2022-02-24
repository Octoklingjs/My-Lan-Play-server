"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const udpserver_1 = require("./udpserver");
const monitor_1 = require("./monitor");
const auth_1 = require("./auth");
const CustomAuthProvider_1 = require("./auth/CustomAuthProvider");
function parseArgs2Obj(args) {
    let argsObj = {};
    for (let i = 0; i < args.length; i += 2) {
        let key = args[i];
        let value = args[i + 1];
        if (key.startsWith('--')) {
            argsObj[key.slice(2)] = value;
        }
    }
    return argsObj;
}
function main(argv) {
    let argsObj = parseArgs2Obj(argv);
    let provider;
    const { USE_HTTP_PROVIDER } = process.env;
    if (USE_HTTP_PROVIDER) {
        provider = new auth_1.HttpAuthProvider(USE_HTTP_PROVIDER);
        console.log(`using HttpAuthProvider url: ${USE_HTTP_PROVIDER}`);
    }
    else if (argsObj.httpAuth) {
        provider = new auth_1.HttpAuthProvider(argsObj.httpAuth);
        console.log(`using HttpAuthProvider url: ${argsObj.httpAuth}`);
    }
    else if (argsObj.jsonAuth) {
        provider = new auth_1.JsonAuthProvider(argsObj.jsonAuth);
        console.log(`using JsonAuthProvider file: ${argsObj.jsonAuth}`);
    }
    else if (argsObj.simpleAuth) {
        let username_password = argsObj.simpleAuth.split(':');
        let username = username_password[0];
        let password = username_password[1];
        provider = new CustomAuthProvider_1.CustomAuthProvider(username, password);
        console.log(`using simple auth with username=${username} password=${password}`);
    }
    const portNum = parseInt(argsObj.port || '11451');
    let s = new udpserver_1.SLPServer(portNum, provider);
    let monitor = new monitor_1.ServerMonitor(s);
    monitor.start(portNum);
}
main(process.argv.slice(2));
//# sourceMappingURL=main.js.map