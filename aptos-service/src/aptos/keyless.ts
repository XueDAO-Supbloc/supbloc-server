import { EphemeralKeyPair, KeylessAccount } from '@aptos-labs/ts-sdk';
import { jwtDecode } from 'jwt-decode';

import { storeEphemeralKeyPair, getLocalEphemeralKeyPair } from './ephemeralUtils';
import { entry } from './aptosConstant';
import { writeAccount } from './keylessUtils';

/**
 * Generate a new ephemeral key pair, and return the nonce.
 */
export function genEphemeralKeyPair(): EphemeralKeyPair {
  const ephemeralKeyPair = EphemeralKeyPair.generate();

  // Save the EphemeralKeyPair in local storage by nonce
  storeEphemeralKeyPair(ephemeralKeyPair);
  console.log("[Aptos] Generated ephemeral key pair:\n", ephemeralKeyPair);

  return ephemeralKeyPair;
}

export async function getKeylessAccount(jwt: string): Promise<KeylessAccount | null> {
  const payload = jwtDecode<{ nonce: string }>(jwt);
  const jwtNonce = payload.nonce;

  const ephemeralKeyPair = getLocalEphemeralKeyPair(jwtNonce);

  if (!ephemeralKeyPair) {
    console.error(`[Aptos] Ephemeral key pair not found for nonce: ${jwtNonce}`);
    return null;
  }

  const keylessAccount = await entry.deriveKeylessAccount({
    jwt,
    ephemeralKeyPair,
  });
  console.log("[Aptos] Derived keyless account:\n", keylessAccount);

  // Create the account to chain
  try {
    await entry.fundAccount({
      accountAddress: keylessAccount.accountAddress,
      amount: 0,
    });
  }
  catch (e) {
    console.error(`[Aptos] Error funding account: ${e}`);
  }

  // Write the account to local storage
  writeAccount(keylessAccount);

  return keylessAccount;
}