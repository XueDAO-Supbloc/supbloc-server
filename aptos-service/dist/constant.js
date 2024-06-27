"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountfilepath = exports.keyfilepath = void 0;
// Set false when deploying to GCP
const local = true;
exports.keyfilepath = local ? './ephemeral-key-pairs.json' : '/tmp/ephemeral-key-pairs.json';
exports.accountfilepath = local ? './account.json' : '/tmp/account.json';
