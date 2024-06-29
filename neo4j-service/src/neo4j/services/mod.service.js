import { logger } from '../../utils/logger.js';
import { MAX_PATH_LENGTH } from '../../utils/constants.js';
import { toNativeTypes } from '../utils.js';

export default class ModService {
  /**
   * @type {neo4j.Driver}
   */
  driver

  /**
  * The constructor expects an instance of the Neo4j Driver, which will be
  * used to interact with Neo4j. You can check if the adding process succeed
  * with the parameter "succeed" included in the return json
  *
  * @param {neo4j.Driver} driver
  */
  constructor(driver) {
    this.driver = driver;
  }

  /**
   * @public
   * This method meant to create one new Supplier node in the database.
   * However, since the MERGE clause is used here, we won't know if the
   * node already existed before we add it. So the method should be used
   * carefully or with getSupplier in query.service.js
   *
   * @param {string} supplierName    The name of the Supplier
   * @param {string} supplierId      The id of the Supplier
   * @param {string} safety          The safety level of the Supplier
   * @param {number} stamp            The timestamp of the Supplier
   * @returns {Promise<string>}
   */
  // tag::addSupplier[]
  async addSupplier(supplierName, supplierId, safety, stamp) {
    // Construct the object used to return
    const ret = {
      "supplierId": supplierId,
    };

    // Open a new database session
    const session = this.driver.session();

    // Search for the node with unique ID
    await session.executeWrite(
      tx => tx.run(`
        MERGE (n:Supplier {id: $supplierId})
        SET n.name = $supplierName
        SET n.marked = $safety
        SET n.stamp = ${stamp}
      `, { supplierId, supplierName, safety })
    );

    // Close the session
    await session.close();

    // logger
    logger.info(`mod.service.addSupplier: Supplier ${supplierName} with ID ${supplierId}(${safety}) is processed!`);

    return JSON.stringify(ret);
  }
  // end::addSupplier[]

  /**
   * @public
   * This method meant to delete the Supplier with given transactionID
   * in the database. No actions will be performed to the database if Supplier with
   * given id doesn't exist, which is quite safe.
   *
   * @param {string} supplierId  The ID of the Supplier, supposed to be unique
   * @returns {Promise<string>}
   */
  // tag::delSupplier[]
  async delSupplier(supplierId) {
    // Construct the object used to return
    const ret = {
      "supplierId": supplierId,
    };

    // Open a new database session
    const session = this.driver.session();

    // Search for node with unique id
    await session.executeWrite(
      tx => tx.run(`
        OPTIONAL MATCH (a:Supplier{id: $supplierId})
        DETACH DELETE a
      `, { supplierId })
    );

    // Close the session
    await session.close();

    // logger
    logger.info(`mod.service.delSupplier: Supplier with ID ${supplierId} is processed!`);

    return JSON.stringify(ret);

  }
  // end::delSupplier[]

  /**
   * @public
   * This method meant to create both Bought and Sold relation between Buyer and Seller 
   * node in the database. However,since the MERGE clause is used here, we won't know 
   * if the either relation already existed or either node didn't existed before we 
   * process. So the method should be used carefully or with getTransaction in 
   * query.service.js
   *
   * @param {string} transactionId  The ID of the transaction, supposed to be unique
   * @param {string} buyerID        The ID of the buying Supplier
   * @param {string} sellerID       The ID of the selling Supplier
   * @param {number} date           The trading date in milliseconds
   * @param {string} item           The traded item in the transaction, supposed only one per transaction
   * @param {number} stamp          The time stamp when the transaction is made in milliseconds
   * @returns {Promise<string>}
   */
  // tag::addTransaction[]
  async addTransaction(transactionId, buyerID, sellerID, date, item, stamp) {
    // Construct the object used to return
    const ret = {
      "transactionId": transactionId,
    };

    // Open a new database session
    const session = this.driver.session();

    // Search for both node with unique ID first then relation with unique ID
    await session.executeWrite(
      tx => tx.run(`
        MERGE (buyer:Supplier {id: $buyerID})
        WITH buyer
        MERGE (seller:Supplier{id: $sellerID})
        WITH buyer, seller
        MERGE (buyer) -[b:Bought]-> (seller)
        WITH buyer, seller, b
        SET b.id = $transactionId
        SET b.items = $item
        SET b.time = ${date}
        SET b.stamp = ${stamp}
        MERGE (buyer) <-[s:Sold]- (seller)
        WITH buyer, seller, b, s
        SET s.id = $transactionId
        SET s.items = $item
        SET s.time = ${date}
        SET s.stamp = ${stamp}
      `, { buyerID, sellerID, transactionId, item })
    );

    // Close the session
    await session.close();

    // logger
    logger.info(`mod.service.addTransaction: Bought and Sold between ${buyerID} and ${sellerID} is processed!`);

    return JSON.stringify(ret);

  }
  // end::addTransaction[]

