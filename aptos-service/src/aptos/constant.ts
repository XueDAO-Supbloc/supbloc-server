import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

export const entry = new Aptos(new AptosConfig({network: Network.DEVNET}));

const local = false;
export const keyfilepath = local ? './ephemeral-key-pairs.json' : '/tmp/ephemeral-key-pairs.json';