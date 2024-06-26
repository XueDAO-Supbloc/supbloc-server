"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entry = void 0;
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
exports.entry = new ts_sdk_1.Aptos(new ts_sdk_1.AptosConfig({ network: ts_sdk_1.Network.DEVNET }));
