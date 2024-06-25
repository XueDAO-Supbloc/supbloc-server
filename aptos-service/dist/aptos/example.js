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
exports.example = void 0;
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const constant_1 = require("./constant");
const ALICE_INITIAL_BALANCE = 100000000;
const BOB_INITIAL_BALANCE = 0;
const TRANSFER_AMOUNT = 1000000;
const balance = (name, accountAddress, versionToWaitFor) => __awaiter(void 0, void 0, void 0, function* () {
    const amount = yield constant_1.entry.getAccountAPTAmount({
        accountAddress,
        minimumLedgerVersion: versionToWaitFor,
    });
    console.log(`${name}'s balance is: ${amount}`);
    return amount;
});
const example = (alice) => __awaiter(void 0, void 0, void 0, function* () {
    const bob = ts_sdk_1.Account.generate();
    // Print two accounts
    console.log("\n=== Address ===\n");
    console.log(`Alice: ${alice.accountAddress}`);
    console.log(`Bob: ${bob.accountAddress}`);
    // Fund the accounts
    console.log("\n=== Funding accounts ===\n");
    // Fund alice account
    yield constant_1.entry.fundAccount({
        accountAddress: alice.accountAddress,
        amount: ALICE_INITIAL_BALANCE,
    });
    // Show the balances
    console.log("\n=== Initial Balances ===\n");
    const aliceBalance = yield balance("Alice", alice.accountAddress);
    const bobBalance = yield balance("Bob", bob.accountAddress);
    if (aliceBalance !== ALICE_INITIAL_BALANCE)
        throw new Error("Alice's balance is incorrect");
    if (bobBalance !== BOB_INITIAL_BALANCE)
        throw new Error("Bob's balance is incorrect");
    // Transfer between users
    console.log(`\n=== Transfer ${TRANSFER_AMOUNT} from Alice to Bob ===\n`);
    const transaction = yield constant_1.entry.transferCoinTransaction({
        sender: alice.accountAddress,
        recipient: bob.accountAddress,
        amount: TRANSFER_AMOUNT,
    });
    const pendingTxn = yield constant_1.entry.signAndSubmitTransaction({ signer: alice, transaction });
    const response = yield constant_1.entry.waitForTransaction({ transactionHash: pendingTxn.hash });
    console.log(`Committed transaction: ${response.hash}`);
    console.log("\n=== Balances after transfer ===\n");
    const newAliceBalance = yield balance("Alice", alice.accountAddress, BigInt(response.version));
    const newBobBalance = yield balance("Bob", bob.accountAddress);
    // Bob should have the transfer amount
    if (newBobBalance !== TRANSFER_AMOUNT + BOB_INITIAL_BALANCE)
        throw new Error("Bob's balance after transfer is incorrect");
    // Alice should have the remainder minus gas
    if (newAliceBalance >= ALICE_INITIAL_BALANCE - TRANSFER_AMOUNT)
        throw new Error("Alice's balance after transfer is incorrect");
});
exports.example = example;
