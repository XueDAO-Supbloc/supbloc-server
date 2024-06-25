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
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const keyless_1 = require("./aptos/keyless");
exports.router = express_1.default.Router();
exports.router.get("/nonce", (req, res) => {
    try {
        const ephemeralKeyPair = (0, keyless_1.genEphemeralKeyPair)();
        // response
        res.write(JSON.stringify({
            "nonce": ephemeralKeyPair.nonce
        }));
        res.end();
    }
    catch (err) {
        res.status(500).send(err);
    }
});
exports.router.get("/keylessAccount", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jwt = req.query.id_token;
        const keylessAccount = yield (0, keyless_1.getKeylessAccount)(jwt);
        if (!keylessAccount) {
            res.status(404).send("Get Keyless account Failed");
            return;
        }
        const address = Buffer.from(keylessAccount.accountAddress.data).toString('hex');
        // response
        res.write(JSON.stringify({
            "address": address
        }));
        res.end();
    }
    catch (err) {
        res.status(500).send(err);
    }
}));
