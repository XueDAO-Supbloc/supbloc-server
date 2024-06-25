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
        fs_1.default.writeFileSync('./account.json', JSON.stringify(keylessAccount));
        return keylessAccount;
    });
}
