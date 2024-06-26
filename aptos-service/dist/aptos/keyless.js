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
exports.genEphemeralKeyPair = genEphemeralKeyPair;
exports.getKeylessAccount = getKeylessAccount;
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const ephemeral_1 = require("./ephemeral");
const jwt_decode_1 = require("jwt-decode");
const constant_1 = require("./constant");
const fs_1 = __importDefault(require("fs"));
const example_1 = require("./example");
// init json file
// fs.writeFileSync('./ephemeral-key-pairs.json', '{}');
/**
 * Generate a new ephemeral key pair, and return the nonce.
 */
function genEphemeralKeyPair() {
    const ephemeralKeyPair = ts_sdk_1.EphemeralKeyPair.generate();
    // Save the EphemeralKeyPair in local storage by nonce
    (0, ephemeral_1.storeEphemeralKeyPair)(ephemeralKeyPair);
    console.log("[Aptos] Generated ephemeral key pair:\n", ephemeralKeyPair);
    return ephemeralKeyPair;
}
function getKeylessAccount(jwt) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = (0, jwt_decode_1.jwtDecode)(jwt);
        const jwtNonce = payload.nonce;
        const ephemeralKeyPair = (0, ephemeral_1.getLocalEphemeralKeyPair)(jwtNonce);
        if (!ephemeralKeyPair) {
            console.error(`[Aptos] Ephemeral key pair not found for nonce: ${jwtNonce}`);
            return null;
        }
        const keylessAccount = yield constant_1.entry.deriveKeylessAccount({
            jwt,
            ephemeralKeyPair,
        });
        console.log("[Aptos] Derived keyless account:\n", keylessAccount);
        const str = encodeAccount(keylessAccount);
        const account = decodeAccount(str);
        (0, example_1.example)(account);
        fs_1.default.writeFileSync('./account.json', str);
        return keylessAccount;
    });
}
function encodeAccount(account) {
    return JSON.stringify(account, (_, e) => {
        if (e instanceof Uint8Array)
            return { __type: "Uint8Array", value: Array.from(e) };
        if (e instanceof ts_sdk_1.KeylessAccount)
            return { __type: "KeylessAccount", value: e.bcsToBytes() };
        return e;
    });
}
function decodeAccount(account) {
    return JSON.parse(account, (_, e) => {
        if (e && e.__type === "Uint8Array")
            return new Uint8Array(e.value);
        if (e && e.__type === "KeylessAccount")
            return ts_sdk_1.KeylessAccount.fromBytes(e.value);
        return e;
    });
}
// export const decodeEphemeralKeyPairs = (
//   encodedEphemeralKeyPairs: string,
// ): StoredEphemeralKeyPairs =>
//   JSON.parse(encodedEphemeralKeyPairs, (_, e) => {
//     if (e && e.__type === "bigint") return BigInt(e.value);
//     if (e && e.__type === "Uint8Array") return new Uint8Array(e.value);
//     if (e && e.__type === "EphemeralKeyPair")
//       return EphemeralKeyPairEncoding.decode(e);
//     return e;
//   });
