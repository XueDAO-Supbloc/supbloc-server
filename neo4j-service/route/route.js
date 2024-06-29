import express, { json } from "express";
import { nanoid } from "nanoid";
import ModService from "../services/mod.service.js";
import { getDriver } from "../src/neo4j.js";
import QueryService from "../services/query.service.js";
import { logger } from "../src/logger.js";
import { SNAPSHOT_DIR, IPFS_SET } from "../src/constants.js";
import { appendFileSync, unlinkSync, linkSync, openSync, closeSync, readFileSync, existsSync } from 'fs';
import { UploadIpfs } from "../ipfs/ipfs_api.js";
import { SUPPLIER_LIST } from "../src/supplierList.js";

const router = express.Router();

/* transaction */
// create a new transaction
router.post("/transaction", async (req, res) => {
  try {
    // add new transaction to neo4j
    const modservice = new ModService(getDriver());
    const result = await modservice.addTransaction(
      nanoid(16),
      req.query.buyerId,
      req.query.sellerId,
      new Date(req.query.date).getTime(),
      req.query.productId,
      new Date().getTime()
    );

    // response
    res.write(result);
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

// get transaction by id
router.get("/transaction", async (req, res) => {
  try {
    // get transaction by id from neo4j
    const queryservice = new QueryService(getDriver());
    const result = await queryservice.getTransaction(
      req.query.transactionId
    );

    // Error-handle: if target transaction doesn't esist or lose either relation
    if (JSON.parse(result).transactionId === "error") {
      const errorMSG = `Some error occurred when fetching transaction with provided ID:` +
        `${req.query.transactionId}` +
        `\nIf you are system maintainer, check log for more details`;
      logger.error(errorMSG);
      throw errorMSG;
    }
    // response
    res.write(result);
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

// delete transaction by id
router.delete("/transaction", async (req, res) => {
  try {
    // delete transaction by id from neo4j
    const modservice = new ModService(getDriver());
    await modservice.delTransaction(req.query.transactionId);

    // response
    res.status(200).send("Transaction deleted");
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

// get all transactions before given date
router.get("/transaction/all", async (req, res) => {
  try {
    // get all supplier from neo4j
    const queryservice = new QueryService(getDriver());
    const result = await queryservice.getAllTransaction(
      new Date(req.query.date).getTime()
    );

    // Error-handle: if no Supplier exists
    if (JSON.parse(result)[0].transactionId === "error") {
      const errorMSG = `Some error occurred when fetching all Transactions.`
        `\nIf you are system maintainer, check log for more details`;
      logger.error(errorMSG);
      throw errorMSG;
    }

    // response
    res.write(result);
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

/* supplier */
// create a new supplier
router.post("/supplier", async (req, res) => {
  try {
    // add new supplier to neo4j
    const modservice = new ModService(getDriver());
    logger.info(`${req.query.supplierName}`);
    const result = await modservice.addSupplier(
      req.query.supplierName,
      nanoid(16),
      "safe",
      new Date().getTime()
    );
    logger.info("added!");

    res.write(result);

    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

// get supplier by id
router.get("/supplier", async (req, res) => {
  try {
    // get supplier by id from neo4j
    const queryservice = new QueryService(getDriver());
    const result = await queryservice.getSupplier(
      req.query.supplierId
    );

    // Error-handle: if target Supplier doesn't esist
    if (JSON.parse(result).supplierId === "error") {
      const errorMSG = `Some error occurred when fetching Supplier with provided ID:` +
        `${req.query.supplierId}` +
        `\nIf you are system maintainer, check log for more details`;
      logger.error(errorMSG);
      throw errorMSG;
    }
    // response
    res.write(result);

    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

// update supplier's safety level by id
router.put("/supplier", async (req, res) => {
  try {
    // update supplier's safety level in neo4j
    const modservice = new ModService(getDriver());
    await modservice.markSupplier(
      req.query.supplierId,
      req.query.safety
    );

    // response
    res.status(200).send("Supplier updated");
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

// delete supplier by id
router.delete("/supplier", async (req, res) => {
  try {
    // delete supplier by id from neo4j
    const modservice = new ModService(getDriver());
    await modservice.delSupplier(
      req.query.supplierId
    );

    // response
    res.status(200).send("Supplier deleted");
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

// get all supplier before given date
router.get("/supplier/all", async (req, res) => {
  try {
    // get all supplier from neo4j
    const queryservice = new QueryService(getDriver());
    const result = await queryservice.getAllSupplier(
      new Date(req.query.date).getTime()
    );

    // Error-handle: if no Supplier exists
    if (JSON.parse(result)[0].supplierId === "error") {
      const errorMSG = `Some error occurred when fetching all Supplier.`
        `\nIf you are system maintainer, check log for more details`;
      logger.error(errorMSG);
      throw errorMSG;
    }

    // response
    res.write(result);

    /* original response
    res.write(JSON.stringify([
      {
        name: "supplierName1",
        supplierId: "supplierId1",
        safety: "safe"
      },
      {
        name: "supplierName2",
        supplierId: "supplierId2",
        safety: "unsafe"
      }
    ]));*/
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

/* supply chain */
// get all suppliers in specific supply chain
router.get("/supply-chain", async (req, res) => {
  try {
    // get all suppliers in specific supply chain from neo4j
    const queryservice = new QueryService(getDriver());
    const result = await queryservice.findChain(
      req.query.supplierId,
      req.query.productId,
      new Date(req.query.date).getTime(),
      req.query.flow,
    );

    // Error-handle: if no chain found
    if (JSON.parse(result)[0].supplierId === "error") {
      const errorMSG = `Some error occurred when fetching the chain.`
        `\nIf you are system maintainer, check log for more details`;
      logger.error(errorMSG);
      throw errorMSG;
    }

    //response
    res.write(result);
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

// update supplier's safety level in specific supply chain
router.put("/supply-chain", async (req, res) => {
  try {
    // update supplier's safety level in specific supply chain in neo4j
    const modservice = new ModService(getDriver());
    await modservice.markChain(
      req.query.supplierId,
      req.query.productId,
      new Date(req.query.date).getTime(),
      req.query.flow,
      req.query.safety
    );

    // response
    res.status(200).send("Supplier updated");
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

/* Product */
// get product info by id
router.get("/product", async (req, res) => {
  try {
    let product;
    const productId = req.query.productId;

    for (const supplier in SUPPLIER_LIST) {
      const products = SUPPLIER_LIST[supplier].products;
      if (products.hasOwnProperty(productId)) {
        product = {
          productName: products[productId],
          productId: productId,
          supplierId: SUPPLIER_LIST[supplier].supplierID,
        };
      }
    }

    if (!product) {
      res.status(404).send("Product not found");
      return;
    }

    console.log(product);

    // response
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify(product));
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

/* Verify */
// upload snapshot to IPFS + stored locally
// Verify result and former cid(used to resume) will be returned
router.get("/verify", async (req, res) => {
  try {
    //init
    const jsonObj = {
      result: "",
      cid: ""
    }

    // update supplier's safety level in specific supply chain in neo4j
    const queryservice = new QueryService(getDriver());
    const modservice = new ModService(getDriver());
    const oldSnapshot = await queryservice.askSnapshotRC();
    console.log("alive");
    const stamp = JSON.parse(oldSnapshot).date;
    jsonObj.cid = JSON.parse(oldSnapshot).id;

    // oldSnapshot-generation: if snapshot record found
    if (stamp) {
      const OBJ = {
        suppliers: JSON.parse(await queryservice.getAllSupplier(stamp)),
        transactions: JSON.parse(await queryservice.getAllTransaction(stamp)),
        stamp: stamp
      };

      let cid;
      if (IPFS_SET) {
        cid = await UploadIpfs(JSON.stringify(OBJ));
      }
      else {
        cid = null;
      }

      jsonObj.result = (cid === null || cid != jsonObj.cid ? "NO" : "YES");
      if (jsonObj.result === "NO") {
        logger.error(
          `Fetched cid :${cid} doesn't match with the old snapshot with cid: ${jsonObj.cid}\n` +
          `Since verify processs failed, new snapshot won't be generated.\n` +
          `Can process recovery from ${SNAPSHOT_DIR}/${jsonObj.cid}.\n` +
          `Current snapshot will be saved to ${SNAPSHOT_DIR}/latest.`
        );
      }
      else {
        logger.log(
          `Matches with the old snapshot!\n` +
          `Since verify processs suceeded, new  and correct snapshot will be generated.`
        );
      }
    }
    else {
      jsonObj.result = "NO";
      jsonObj.cid = "NONE";
      logger.error(`No old snapshot is found. Init snapshot will be created!`);
    }

    // generate new sanpshot and record it
    if (jsonObj.result === "YES" || jsonObj.cid === "NONE") {
      const current = new Date().getTime();
      const OBJ = {
        suppliers: JSON.parse(await queryservice.getAllSupplier(current)),
        transactions: JSON.parse(await queryservice.getAllTransaction(current)),
        stamp: current
      };

      let cid;
      if (IPFS_SET) {
        cid = await UploadIpfs(JSON.stringify(OBJ));
      }
      else {
        cid = null;
      }

      if (cid) {
        if (existsSync(`${SNAPSHOT_DIR}/${cid}`))
          unlinkSync(`${SNAPSHOT_DIR}/${cid}`);
        appendFileSync(`${SNAPSHOT_DIR}/${cid}`, `${JSON.stringify(OBJ)}`);
        await modservice.addSnapshotRC(cid, current);
        logger.log(`Latest snapshot generated at ${SNAPSHOT_DIR}/${cid}`);

        jsonObj.result = "YES";
        jsonObj.cid = cid;
      }
      else
        logger.error(`Somehow there is error during UploadIpfs`);
    }

    // response
    res.write(JSON.stringify({
      result: jsonObj.result,
      cid: jsonObj.cid
    }));
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

/** Resume
 * Resume result and {
 *  "" (when process failed) or
 *  cid of new snapshot (when process suceeded)
 * }
 * will be returned
 */
router.put("/verify", async (req, res) => {
  try {
    //init
    const jsonObj = {
      result: "",
      cid: ""
    }

    // update supplier's safety level in specific supply chain in neo4j
    const queryservice = new QueryService(getDriver());
    const modservice = new ModService(getDriver());
    const targetSnapshot = await queryservice.getSnapshotRC(
      req.query.cid
    );
    const stamp = JSON.parse(targetSnapshot).date;

    // oldSnapshot-generation: if snapshot record found
    if (stamp) {
      const cid = JSON.parse(targetSnapshot).id;
      const result = JSON.parse(readFileSync(`${SNAPSHOT_DIR}/${cid}`, 'utf8'));
      for (const node of result.suppliers) {
        logger.log(`${node.supplierName}`);
        logger.log(`${node.supplierId}`);
        logger.log(`${node.safety}`);
        logger.log(`${node.date}`);
        await modservice.addSupplier(
          node.supplierName,
          node.supplierId,
          node.safety,
          node.stamp
        );
      }
      for (const relation of result.transactions) {
        await modservice.addTransaction(
          relation.transactionId,
          relation.buyerId,
          relation.sellerId,
          relation.date,
          relation.productId,
          relation.stamp
        );
      }
      jsonObj.result = "YES";
    }
    else {
      jsonObj.result = "NO";
      jsonObj.cid = "NONE";
      logger.error(`No snapshot record with given cid ${req.query.cid} is found. Resume process failed!`);
    }

    // generate new sanpshot and record it
    if (jsonObj.result === "YES") {
      const current = new Date().getTime();
      const OBJ = {
        suppliers: JSON.parse(await queryservice.getAllSupplier(current)),
        transactions: JSON.parse(await queryservice.getAllTransaction(current)),
        stamp: stamp
      };

      let cid;
      if (IPFS_SET) {
        cid = await UploadIpfs(JSON.stringify(OBJ));
      }
      else {
        cid = null;
      }

      if (cid) {
        if (existsSync(`${SNAPSHOT_DIR}/${cid}`))
          unlinkSync(`${SNAPSHOT_DIR}/${cid}`);
        appendFileSync(`${SNAPSHOT_DIR}/${cid}`, `${JSON.stringify(OBJ)}`);
        await modservice.addSnapshotRC(cid, current);
        logger.log(`Latest snapshot generated at ${SNAPSHOT_DIR}/${cid}`);
      }
      else
        logger.error(`Somehow there is error during UploadIpfs`);
    }

    // response
    res.write(JSON.stringify({
      result: jsonObj.result,
      cid: jsonObj.cid
    }));
    res.end();
  }
  catch (err) {
    res.status(500).send(err);
  }
});

export default router;