import { toNativeTypes } from '../src/utils.js';
import { logger } from '../src/logger.js';
import { MAX_PATH_LENGTH } from '../src/constants.js';

export default class QueryService {
  /**
   * @type {neo4j.Driver}
   */
  driver

  /**
  * The constructor expects an instance of the Neo4j Driver, which will be
  * used to interact with Neo4j.
  *
  * @param {neo4j.Driver} driver
  */
  constructor(driver) {
    this.driver = driver;
  }

  /**
   * @public
   * Return a Supplier with provided ID. If target Supplier doesn't exist,
   * error will be logged and parameter "supplierId" will be replaced by
   * "error"
   *
   * @param {string} supplierId  The ID of the Supplier, supposed to be unique
   * @returns {Promise<string>}
   */
  // tag::getSupplier[]
  async getSupplier(supplierId) {

    // Construct the object used to return
    const ret = {
      "supplierName": "",
      "supplierId": supplierId,
      "safety": "",
      "stamp": 0
    };

    // Open a new database session
    const session = this.driver.session();

    // Search for the node with unique ID
    const res = await session.executeRead(
      tx => tx.run(`
        OPTIONAL MATCH (n:Supplier{id: $supplierId})
        WITH n,
          CASE
            WHEN n IS NULL THEN 0
            ELSE 1
          END AS exist 
        RETURN {
          name: n.name,
          safety: n.marked,
          date: n.stamp,
          exist: exist
        } as reply  
      `, { supplierId })
    );

    // Close the session
    await session.close();


    // Check if node exist
    const Exist = res.records.map(row => toNativeTypes(row.get('reply')))[0].exist;

    if (!Exist) {
      logger.error(`query.service.getSupplier: Target Supplier with ID ${supplierId} doesn't exist!`);
      ret.supplierId = "error";
      return JSON.stringify(ret);
    }

    ret.supplierName = res.records.map(row => toNativeTypes(row.get('reply')))[0].name;
    ret.safety = res.records.map(row => toNativeTypes(row.get('reply')))[0].safety;
    ret.stamp = res.records.map(row => toNativeTypes(row.get('reply')))[0].date;

    // return in json form
    return JSON.stringify(ret);

    //return a relation's existence
  }
  // end::getSupplier[]

  /**
   * @public
   * Return all Suppliers in the database that existed before given date in the order
   *  of id. If there is no Suppliers in the database, error will be logged and 
   * parameter "supplierId" will be replaced by "error"
   *
   * @param {number} date           The date of the old snapshot
   * @returns {Promise<string>}
   */
  // tag::getAllSupplier[]
  async getAllSupplier(date) {
    // Open a new database session
    const session = this.driver.session();

    // Search for all Supplier nodes
    const res = await session.executeRead(
      tx => tx.run(`
        OPTIONAL MATCH (n:Supplier WHERE n.stamp <= ${date})
        RETURN {
          supplierName: n.name,
          supplierId: n.id,
          safety: n.marked,
          stamp: n.stamp
        } as reply  
        ORDER BY n.id, n.name
      `, {})
    );

    // Close the session
    await session.close();

    // Check if both relations exist
    const ret = res.records.map(row => toNativeTypes(row.get('reply')));

    if (ret[0].supplierId === null) {
      logger.error(`query.service.getAllSupplier: Database currently has no Suppliers!`);
      ret[0].supplierId = "error";
      return JSON.stringify(ret);
    }

    // return in json form
    return JSON.stringify(ret);

  }
  // end::getAllSupplier[]

