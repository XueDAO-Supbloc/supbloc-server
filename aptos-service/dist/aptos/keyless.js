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
exports.genEphemeralKeyPair = genEphemeralKeyPair;
exports.getKeylessAccount = getKeylessAccount;
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const jwt_decode_1 = require("jwt-decode");
const ephemeralUtils_1 = require("./ephemeralUtils");
const aptosConstant_1 = require("./aptosConstant");
const keylessUtils_1 = require("./keylessUtils");
/**
 * Generate a new ephemeral key pair, and return the nonce.
 */
function genEphemeralKeyPair() {
    const ephemeralKeyPair = ts_sdk_1.EphemeralKeyPair.generate();
    // Save the EphemeralKeyPair in local storage by nonce
    (0, ephemeralUtils_1.storeEphemeralKeyPair)(ephemeralKeyPair);
    console.log("[Aptos] Generated ephemeral key pair:\n", ephemeralKeyPair);
    return ephemeralKeyPair;
}
function getKeylessAccount(jwt) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = (0, jwt_decode_1.jwtDecode)(jwt);
        const jwtNonce = payload.nonce;
        const ephemeralKeyPair = (0, ephemeralUtils_1.getLocalEphemeralKeyPair)(jwtNonce);
        if (!ephemeralKeyPair) {
            console.error(`[Aptos] Ephemeral key pair not found for nonce: ${jwtNonce}`);
            return null;
        }
        const keylessAccount = yield aptosConstant_1.entry.deriveKeylessAccount({
            jwt,
            ephemeralKeyPair,
        });
        console.log("[Aptos] Derived keyless account:\n", keylessAccount);
        // Create the account to chain
        try {
            yield aptosConstant_1.entry.fundAccount({
                accountAddress: keylessAccount.accountAddress,
                amount: 0,
            });
        }
        catch (e) {
            console.error(`[Aptos] Error funding account: ${e}`);
        }
        // Write the account to local storage
        (0, keylessUtils_1.writeAccount)(keylessAccount);
        return keylessAccount;
    });
}
