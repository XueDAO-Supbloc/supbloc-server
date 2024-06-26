import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

export const entry = new Aptos(new AptosConfig({network: Network.DEVNET}));