  /**
   * @public
   * Return a transaction with provided ID. If target transaction doesn't exist,
   * error will be logged and parameter "transactiionId" will be replaced by
   * "error"
   *
   * @param {string} transactionId  The ID of the transaction, supposed to be unique
   * @returns {Promise<string>}
   */
  // tag::getTransaction[]
  async getTransaction(transactionId) {

    // Construct the object used to return
    const ret = {
      "transactionId": transactionId,
      "buyerId": " ",
      "sellerId": " ",
      "productId": " ",
      "date": 0,
      "stamp": 0
    };

    // Open a new database session
    const session = this.driver.session();

    // Search for both node with unique name first then relation with unique time
    const res = await session.executeRead(
      tx => tx.run(`
        OPTIONAL MATCH (buyer) -[b:Bought {id: $transactionId}]-> (seller)
        WITH buyer, b, seller,
          CASE
            WHEN b IS NULL THEN 0
            ELSE 1
          END AS boughtCHK
        OPTIONAL MATCH (buyer) <-[s:Sold {id: $transactionId}]- (seller)
        WITH buyer, boughtCHK, b, seller, s,
          CASE
            WHEN s IS NULL THEN 0
            ELSE 1
          END AS soldCHK
        RETURN {
          buyerId: buyer.id,
          sellerId: seller.id,
          productId: s.items,
          date: s.time,
          stamp: s.stamp,
          boughtCHK: boughtCHK,
          soldCHK: soldCHK
        } as reply
      `, { transactionId })
    );

    // Close the session
    await session.close();


    // Check if both relations exist
    const Bought = res.records.map(row => toNativeTypes(row.get('reply')))[0].boughtCHK;
    const Sold = res.records.map(row => toNativeTypes(row.get('reply')))[0].soldCHK;

    if (!Bought || !Sold) {
      ret.transactionId = "error";
      logger.error(`query.service.getTransaction: Either Bought or Sold is missing!`);
      return JSON.stringify(ret);
    }

    ret.buyerId = res.records.map(row => toNativeTypes(row.get('reply')))[0].buyerId;
    ret.sellerId = res.records.map(row => toNativeTypes(row.get('reply')))[0].sellerId;
    ret.productId = res.records.map(row => toNativeTypes(row.get('reply')))[0].productId;
    ret.date = res.records.map(row => toNativeTypes(row.get('reply')))[0].date;
    ret.stamp = res.records.map(row => toNativeTypes(row.get('reply')))[0].stamp;

    // return in json form
    return JSON.stringify(ret);

    //return a relation's existence
  }
  // end::getTransaction[]

  /**
   * @public
   * Return all Transactions in the database that existed before given date, 
   * ordered by id. If there is no Transactions in the database, error 
   * will be logged and parameter "supplierId" will be replaced by "error".
   * Both Bought and Sold is queried to prevent data missing on single side.
   * However, UNION will only keep DISTINCT result
   *
   * @param {number} date       The date of the old sanpshot
   * @returns {Promise<string>}
   */
  // tag::getAllTransaction[]
  async getAllTransaction(date) {

    // Open a new database session
    const session = this.driver.session();

    // Search for all transactions
    const res = await session.executeRead(
      tx => tx.run(`
        OPTIONAL MATCH (a)-[r:Bought WHERE r.time <= ${date}]->(b)
        RETURN {
          transactionId: r.id,
          buyerId: a.id,
          sellerId: b.id,
          productId: r.items,
          date: r.time,
          stamp: r.stamp
        } as reply  
        ORDER BY r.id, a.id, b.id
        UNION
        OPTIONAL MATCH (c)<-[s:Sold WHERE s.time <= ${date}]-(d)
        RETURN {
          transactionId: s.id,
          buyerId: c.id,
          sellerId: d.id,
          productId: s.items,
          date: s.time,
          stamp: s.stamp
        } as reply  
        ORDER BY s.id, c.id, d.id
      `, {})
    );

    // Close the session
    await session.close();

    // Check if both relations exist
    const ret = res.records.map(row => toNativeTypes(row.get('reply')));

    if (ret[0].transactionId === null) {
      logger.error(`query.service.getAllTransaction: Database currently has no Transactions!`);
      ret[0].transactionId = "error";
      return JSON.stringify(ret);
    }

    // return in json form
    return JSON.stringify(ret);

  }
  // end::getAllTransaction[]

