"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAccount = writeAccount;
exports.findAccountbyAddress = findAccountbyAddress;
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const fs_1 = __importDefault(require("fs"));
const constant_1 = require("../constant");
function writeAccount(account) {
    const accounts = getAllAcounts();
    const address = Buffer.from(account.accountAddress.data).toString('hex');
    accounts[address] = account;
    fs_1.default.writeFileSync(constant_1.accountfilepath, encodeAccount(accounts));
    console.log("[Aptos] Writing account to file successful");
}
function findAccountbyAddress(address) {
    const accounts = getAllAcounts();
    const account = accounts[address];
    if (!account) {
        console.log("[Aptos] account not found");
        return null;
    }
    console.log("[Aptos] Found account:\n", account);
    return account;
}
function getAllAcounts() {
    const rawAccounts = fs_1.default.readFileSync(constant_1.accountfilepath, 'utf8');
    try {
        return rawAccounts
            ? decodeAccount(rawAccounts)
            : {};
    }
    catch (error) {
        console.warn("Failed to decode account from localStorage", error);
        return {};
    }
}
function encodeAccount(accounts) {
    return JSON.stringify(accounts, (_, e) => {
        if (e instanceof Uint8Array)
            return { __type: "Uint8Array", value: Array.from(e) };
        if (e instanceof ts_sdk_1.KeylessAccount)
            return { __type: "KeylessAccount", value: e.bcsToBytes() };
        return e;
    });
}
function decodeAccount(encodedAccounts) {
    return JSON.parse(encodedAccounts, (_, e) => {
        if (e && e.__type === "Uint8Array")
            return new Uint8Array(e.value);
        if (e && e.__type === "KeylessAccount")
            return ts_sdk_1.KeylessAccount.fromBytes(e.value);
        return e;
    });
}
