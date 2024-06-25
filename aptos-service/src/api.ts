import express from 'express';

import { genEphemeralKeyPair, getKeylessAccount } from './aptos/keyless';
import { example } from './aptos/example';

export const router = express.Router();

router.get("/nonce", (req, res) => {
  try {
    const ephemeralKeyPair = genEphemeralKeyPair();

    // response
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
    res.write(JSON.stringify({
      "address": address
    }));
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});
