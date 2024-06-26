"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeEphemeralKeyPair = exports.validateEphemeralKeyPair = exports.getLocalEphemeralKeyPair = exports.decodeEphemeralKeyPairs = exports.encodeEphemeralKeyPairs = exports.getLocalEphemeralKeyPairs = exports.storeEphemeralKeyPair = void 0;
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const fs_1 = __importDefault(require("fs"));
const constant_1 = require("./constant");
/**
 * Retrieve all ephemeral key pairs from localStorage and decode them. The new ephemeral key pair
 * is then stored in localStorage with the nonce as the key.
 */
const storeEphemeralKeyPair = (ephemeralKeyPair) => {
    // Retrieve the current ephemeral key pairs from localStorage
    const keyPairs = (0, exports.getLocalEphemeralKeyPairs)();
    console.log(keyPairs);
    // Store the new ephemeral key pair in localStorage
    keyPairs[ephemeralKeyPair.nonce] = ephemeralKeyPair;
    // Store the updated ephemeral key pairs in a JSON file
    fs_1.default.writeFileSync(constant_1.keyfilepath, (0, exports.encodeEphemeralKeyPairs)(keyPairs));
};
exports.storeEphemeralKeyPair = storeEphemeralKeyPair;
/**
 * Retrieve all ephemeral key pairs from localStorage and decode them.
 */
const getLocalEphemeralKeyPairs = () => {
    // Retrieve the raw ephemeral key pairs from a JSON file
    const rawEphemeralKeyPairs = fs_1.default.readFileSync(constant_1.keyfilepath, 'utf8');
    console.log("[Aptos] Read ephemeral key pairs");
    try {
        return rawEphemeralKeyPairs
            ? (0, exports.decodeEphemeralKeyPairs)(rawEphemeralKeyPairs)
            : {};
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Failed to decode ephemeral key pairs from localStorage", error);
        return {};
    }
};
exports.getLocalEphemeralKeyPairs = getLocalEphemeralKeyPairs;
/**
 * Encoding for the EphemeralKeyPair class to be stored in localStorage
 */
const EphemeralKeyPairEncoding = {
    decode: (e) => ts_sdk_1.EphemeralKeyPair.fromBytes(e.data),
    encode: (e) => ({
        __type: "EphemeralKeyPair",
        data: e.bcsToBytes(),
    }),
};
/**
 * Stringify the ephemeral key pairs to be stored in localStorage
 */
const encodeEphemeralKeyPairs = (keyPairs) => JSON.stringify(keyPairs, (_, e) => {
    if (typeof e === "bigint")
        return { __type: "bigint", value: e.toString() };
    if (e instanceof Uint8Array)
        return { __type: "Uint8Array", value: Array.from(e) };
    if (e instanceof ts_sdk_1.EphemeralKeyPair)
        return EphemeralKeyPairEncoding.encode(e);
    return e;
});
exports.encodeEphemeralKeyPairs = encodeEphemeralKeyPairs;
/**
 * Parse the ephemeral key pairs from a string
 */
const decodeEphemeralKeyPairs = (encodedEphemeralKeyPairs) => JSON.parse(encodedEphemeralKeyPairs, (_, e) => {
    if (e && e.__type === "bigint")
        return BigInt(e.value);
    if (e && e.__type === "Uint8Array")
        return new Uint8Array(e.value);
    if (e && e.__type === "EphemeralKeyPair")
        return EphemeralKeyPairEncoding.decode(e);
    return e;
});
exports.decodeEphemeralKeyPairs = decodeEphemeralKeyPairs;
/**
 * Retrieve the ephemeral key pair with the given nonce from localStorage.
 */
const getLocalEphemeralKeyPair = (nonce) => {
    const keyPairs = (0, exports.getLocalEphemeralKeyPairs)();
    // Get the account with the given nonce (the generated nonce of the ephemeral key pair may not match
    // the nonce in localStorage), so we need to validate it before returning it (implementation specific).
    const ephemeralKeyPair = keyPairs[nonce];
    if (!ephemeralKeyPair)
        return null;
    // If the account is valid, return it, otherwise remove it from the device and return null
    return (0, exports.validateEphemeralKeyPair)(nonce, ephemeralKeyPair);
};
exports.getLocalEphemeralKeyPair = getLocalEphemeralKeyPair;
/**
 * Validate the ephemeral key pair with the given nonce and the expiry timestamp. If the nonce does not match
 * the generated nonce of the ephemeral key pair, the ephemeral key pair is removed from localStorage. This is
 * to validate that the nonce algorithm is the same (e.g. if the nonce algorithm changes).
 */
const validateEphemeralKeyPair = (nonce, ephemeralKeyPair) => {
    // Check the nonce and the expiry timestamp of the account to see if it is valid
    if (nonce === ephemeralKeyPair.nonce &&
        ephemeralKeyPair.expiryDateSecs > BigInt(Math.floor(Date.now() / 1000))) {
        return ephemeralKeyPair;
    }
    (0, exports.removeEphemeralKeyPair)(nonce);
    return null;
};
exports.validateEphemeralKeyPair = validateEphemeralKeyPair;
/**
 * Remove the ephemeral key pair with the given nonce from localStorage.
 */
const removeEphemeralKeyPair = (nonce) => {
    const keyPairs = (0, exports.getLocalEphemeralKeyPairs)();
    delete keyPairs[nonce];
    localStorage.setItem("ephemeral-key-pairs", (0, exports.encodeEphemeralKeyPairs)(keyPairs));
};
exports.removeEphemeralKeyPair = removeEphemeralKeyPair;