  /**
   * @public
   * Find the whole chain from given node(Supplier) following specified relation with specific 
   * attributes and direction. No actions will be performed to the database if node with
   * given id doesn't exist or no transactions meet our requirement, which is quite safe.
   *
   * @param {string} supplierId    The ID of the Supplier
   * @param {string} productId     The ID of product used to determine start
   * @param {number} date          The date used to filter transactions before it
   * @param {string} flow          The direction we travel, expecting "upstream" and "downstream"
   * @returns {Promise<string>}
   */
  // tag::findChain[]
  async findChain(supplierId, productId, date, flow) {
    if (flow === "upstream") {
      // Open a new database session
      const session = this.driver.session();
      let res;
      if (productId) {
        // Search for the whole chain
        res = await session.executeRead(
          tx => tx.run(`
            OPTIONAL MATCH (start:Supplier {id: $supplierId})-[b:Bought WHERE b.time >= ${date} AND b.items = $productId]-> (first)
            RETURN {
              supplierName: first.name,
              supplierId: first.id,
              safety: first.marked,
              stamp: first.stamp
            } AS above
            UNION DISTINCT
            OPTIONAL MATCH (start:Supplier {id: $supplierId})-[b:Bought WHERE b.time >= ${date} AND b.items = $productId]-> (first) -[c:Bought WHERE c.time >= ${date}]->{1,${MAX_PATH_LENGTH}}(more:Supplier)
            RETURN {
              supplierName: more.name,
              supplierId: more.id,
              safety: more.marked,
              stamp: more.stamp
            } AS above
          `, { supplierId, productId })
        );
      }
      else {
        // Search for the whole chain
        res = await session.executeRead(
          tx => tx.run(`
            OPTIONAL MATCH (start:Supplier {id: $supplierId})-[c:Bought WHERE c.time >= ${date}]->{1,${MAX_PATH_LENGTH}}(more:Supplier)
            WITH DISTINCT more
            RETURN {
              supplierName: more.name,
              supplierId: more.id,
              safety: more.marked,
              stamp: more.stamp
            } AS above
          `, { supplierId, productId })
        );
      }
      // Close the session
      await session.close();

      //return nodes array in json form
      const ret = res.records.map(row => toNativeTypes(row.get('above')));

      if (ret.length >= 1) {
        if (ret[0].supplierId === null)
          ret.shift();
        if (ret.length > 0 && ret[ret.length - 1].supplierId === null)
          ret.pop();
      }

      if (ret[0].supplierId === null && ret.length === 1) {
        logger.error(`query.service.findChain: No matches`);
        ret[0].supplierId = "error";
        return JSON.stringify(ret);
      }

      return JSON.stringify(ret);

    }
    else if (flow === "downstream") {
      // Open a new database session
      const session = this.driver.session();
      let res;
      if (productId) {
        // Search for the whole chain
        res = await session.executeRead(
          tx => tx.run(`
            OPTIONAL MATCH (start:Supplier {id: $supplierId})-[s:Sold WHERE s.time >= ${date} AND s.items = $productId]-> (first)
            RETURN {
              supplierName: first.name,
              supplierId: first.id,
              safety: first.marked,
              stamp: first.stamp
            } AS below
            UNION ALL
            OPTIONAL MATCH (start:Supplier {id: $supplierId})-[s:Sold WHERE s.time >= ${date} AND s.items = $productId]-> (first) -[c:Sold WHERE c.time >= ${date}]->{1,${MAX_PATH_LENGTH}}(more:Supplier)
            RETURN {
              supplierName: more.name,
              supplierId: more.id,
              safety: more.marked,
              stamp: more.stamp
            } AS below
          `, { supplierId, productId })
        );
      }
      else {
        res = await session.executeRead(
          tx => tx.run(`
            OPTIONAL MATCH (start:Supplier {id: $supplierId})-[c:Sold WHERE c.time >= ${date}]->{1,${MAX_PATH_LENGTH}}(more:Supplier)
            WITH DISTINCT more
            RETURN {
              supplierName: more.name,
              supplierId: more.id,
              safety: more.marked,
              stamp: more.stamp
            } AS below
          `, { supplierId, productId })
        );
      }

      // Close the session
      await session.close();

      //return a node's existence in json form
      const ret = res.records.map(row => toNativeTypes(row.get('below')));

      if (ret.length >= 1) {
        if (ret[0].supplierId === null)
          ret.shift();
        if (ret.length > 0 && ret[ret.length - 1].supplierId === null)
          ret.pop();
      }

      if (ret[0].supplierId === null && ret.length === 1) {
        logger.error(`query.service.findChain: No matches`);
        ret[0].supplierId = "error";
        return JSON.stringify(ret);
      }

      return JSON.stringify(ret);
    }
    else {
      // Open a new database session
      const session = this.driver.session();
      let resAbove, resBelow;
      if (productId) {
        // Search for the whole chain
        resAbove = await session.executeRead(
          tx => tx.run(`
            OPTIONAL MATCH (start:Supplier {id: $supplierId})-[b:Bought WHERE b.time >= ${date} AND b.items = $productId]-> (first)
            RETURN {
              supplierName: first.name,
              supplierId: first.id,
              safety: first.marked,
              stamp: first.stamp
            } AS above
            UNION DISTINCT
            OPTIONAL MATCH (start:Supplier {id: $supplierId})-[b:Bought WHERE b.time >= ${date} AND b.items = $productId]-> (first) -[c:Bought WHERE c.time >= ${date}]->{1,${MAX_PATH_LENGTH}}(more:Supplier)
            RETURN {
              supplierName: more.name,
              supplierId: more.id,
              safety: more.marked,
              stamp: more.stamp
            } AS above
          `, { supplierId, productId })
        );

        resBelow = await session.executeRead(
          tx => tx.run(`
            OPTIONAL MATCH (start:Supplier {id: $supplierId})-[s:Sold WHERE s.time >= ${date} AND s.items = $productId]-> (first)
            RETURN {
              supplierName: first.name,
              supplierId: first.id,
              safety: first.marked,
              stamp: first.stamp
            } AS below
            UNION ALL
            OPTIONAL MATCH (start:Supplier {id: $supplierId})-[s:Sold WHERE s.time >= ${date} AND s.items = $productId]-> (first) -[c:Sold WHERE c.time >= ${date}]->{1,${MAX_PATH_LENGTH}}(more:Supplier)
            RETURN {
              supplierName: more.name,
              supplierId: more.id,
              safety: more.marked,
              stamp: more.stamp
            } AS below
          `, { supplierId, productId })
        );
      }
      else {
        resAbove = await session.executeRead(
          tx => tx.run(`
            OPTIONAL MATCH (start:Supplier {id: $supplierId})-[c:Bought WHERE c.time >= ${date}]->{1,${MAX_PATH_LENGTH}}(more:Supplier)
            WITH DISTINCT more
            RETURN {
              supplierName: more.name,
              supplierId: more.id,
              safety: more.marked,
              stamp: more.stamp
            } AS above
          `, { supplierId, productId })
        );
        resBelow = await session.executeRead(
          tx => tx.run(`
            OPTIONAL MATCH (start:Supplier {id: $supplierId})-[c:Sold WHERE c.time >= ${date}]->{1,${MAX_PATH_LENGTH}}(more:Supplier)
            WITH DISTINCT more
            RETURN {
              supplierName: more.name,
              supplierId: more.id,
              safety: more.marked,
              stamp: more.stamp
            } AS below
          `, { supplierId, productId })
        );
      }

      // Close the session
      await session.close();

      //return nodes array in json form
      const retAbove = resAbove.records.map(row => toNativeTypes(row.get('above')));

      //return nodes array in json form
      const retBelow = resBelow.records.map(row => toNativeTypes(row.get('below')));

      if (retAbove.length >= 1) {
        if (retAbove[0].supplierId === null)
          retAbove.shift();
        if (resAbove.length > 0 && retAbove[retAbove.length - 1].supplierId === null)
          retAbove.pop();
      }

      if (retBelow.length >= 1) {
        if (retBelow[0].supplierId === null)
          retBelow.shift();
        if (retBelow.length > 0 && retBelow[retBelow.length - 1].supplierId === null)
          retBelow.pop();
      }

      for (const x of retBelow)
        retAbove.push(x);

      if (retAbove[0].supplierId === null && retAbove.length === 1) {
        logger.error(`query.service.findChain: No matches`);
        retAbove[0].supplierId = "error";
        return JSON.stringify(retAbove);
      }

      return JSON.stringify(retAbove);
    }
  }
  // end::findChain[]

