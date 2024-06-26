"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = __importDefault(require("https"));
const getPosts = () => {
    let data = '';
    const productID = "afkQgFCms7u6dZUIqR1P";
    const url = `https://neo4j-service-dot-connect-hackthon-2024.df.r.appspot.com/api/product?productId=${productID}`;
    const request = https_1.default.get(url, (response) => {
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            console.log(data);
        });
    });
    request.on('error', (error) => {
        console.error(error);
    });
    request.end();
};
