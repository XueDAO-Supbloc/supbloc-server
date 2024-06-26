import { KeylessAccount } from '@aptos-labs/ts-sdk';
import fs from 'fs';

import { accountfilepath } from '../constant';

export type StoredKeylessAccounts = {
  [address: string]: KeylessAccount;
}

export function writeAccount(account: KeylessAccount): void {
  const accounts = getAllAcounts();

  const address: string = Buffer.from(account.accountAddress.data).toString('hex');
  accounts[address] = account;

  fs.writeFileSync(accountfilepath, encodeAccount(accounts));
  console.log("[Aptos] Writing account to file successful");
}

export function findAccountbyAddress(address: string): KeylessAccount | null {
  const accounts = getAllAcounts();

  const account = accounts[address];
  if (!account) {
    console.log("[Aptos] account not found");
    return null;
  }

  console.log("[Aptos] Found account:\n", account);
  return account;
}


function getAllAcounts(): StoredKeylessAccounts {
  const rawAccounts = fs.readFileSync(accountfilepath, 'utf8');

  try {
    return rawAccounts
      ? decodeAccount(rawAccounts)
      : {};
  } catch (error) {
    console.warn(
      "Failed to decode account from localStorage",
      error,
    );
    return {};
  }
}

function encodeAccount(accounts: StoredKeylessAccounts): string {
  return JSON.stringify(accounts, (_, e) => {
    if (e instanceof Uint8Array)
      return { __type: "Uint8Array", value: Array.from(e) };
    if (e instanceof KeylessAccount)
      return { __type: "KeylessAccount", value: e.bcsToBytes() };
    return e;
  });
}

function decodeAccount(encodedAccounts: string): StoredKeylessAccounts {
  return JSON.parse(encodedAccounts, (_, e) => {
    if (e && e.__type === "Uint8Array") return new Uint8Array(e.value);
    if (e && e.__type === "KeylessAccount")
      return KeylessAccount.fromBytes(e.value);
    return e;
  });
}