  /**
   * @public
   * Return latest snapshot. If no snapshot exists, error will be logged
   *  and initialized odject will be return
   *
   * @returns {Promise<string>}
   */
  // tag::askSnapshotRC[]
  async askSnapshotRC() {

    // Construct the object used to return
    const ret = {
      "id": "",
      "date": 0
    };

    // Open a new database session
    const session = this.driver.session();

    // Search for the node with unique ID
    const res = await session.executeWrite(
      tx => tx.run(`
        MERGE (flag:Flag)
        SET flag.value = 0
        WITH flag
        OPTIONAL MATCH (n:Snapshot)
        WITH flag, n
        CALL {
          WITH flag, n
          SET flag.value =
            CASE 
              WHEN n.stamp IS NOT NULL AND n.stamp > flag.value THEN n.stamp
              ELSE flag.value
            END
        }
        WITH DISTINCT flag.value AS date
        OPTIONAL MATCH (n:Snapshot)
        WHERE n.stamp = date
        WITH n,
          CASE
            WHEN n IS NULL THEN 0
            ELSE 1
          END AS exist 
        RETURN {
          date: n.stamp,
          id: n.id,
          exist: exist
        } as reply  
      `, {})
    );

    // Close the session
    await session.close();


    // Check if node exist
    const Exist = res.records.map(row => toNativeTypes(row.get('reply')))[0].exist;

    if (!Exist) {
      logger.error(`query.service.askSnapshotRC: No recorded snapshot exist!`);
      return JSON.stringify(ret);
    }

    ret.id = res.records.map(row => toNativeTypes(row.get('reply')))[0].id;
    ret.date = res.records.map(row => toNativeTypes(row.get('reply')))[0].date;

    // return in json form
    return JSON.stringify(ret);

    //return a relation's existence
  }
  // end::askSnapshotRC[]

