import { EphemeralKeyPair, KeylessAccount, Account } from '@aptos-labs/ts-sdk';
import { storeEphemeralKeyPair, getLocalEphemeralKeyPair } from './ephemeral';
import { jwtDecode } from 'jwt-decode';
import { entry } from './constant';
import fs from 'fs';

// init json file
// fs.writeFileSync('./ephemeral-key-pairs.json', '{}');

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

  fs.writeFileSync('./account.json', JSON.stringify(keylessAccount));

  return keylessAccount;
}