"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const api_1 = require("./api");
const swagger_json_1 = __importDefault(require("./swagger.json"));
const constant_1 = require("./constant");
dotenv_1.default.config();
try {
    fs_1.default.writeFileSync(constant_1.keyfilepath, "", { flag: 'a' });
    fs_1.default.writeFileSync(constant_1.accountfilepath, "", { flag: 'a' });
}
catch (e) {
    console.log(e);
}
// Start the server
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api", api_1.router);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default));
app.get("/", (_, res) => {
    res.send("please go to /api-docs to see the documentation");
});
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
