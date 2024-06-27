import express from 'express';
import { Account } from "@aptos-labs/ts-sdk"

import { genEphemeralKeyPair, getKeylessAccount } from './aptos/keyless';
import { NFTcontent, getNFTs, mintNFT } from './aptos/nft';
import { findAccountbyAddress } from './aptos/keylessUtils';

export const router = express.Router();

router.get("/nonce", (req, res) => {
  try {
    const ephemeralKeyPair = genEphemeralKeyPair();

    // response
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify({
      "nonce": ephemeralKeyPair.nonce
    }));
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

router.get("/keylessAccount", async (req, res) => {
  try {
    const jwt = req.query.id_token as string;

    const keylessAccount = await getKeylessAccount(jwt);

    if (!keylessAccount) {
      res.status(404).send("Get Keyless account Failed");
      return;
    }

    const address = Buffer.from(keylessAccount.accountAddress.data).toString('hex');

    // response
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify({
      "address": address
    }));
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

router.post("/nft", async (req, res) => {
  try {
    const address = req.query.address as string;
    const productID = req.query.productID as string;
    const productName = req.query.productName as string;
    const supplierIDs = JSON.parse(req.query.supplierIDs as string);

    const content: NFTcontent = {
      productID,
      productName,
      supplierIDs
    };

    const account = await findAccountbyAddress(address);
    if (!account) {
      res.status(404).send("Account not found");
      return;
    }

    await mintNFT(account, content);

    // response
    res.status(200).send("NFT added");
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

router.get("/nft", async (req, res) => {
  try {
    const address = req.query.address as string;

    const account = await findAccountbyAddress(address);
    if (!account) {
      res.status(404).send("Account not found");
      return;
    }

    const nfts = await getNFTs(account);

    console.log(nfts);

    // response
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(nfts));
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});