import express from "express";
import cors from "cors";
import swaggerUI from "swagger-ui-express";

import { StartIpfsNode, UploadIpfs, FetchIpfs, InitIpfsNode } from "./ipfs/ipfs_api.js";
import apiRouter from "./route/route.js";
import swaggerDocument from './swagger.json' assert { type: "json" };
import { initDriver } from "./src/neo4j.js";
import { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, IPFS_SET } from "./src/constants.js";

function StartServer() {
  const app = express();
  app.use(cors());

  app.use(express.json());
  app.use("/api", apiRouter);
  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

  const PORT = process.env.PORT || 4000;

  app.get("/", (req, res) => {
    res.send("please go to /api-docs to see the documentation");
  });

  app.listen(PORT, () => {
    console.log(`the server is running on port ${PORT}`)
  });
}

// async function TestIpfs() {
//   const jsonContent = JSON.stringify({
//     buyer: 'Alice',
//     seller: 'Bob',
//     product: 'Car'
//   });

//   const cid = await UploadIpfs(jsonContent);
//   console.log('Uploaded to IPFS with CID:', cid);

//   const result = await FetchIpfs(cid);
//   console.log('Fetched from IPFS:', result);
// }

/* Main */

// Run ipfs node on server start
if (IPFS_SET) {
  InitIpfsNode()
    .then((res) => {
      console.log(res);
      return StartIpfsNode()
    })
    .then((res) => {
      console.log(res);

      // Connect to Neo4j and Verify Connectivity
      initDriver(NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD);

      // Create express server
      StartServer();
    })
}
else {
  // Connect to Neo4j and Verify Connectivity
  initDriver(NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD);

  // Create express server
  StartServer();
}