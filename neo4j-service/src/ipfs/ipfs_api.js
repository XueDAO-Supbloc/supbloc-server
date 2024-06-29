import { create } from 'kubo-rpc-client'
import { spawn } from "child_process";

const client = create()

export function InitIpfsNode() {
  return new Promise((resolve, reject) => {
    const ipfs = spawn("./node_modules/kubo/bin/ipfs", ["init"]);
    resolve("IPFS node initialized");
  });
}

export function StartIpfsNode() {
  return new Promise((resolve, reject) => {
    const ipfs = spawn("./node_modules/kubo/bin/ipfs", ["daemon"]);
    ipfs.stdout.on("data", (data) => {
      if (data.toString().includes("Daemon is ready")) {
        resolve("IPFS node is ready");
      }
    });
  });
}

export async function UploadIpfs(jsonData) {
  try {
    const result = await client.add({ content: jsonData });
    const cid = result.cid.toString();
    return cid;
  } catch (err) {
    console.error('Error uploading to IPFS:', err);
    return null;
  }
}

export async function FetchIpfs(cid) {
  try {
    const chunks = [];
    for await (const chunk of client.cat(cid)) {
      chunks.push(chunk);
    }
    const fileContent = Buffer.concat(chunks).toString();
    const jsonContent = JSON.parse(fileContent);
    return jsonContent;
  } catch (err) {
    console.error('Error fetching file from IPFS:', err);
    return null;
  }
}
