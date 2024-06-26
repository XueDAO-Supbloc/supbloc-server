import { Account } from "@aptos-labs/ts-sdk";
import { entry } from "./aptosConstant";
import { setUncaughtExceptionCaptureCallback } from "process";

export type NFTcontent = {
  productID: string,
  productName: string,
  supplierIDs: string[],
}

/**
 * mint product info NFT by account
 * @param account account to mint NFT
 * @param content content of the NFT
 */

export async function mintNFT(account: Account, content: NFTcontent) {

  // fund the account to have fee to mint NFT
  try {
    await entry.fundAccount({
      accountAddress: account.accountAddress,
      amount: 1_000_000,
    });
  }
  catch (e) {
    console.error(`[Aptos] Error funding account: ${e}`);
  }

  const address_str = Buffer.from(account.accountAddress.data).toString('hex');
  const collectionName = `${address_str}_supbloc_collection`;
  const collectionDescription = "food NFTs of supbloc";
  const collectionURI = `supbloc_${address_str}/`;

  // Create the collection
  try {
    const createCollectionTransaction = await entry.createCollectionTransaction({
      creator: account,
      description: collectionDescription,
      name: collectionName,
      uri: collectionURI,
    });

    const committedTxn = await entry.signAndSubmitTransaction({ signer: account, transaction: createCollectionTransaction });
    const pendingTxn = await entry.waitForTransaction({ transactionHash: committedTxn.hash });

    const alicesCollection = await entry.getCollectionData({
      creatorAddress: account.accountAddress,
      collectionName,
      minimumLedgerVersion: BigInt(pendingTxn.version),
    });
    console.log(`[Aptos] Create collection: ${JSON.stringify(alicesCollection, null, 4)}`);
  }
  catch (e) {
    // If the collection already exists, ignore the error
    console.error(`[Aptos] Error creating collection: ${e}`);
  }

  try {
    const tokenName = `${content.productID}_NFT`;
    const tokenDescription = `NFT of product ${content.productName}`;
    const tokenURI = `${collectionURI}${content.productID}`;

    const mintTokenTransaction = await entry.mintDigitalAssetTransaction({
      creator: account,
      collection: collectionName,
      description: tokenDescription,
      name: tokenName,
      uri: tokenURI,
      propertyKeys: ["productName", "productID", "supplierIDs"],
      propertyTypes: ["STRING", "STRING", "STRING"],
      propertyValues: [content.productID, content.productName, content.supplierIDs.join(",")],
    });

    const committedTxn = await entry.signAndSubmitTransaction({ signer: account, transaction: mintTokenTransaction });
    const pendingTxn = await entry.waitForTransaction({ transactionHash: committedTxn.hash });
    const digitalAsset = await entry.getOwnedDigitalAssets({
      ownerAddress: account.accountAddress,
      minimumLedgerVersion: BigInt(pendingTxn.version),
    });
    console.log(`[Aptos] ${address_str}'s digital asset: ${JSON.stringify(digitalAsset)}`);
  }
  catch (e) {
    console.error(`[Aptos] Error minting NFT: ${e}`);
  }
};
