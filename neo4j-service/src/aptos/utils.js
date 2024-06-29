import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import base58 from "base-58";

/**
 * A convenience function to compile a package locally with the CLI
 * @param packageDir
 * @param outputFile
 * @param namedAddresses
 */
export function compilePackage(packageDir, outputFile, namedAddresses) {
  // console.log("In order to run compilation, you must have the `aptos` CLI installed.");
  try {
    execSync("aptos --version");
  }
  catch (e) {
    console.log("aptos is not installed. Please install it from the instructions on aptos.dev");
  }
  const addressArg = namedAddresses.map(({ name, address }) => `${name}=${address}`).join(" ");
  // Assume-yes automatically overwrites the previous compiled version, only do this if you are sure you want to overwrite the previous version.
  console.log(path.join(process.cwd(), packageDir));
  const compileCommand = `aptos move build-publish-payload --json-output-file ${outputFile} --package-dir ${packageDir} --named-addresses ${addressArg} --assume-yes`;
  console.log("Running the compilation locally, in a real situation you may want to compile this ahead of time.");
  execSync(compileCommand);
}
/**
 * A convenience function to get the compiled package metadataBytes and byteCode
 * @param packageDir
 * @param outputFile
 * @param namedAddresses
 */
export function getPackageBytesToPublish(filePath) {
  // current working directory - the root folder of this repo
  const cwd = process.cwd();
  // target directory - current working directory + filePath (filePath json file is generated with the prevoius, compilePackage, cli command)
  const modulePath = path.join(cwd, filePath);
  const jsonData = JSON.parse(fs.readFileSync(modulePath, "utf8"));
  const metadataBytes = jsonData.args[0].value;
  const byteCode = jsonData.args[1].value;
  return { metadataBytes, byteCode };
}

export function base58ToU256(base58Str) {
  // Decode the Base58 string to bytes
  const bytes = base58.decode(base58Str);

  // Convert the bytes to a BigInt
  let u256 = BigInt(0);
  for (const byte of bytes) {
    u256 = (u256 << BigInt(8)) + BigInt(byte);
  }

  return u256;
}

export function u256ToBase58(u256) {
  // Convert the BigInt to bytes
  let hex = u256.toString(16);
  if (hex.length % 2) {
    hex = '0' + hex;
  }
  const bytes = Buffer.from(hex, 'hex');

  // Encode the bytes to a Base58 string
  const base58Str = base58.encode(bytes);

  return base58Str;
}