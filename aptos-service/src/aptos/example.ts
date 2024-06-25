import { Account, AccountAddress } from "@aptos-labs/ts-sdk";
import { entry } from "./constant";

const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 0;
const TRANSFER_AMOUNT = 1_000_000;

const balance = async (name: string, accountAddress: AccountAddress, versionToWaitFor?: bigint): Promise<number> => {
  const amount = await entry.getAccountAPTAmount({
    accountAddress,
    minimumLedgerVersion: versionToWaitFor,
  });
  console.log(`${name}'s balance is: ${amount}`);
  return amount;
};

export const example = async (alice: Account) => {
  const bob = Account.generate();

  // Print two accounts
  console.log("\n=== Address ===\n");
  console.log(`Alice: ${alice.accountAddress}`);
  console.log(`Bob: ${bob.accountAddress}`);

  // Fund the accounts
  console.log("\n=== Funding accounts ===\n");

  // Fund alice account
  await entry.fundAccount({
    accountAddress: alice.accountAddress,
    amount: ALICE_INITIAL_BALANCE,
  });

  // Show the balances
  console.log("\n=== Initial Balances ===\n");
  const aliceBalance = await balance("Alice", alice.accountAddress);
  const bobBalance = await balance("Bob", bob.accountAddress);

  if (aliceBalance !== ALICE_INITIAL_BALANCE) throw new Error("Alice's balance is incorrect");
  if (bobBalance !== BOB_INITIAL_BALANCE) throw new Error("Bob's balance is incorrect");

  // Transfer between users
  console.log(`\n=== Transfer ${TRANSFER_AMOUNT} from Alice to Bob ===\n`);
  const transaction = await entry.transferCoinTransaction({
    sender: alice.accountAddress,
    recipient: bob.accountAddress,
    amount: TRANSFER_AMOUNT,
  });
  const pendingTxn = await entry.signAndSubmitTransaction({ signer: alice, transaction });
  const response = await entry.waitForTransaction({ transactionHash: pendingTxn.hash });
  console.log(`Committed transaction: ${response.hash}`);

  console.log("\n=== Balances after transfer ===\n");
  const newAliceBalance = await balance("Alice", alice.accountAddress, BigInt(response.version));
  const newBobBalance = await balance("Bob", bob.accountAddress);

  // Bob should have the transfer amount
  if (newBobBalance !== TRANSFER_AMOUNT + BOB_INITIAL_BALANCE)
    throw new Error("Bob's balance after transfer is incorrect");

  // Alice should have the remainder minus gas
  if (newAliceBalance >= ALICE_INITIAL_BALANCE - TRANSFER_AMOUNT)
    throw new Error("Alice's balance after transfer is incorrect");
};