  /**
   * @public
   * This method meant to delete both Bought and Sold relation with given transactionID 
   * in the database. No actions will be performed to the database if transaction with
   * given id doesn't exist, which is quite safe.
   *
   * @param {string} transactionId  The ID of the transaction, supposed to be unique
   * @returns {Promise<string>}
   */
  // tag::delTransaction[]
  async delTransaction(transactionId) {
    // Construct the object used to return
    const ret = {
      "transactionId": transactionId,
    };

    // Open a new database session
    const session = this.driver.session();

    // Search for relation with unique id
    await session.executeWrite(
      tx => tx.run(`
        OPTIONAL MATCH (a) -[b:Bought{id: $transactionId}]-> (c)
        DELETE b
        WITH *
        OPTIONAL MATCH (t) <-[s:Sold{id: $transactionId}]- (v)
        DELETE s
      `, { transactionId })
    );

    // Close the session
    await session.close();

    // logger
    logger.info(`mod.service.delTransaction: Bought and Sold with ID ${transactionId} is processed!`);

    return JSON.stringify(ret);

  }
  // end::delTransaction[]

  /**
   * @public
   * This method meant to (un)mark an existing Supplier node in the database. 
   * However, since the MERGE clause is used here, we won't know if the 
   * node already existed before we add it. So the method should be used
   * carefully or with getSupplier in query.service.js. Meanwhile, this means
   * that you can substitute addNode to markNode(name, 0).
   *
   * @param {string} supplierId          The name of the Supplier
   * @param {string} safety        The target safety level of the Supplier
   * @returns {Promise<null>}    
   */
  // tag::markSupplier[]
  async markSupplier(supplierId, safety) {

    // Open a new database session
    const session = this.driver.session();

    // Search for the node with unique id
    await session.executeWrite(
      tx => tx.run(`
        MERGE (n:Supplier {id: $supplierId})
        WITH n
        SET n.marked = $safety
      `, { supplierId, safety })
    );

    // Close the session
    await session.close();

    // logger
    logger.info(`mod.service.markSupplier: Node with ID ${supplierId} is marked as ${safety}!`);

    return;
  }
  // end::markSupplier[]

