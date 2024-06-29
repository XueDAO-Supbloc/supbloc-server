var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
    function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
import { Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { compilePackage, getPackageBytesToPublish, base58ToU256, u256ToBase58 } from "./utils.js";
import path from "path";

import { ABI } from "./abi.js";
import { createSurfClient } from "@thalalabs/surf";
const CONTRACT_PATH = "src/move";
var REPO_HOLDER;
var MODULE_ADDRESS;
var APTOS_CONFIG;
var INITIALIZED = false;
/**
 * Publish the contract and start a service
 * @param aptos
 * @param address
 */
export const start_service = (aptos, user) => __awaiter(void 0, void 0, void 0, function* () {
  if (INITIALIZED) {
    throw new Error("Service already started");
  }
  // not yet for mainnet
  if (aptos.config.network == Network.MAINNET) {
    throw new Error("Mainnet not supported");
  }
  INITIALIZED = true;
  APTOS_CONFIG = aptos;
  REPO_HOLDER = user;
  yield create_repo();
  return;
});
export const push_data = (key_string, value_string) => __awaiter(void 0, void 0, void 0, function* () {
  const aptos = APTOS_CONFIG;
  const repo_holder = yield get_repo_holder();
  const surf_client = yield createSurfClient(aptos);
  // convert key and value to u256
  const key = BigInt(key_string);
  const value = BigInt(value_string);
  const result = yield surf_client.useABI(ABI).entry.add_data({
    typeArguments: [],
    functionArguments: [key, value],
    account: repo_holder,
  });
  console.log("data pushed with key: " + key + " value: " + value);
});
export const fetch_data = (key) => __awaiter(void 0, void 0, void 0, function* () {
  const aptos = APTOS_CONFIG;
  const repo_holder = yield get_repo_holder();
  const surf_client = yield createSurfClient(aptos);
  const repo = yield surf_client.useABI(ABI).resource.SnapRepo({
    typeArguments: [],
    account: repo_holder.accountAddress,
  });
  const handle = repo.content.handle;
  const table_item = {
    key_type: "u256",
    value_type: "u256",
    key: `${BigInt(key)}`,
  };
  const data = yield aptos.getTableItem({
    handle: handle,
    data: table_item
  });
  console.log("data fetched: " + data);
  return data;
});
export const get_module_address = () => __awaiter(void 0, void 0, void 0, function* () {
  return MODULE_ADDRESS;
});
const get_repo_holder = () => __awaiter(void 0, void 0, void 0, function* () {
  return REPO_HOLDER;
});
const create_repo = () => __awaiter(void 0, void 0, void 0, function* () {
  const aptos = APTOS_CONFIG;
  const client = createSurfClient(aptos);
  const repo_holder = yield get_repo_holder();
  const result = yield client.useABI(ABI).entry.create_repo({
    functionArguments: [],
    typeArguments: [],
    account: repo_holder
  });
  console.log("repo created at " + repo_holder.accountAddress.toString());
});
// we will publish manually for now
const publish_package = (signer) => __awaiter(void 0, void 0, void 0, function* () {
  // compile package
  const repo_holder = get_repo_holder();
  const package_path = path.join(CONTRACT_PATH, "snap_repo");
  compilePackage(package_path, package_path + "/snap_repo.json", [{ name: "snap_repo_addr", address: (yield repo_holder).accountAddress }]);
  const { metadataBytes, byteCode } = getPackageBytesToPublish(path.join(package_path, "/snap_repo.json"));
  // publish package
  const aptos = APTOS_CONFIG;
  const transaction = yield aptos.publishPackageTransaction({
    account: signer.accountAddress,
    metadataBytes: metadataBytes,
    moduleBytecode: byteCode,
  });
  const pendingTransaction = yield aptos.signAndSubmitTransaction({
    signer: signer,
    transaction: transaction,
  });
  yield aptos.waitForTransaction({ transactionHash: pendingTransaction.hash });
});
// test basic flow of service
const test1 = () => __awaiter(void 0, void 0, void 0, function* () {
  const aptos_network = Network.DEVNET;
  const config = new AptosConfig({ network: aptos_network });
  const aptos = new Aptos(config);
  const user = Account.generate();
  yield aptos.faucet.fundAccount({
    accountAddress: user.accountAddress,
    amount: 100000000
  });
  yield start_service(aptos, user);
  // add some data
  var data_array = [];
  for (let i = 0; i < 5; i++) {
    const temp = yield Account.generate(); // as random number
    const string_array = [temp.accountAddress.toString(), temp.publicKey.toString()];
    data_array.push(string_array);
    yield push_data(string_array[0], string_array[1]);
  }
  var result = [];
  for (let i = 0; i < 5; i++) {
    const temp = yield fetch_data(data_array[i][0]);
    result.push(temp.toString());
  }
  // compare the result
  for (let i = 0; i < 5; i++) {
    if (data_array[i][1] != `0x${BigInt(result[i]).toString(16)}`) {
      console.log("test1 failed");
      return;
    }
  }
  console.log("test1 pass");
});

// test1();
