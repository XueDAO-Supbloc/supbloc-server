import { KeylessAccount } from '@aptos-labs/ts-sdk';

export function encodeAccount(account: KeylessAccount): string {
  return JSON.stringify(account, (_, e) => {
    if (e instanceof Uint8Array)
      return { __type: "Uint8Array", value: Array.from(e) };
    if (e instanceof KeylessAccount)
      return { __type: "KeylessAccount", value: e.bcsToBytes() };
    return e;
  });
}

export function decodeAccount(account: string): KeylessAccount {
  return JSON.parse(account, (_, e) => {
    if (e && e.__type === "Uint8Array") return new Uint8Array(e.value);
    if (e && e.__type === "KeylessAccount")
      return KeylessAccount.fromBytes(e.value);
    return e;
  });
}