  /**
   * @public
   * Return snapshot record with given cid. If no snapshot with given cid exists, 
   * error will be logged and initialized odject will be return
   *
   * @param {string} cid               The cid of target snapshot
   * @returns {Promise<string>}
   */
  // tag::getSnapshotRC[]
  async getSnapshotRC(cid) {

    // Construct the object used to return
    const ret = {
      "id": "",
      "date": 0
    };

    // Open a new database session
    const session = this.driver.session();

    // Search for the node with unique ID
    const res = await session.executeRead(
      tx => tx.run(`
        OPTIONAL MATCH (n:Snapshot)
        WHERE n.id = $cid
        WITH n,
          CASE
            WHEN n IS NULL THEN 0
            ELSE 1
          END AS exist 
        RETURN {
          date: n.stamp,
          id: n.id,
          exist: exist
        } as reply  
      `, { cid })
    );

    // Close the session
    await session.close();


    // Check if node exist
    const Exist = res.records.map(row => toNativeTypes(row.get('reply')))[0].exist;

    if (!Exist) {
      logger.error(`query.service.getSnapshotRC: Snapshot record with given cid ${cid} doesn't exist!`);
      return JSON.stringify(ret);
    }

    ret.id = res.records.map(row => toNativeTypes(row.get('reply')))[0].id;
    ret.date = res.records.map(row => toNativeTypes(row.get('reply')))[0].date;

    // return in json form
    return JSON.stringify(ret);

    //return a relation's existence
  }
  // end::getSnapshotRC[]
}
