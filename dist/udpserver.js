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
exports.SLPServer = void 0;
const dgram_1 = require("dgram");
const crypto_1 = require("crypto");
const randomFill = (buf, offset) => new Promise((res, rej) => crypto_1.randomFill(buf, offset, (err, buf) => {
    if (err) {
        return rej(err);
    }
    res(buf);
}));
const Timeout = 30 * 1000;
const IPV4_OFF_SRC = 12;
const IPV4_OFF_DST = 16;
const OutputEncrypt = false;
var ForwarderType;
(function (ForwarderType) {
    ForwarderType[ForwarderType["Keepalive"] = 0] = "Keepalive";
    ForwarderType[ForwarderType["Ipv4"] = 1] = "Ipv4";
    ForwarderType[ForwarderType["Ping"] = 2] = "Ping";
    ForwarderType[ForwarderType["Ipv4Frag"] = 3] = "Ipv4Frag";
    ForwarderType[ForwarderType["AuthMe"] = 4] = "AuthMe";
    ForwarderType[ForwarderType["Info"] = 16] = "Info";
})(ForwarderType || (ForwarderType = {}));
const ForwarderTypeMap = {
    [ForwarderType.Keepalive]: Buffer.from([ForwarderType.Keepalive]),
    [ForwarderType.Ipv4]: Buffer.from([ForwarderType.Ipv4]),
    [ForwarderType.Ping]: Buffer.from([ForwarderType.Ping]),
    [ForwarderType.Ipv4Frag]: Buffer.from([ForwarderType.Ipv4Frag]),
    [ForwarderType.AuthMe]: Buffer.from([ForwarderType.AuthMe]),
    [ForwarderType.Info]: Buffer.from([ForwarderType.Info]),
};
function clearCacheItem(map) {
    const now = Date.now();
    for (const [key, { expireAt }] of map) {
        if (expireAt < now) {
            map.delete(key);
        }
    }
}
function addr2str(rinfo) {
    return `${rinfo.address}:${rinfo.port}`;
}
function withTimeout(promise, ms) {
    return new Promise((res, rej) => {
        promise.then(res, rej);
        setTimeout(() => rej(new Error('Timeout')), ms);
    });
}
function lookup4(hostname, options, callback) {
    callback(null, hostname, 4);
}
function lookup6(hostname, options, callback) {
    callback(null, hostname, 6);
}
class User {
    constructor(username) {
        this.username = username;
    }
}
class Peer {
    constructor(rinfo) {
        this.rinfo = rinfo;
    }
}
class PeerManager {
    constructor() {
        this.map = new Map();
    }
    delete(rinfo) {
        return this.map.delete(addr2str(rinfo));
    }
    get(rinfo) {
        const key = addr2str(rinfo);
        const map = this.map;
        const expireAt = Date.now() + Timeout;
        let i = map.get(key);
        if (i === undefined) {
            i = {
                expireAt,
                peer: new Peer(rinfo)
            };
            map.set(key, i);
        }
        else {
            i.expireAt = expireAt;
        }
        return i.peer;
    }
    clearExpire() {
        clearCacheItem(this.map);
    }
    get size() {
        return this.map.size;
    }
    getLogin() {
        let count = 0;
        for (const i of this.map.values()) {
            if (i.peer.user) {
                count += 1;
            }
        }
        return count;
    }
    *all(except) {
        const exceptStr = addr2str(except);
        for (let [key, { peer }] of this.map) {
            if (exceptStr === key)
                continue;
            yield peer;
        }
    }
}
class SLPServer {
    constructor(port, authProvider) {
        this.authProvider = authProvider;
        this.ipCache = new Map();
        this.manager = new PeerManager();
        this.byteLastSec = {
            upload: 0,
            download: 0
        };
        const server = dgram_1.createSocket({
            type: 'udp6',
            lookup: lookup6
        });
        server.on('error', (err) => this.onError(err));
        server.on('close', () => this.onClose());
        server.on('message', (msg, rinfo) => this.onMessage(msg, rinfo));
        server.bind(port);
        this.server = server;
        setInterval(() => {
            const str = `  Client count: ${this.manager.size} upload: ${this.byteLastSec.upload / 1000}KB/s download: ${this.byteLastSec.download / 1000}KB/s`;
            process.stdout.write(str);
            process.stdout.write('\b'.repeat(str.length));
            this.byteLastSec.upload = 0;
            this.byteLastSec.download = 0;
            this.clearExpire();
        }, 1000);
    }
    getClientSize() {
        return this.manager.size;
    }
    parseHead(msg) {
        const firstByte = msg.readUInt8(0);
        return {
            type: firstByte & 0x7f,
            isEncrypted: (firstByte & 0x80) !== 0,
        };
    }
    onMessage(msg, rinfo) {
        return __awaiter(this, void 0, void 0, function* () {
            if (msg.byteLength === 0) {
                return;
            }
            this.byteLastSec.download += msg.byteLength;
            const { type, isEncrypted } = this.parseHead(msg);
            if (type === ForwarderType.Ping && !isEncrypted) {
                return this.onPing(rinfo, msg);
            }
            const peer = this.manager.get(rinfo);
            let payload = msg.slice(1);
            if (this.authProvider) {
                const { user } = peer;
                if (user === undefined) {
                    return this.onNeedAuth(peer, type, payload);
                }
            }
            this.onPacket(peer, type, payload);
        });
    }
    onPacket(peer, type, payload) {
        switch (type) {
            case ForwarderType.Keepalive:
                break;
            case ForwarderType.Ipv4:
                this.onIpv4(peer, payload);
                break;
            case ForwarderType.Ping:
                console.error('never reach here');
                break;
            case ForwarderType.Ipv4Frag:
                this.onIpv4Frag(peer, payload);
                break;
        }
    }
    sendInfo(peer, info) {
        this.sendTo(peer, ForwarderType.Info, Buffer.from(info));
    }
    onNeedAuth(peer, type, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type === ForwarderType.AuthMe) {
                if (this.authProvider && peer.challenge) {
                    if (payload.byteLength <= 20) {
                        return;
                    }
                    const response = payload.slice(0, 20);
                    const username = payload.slice(20).toString();
                    let err = '';
                    try {
                        if (yield withTimeout(this.authProvider.verify(username, peer.challenge.slice(1), response), 5000)) {
                            peer.user = new User(username);
                        }
                        else {
                            err = 'Error when login: Wrong password';
                            this.sendInfo(peer, 'Error when login: Wrong password');
                        }
                    }
                    catch (e) {
                        err = `Error when login: ${e.message}`;
                    }
                    if (err.length > 0) {
                        console.log(`${err} user: ${username}`);
                        this.sendInfo(peer, err);
                    }
                }
            }
            else {
                if (peer.challenge === undefined) {
                    const buf = Buffer.alloc(1 + 64);
                    peer.challenge = buf;
                    buf.writeUInt8(0xFF, 0);
                    yield randomFill(buf, 1);
                    buf.writeUInt8(0, 0);
                }
                else {
                    if (peer.challenge.readUInt8(0) === 0xFF) {
                        return;
                    }
                }
                this.sendTo(peer, ForwarderType.AuthMe, peer.challenge);
            }
        });
    }
    onIpv4Frag(peer, payload) {
        if (payload.length <= 20) {
            return;
        }
        const src = payload.readInt32BE(0);
        const dst = payload.readInt32BE(4);
        this.ipCache.set(src, {
            peer,
            expireAt: Date.now() + Timeout
        });
        if (this.ipCache.has(dst)) {
            const { peer } = this.ipCache.get(dst);
            this.sendTo(peer, ForwarderType.Ipv4Frag, payload);
        }
        else {
            this.sendBroadcast(peer, ForwarderType.Ipv4Frag, payload);
        }
    }
    onPing(rinfo, msg) {
        this.sendToRaw(rinfo, msg.slice(0, 4));
    }
    onIpv4(peer, payload) {
        if (payload.length <= 20) {
            return;
        }
        const src = payload.readInt32BE(IPV4_OFF_SRC);
        const dst = payload.readInt32BE(IPV4_OFF_DST);
        this.ipCache.set(src, {
            peer,
            expireAt: Date.now() + Timeout
        });
        if (this.ipCache.has(dst)) {
            const { peer } = this.ipCache.get(dst);
            this.sendTo(peer, ForwarderType.Ipv4, payload);
        }
        else {
            this.sendBroadcast(peer, ForwarderType.Ipv4, payload);
        }
    }
    onError(err) {
        console.log(`server error:\n${err.stack}`);
        this.server.close();
    }
    onSendError(error, bytes) {
        console.error(`onSendError ${error} ${bytes}`);
    }
    onClose() {
        console.log(`server closed`);
    }
    sendTo({ rinfo }, type, payload) {
        if (OutputEncrypt) {
            console.warn('not implement');
        }
        this.sendToRaw(rinfo, Buffer.concat([ForwarderTypeMap[type], payload], payload.byteLength + 1));
    }
    sendToRaw(addr, msg) {
        const { address, port } = addr;
        this.byteLastSec.upload += msg.byteLength;
        this.server.send(msg, port, address, (error, bytes) => {
            if (error) {
                this.manager.delete(addr);
            }
        });
    }
    sendBroadcast(except, type, payload) {
        for (let peer of this.manager.all(except.rinfo)) {
            this.sendTo(peer, type, payload);
        }
    }
    clearExpire() {
        this.manager.clearExpire();
        clearCacheItem(this.ipCache);
    }
}
exports.SLPServer = SLPServer;
//# sourceMappingURL=udpserver.js.map