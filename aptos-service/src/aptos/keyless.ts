import { EphemeralKeyPair, KeylessAccount } from '@aptos-labs/ts-sdk';
import { jwtDecode } from 'jwt-decode';
import fs from 'fs';

import { storeEphemeralKeyPair, getLocalEphemeralKeyPair } from './ephemeralUtils';
import { entry } from './aptosConstant';
import { encodeAccount } from './keylessAccountUtils';
import { accountfilepath } from '../constant';


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

  // Save the keyless account to a JSON file
  const str = encodeAccount(keylessAccount);
  fs.writeFileSync(accountfilepath, str);

  return keylessAccount;
}