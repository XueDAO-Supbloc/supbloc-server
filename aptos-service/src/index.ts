import express, { Express, Request, Response } from "express";
import swaggerUI from "swagger-ui-express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";

import { router } from "./api";
import swaggerDocument from "./swagger.json";
import { keyfilepath, accountfilepath } from "./constant";

dotenv.config();

try {
  fs.writeFileSync(keyfilepath, "", { flag: 'a' });
  fs.writeFileSync(accountfilepath, "", { flag: 'a' });
} catch (e) {
  console.log(e);
}

// Start the server
const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api", router);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.get("/", (_, res: Response) => {
  res.send("please go to /api-docs to see the documentation");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