  /**
   * @public
   * Mark the whole chain from given node(Supplier) following specified relation with specific 
   * attributes and direction. No actions will be performed to the database if node with
   * given id doesn't exist or no transactions meet our requirement, which is quite safe.
   * 
   * @param {string} supplierId    The ID of the Supplier
   * @param {string} productId     The ID of product used to determine start
   * @param {number} date          The date used to filter transactions before it
   * @param {string} flow          The direction we travel, expecting "upstream" and "downstream"
   * @param {string} safety        The target safety level to set
   * @returns {Promise<null>}    
   */
  // tag::markChain[]
  async markChain(supplierId, productId, date, flow, safety) {
    if (flow === "upstream") {
      // Open a new database session
      const session = this.driver.session();

      // Search for the node with unique name
      const res = await session.executeWrite(
        tx => tx.run(`
          OPTIONAL MATCH (start:Supplier {id: $supplierId})-[b:Bought WHERE b.time >= ${date} AND b.items = $productId]-> (first)
          WITH DISTINCT first
          CALL {
            WITH first
            SET first.marked = $safety
            WITH first
            OPTIONAL MATCH (first) -[c:Sold WHERE c.time >= ${date}]->{1,100}(below:Supplier)
            RETURN DISTINCT first AS EVRY, below AS BELOW
          }
          WITH EVRY, BELOW
          CALL {
            WITH EVRY, BELOW
            MERGE (flag:Flag)
            SET flag.value = 0
            WITH DISTINCT BELOW, flag, EVRY
            OPTIONAL MATCH (BELOW) <-[d:Sold]- (branch:Supplier)
            SET flag.value = 
              CASE
                WHEN branch.marked = "unsafe" THEN 1
                ELSE flag.value
              END
            SET BELOW.marked = 
              CASE
                WHEN flag.value = 0 THEN $safety
                ELSE "unsafe"
              END
            RETURN DISTINCT EVRY AS FINAL, BELOW AS FIRST
          }
          WITH FIRST, FINAL
          CALL {
            WITH FINAL
            OPTIONAL MATCH (FINAL) -[c:Bought WHERE c.time >= ${date}]->{1,100}(above:Supplier)
            SET above.marked = $safety
            RETURN DISTINCT above AS ABOVE
          }
          WITH ABOVE
          CALL {
            WITH ABOVE
            OPTIONAL MATCH (ABOVE) -[c:Sold WHERE c.time >= ${date}]->{1,100}(below:Supplier)
            RETURN DISTINCT below AS BELOW
          }
          WITH BELOW
          CALL {
            WITH BELOW
            MERGE (flag:Flag)
            SET flag.value = 0
            WITH BELOW, flag
            OPTIONAL MATCH (BELOW) <-[d:Sold]- (branch)
            SET flag.value = 
              CASE
                WHEN branch.marked = "unsafe" THEN 1
                ELSE flag.value
              END
            SET BELOW.marked = 
              CASE
                WHEN flag.value = 0 THEN $safety
                ELSE "unsafe"
              END
            RETURN BELOW AS LAST
          }
          RETURN LAST
        `, { supplierId, productId, safety })
      );

      // Close the session
      await session.close();

      // logger
      logger.info(`mod.service.markChain: Nodes on the chain which starts from node with given ID ${supplierId} and related except itself are marked as ${safety}!`);

      return;
    }
    else {
      // Open a new database session
      const session = this.driver.session();

      // Search for the node with unique name
      const res = await session.executeWrite(
        tx => tx.run(`
          OPTIONAL MATCH (start:Supplier {id: $supplierId})-[s:Sold WHERE s.time >= ${date} AND s.items = $productId]-> (first)
          WITH DISTINCT start, s, first
          CALL {
            WITH start, s, first
            OPTIONAL MATCH (start) -[s]-> (first) <-[d:Sold]- (branch)
            WITH first, branch
            MERGE (flag:Flag)
            SET flag.value = 0
            WITH first, branch, flag
            SET flag.value = 
              CASE
                WHEN branch.marked = "unsafe" THEN 1
                ELSE flag.value
              END
            SET first.marked = 
              CASE
              WHEN flag.value = 0 THEN $safety
              ELSE first.marked
              END
            WITH first
            RETURN first AS EVRY
          }
          WITH EVRY
          CALL {
            WITH EVRY
            OPTIONAL MATCH (EVRY) -[c:Sold WHERE c.time >= ${date}]->{1,${MAX_PATH_LENGTH}}(below:Supplier) <-[d:Sold]- (branch:Supplier WHERE branch.id <> EVRY.id)
            WITH below, branch
            MERGE (flag:Flag)
            SET flag.value = 0
            WITH below, branch, flag
            SET flag.value = 
              CASE
                WHEN branch.marked = "unsafe" THEN 1
                ELSE flag.value
              END
            SET below.marked = 
              CASE
              WHEN flag.value = 0 THEN $safety
              ELSE below.marked
              END
            RETURN below AS FINAL
          }
          RETURN FINAL
        `, { supplierId, productId, safety })
      );

      // Close the session
      await session.close();

      // logger
      logger.info(`mod.service.markChain: Nodes on the chain which starts from node with given ID ${supplierId} and related except itself are marked as ${safety}!`);

      return;
    }
  }
  // end::markChain[]

  /**
   * @public
   * This method meant to create one new Snapshot node in the database.
   * However, since the MERGE clause is used here, we won't know if the
   * node already existed before we add it. So the method should be used
   * carefully or with getSnapshotRC in query.service.js
   *
   * @param {string} id              The cid of the Snapshot
   * @param {number} date            The timestamp of the Snapshot
   * @returns {Promise<string>}
   */
  // tag::addSnapshotRC[]
  async addSnapshotRC(id, date) {
    // Construct the object used to return
    const ret = {
      "id": "",
      "date": date
    };

    // Open a new database session
    const session = this.driver.session();

    // Search for the node with unique ID
    await session.executeWrite(
      tx => tx.run(`
        MERGE (n:Snapshot{id:$id})
        SET n.stamp = ${date}
        SET n.id = $id
      `, { id })
    );

    // Close the session
    await session.close();

    // logger
    logger.info(`mod.service.addSnapshotRC: Snapshot(ID:${ret.id}) record with stamp ${date} is processed!`);

    return JSON.stringify(ret);
  }
  // end::addSnapshotRC[]
}
