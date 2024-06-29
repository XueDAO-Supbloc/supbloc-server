import { Account } from "@aptos-labs/ts-sdk";
import { entry } from "./aptosConstant";
import { setUncaughtExceptionCaptureCallback } from "process";
import { count } from "console";

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
      amount: 1_000_000_000,
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
    console.log(`[Aptos] Mint NFT successs`);
  }
  catch (e) {
    console.error(`[Aptos] Error minting NFT: ${e}`);
  }
};

/**
 * get all NFTs of an account
 * @param account account to get NFTs
 */
export async function getNFTs(account: Account): Promise<NFTcontent[] | undefined> {

  const address_str = Buffer.from(account.accountAddress.data).toString('hex');

  // get collection of the account
  const collectionName = `${address_str}_supbloc_collection`;
  const collection = await entry.getCollectionData({
    creatorAddress: account.accountAddress,
    collectionName,
  });

  if (!collection) {
    console.log(`[Aptos] ${address_str} does not have any collection`);
    return;
  }

  const collectionId = collection.collection_id;

  // get all digital assets of the account
  const digitalAsset = await entry.getOwnedDigitalAssets({
    ownerAddress: account.accountAddress,
  });

  if (digitalAsset.length === 0) {
    console.log(`[Aptos] ${address_str} does not have any digital asset`);
    return;
  }

  // console.log(`[Aptos] ${address_str}'s digital asset:\n${JSON.stringify(digitalAsset, null, 4)}`);

  const nfts: NFTcontent[] = [];
  digitalAsset.forEach(async (asset) => {
    const token_data = asset.current_token_data;
    if (collectionId == token_data?.collection_id) {
      const properties = token_data?.token_properties;
      const content: NFTcontent = {
        productID: properties?.productID,
        productName: properties?.productName,
        supplierIDs: properties?.supplierIDs.split(","),
      };
      nfts.push(content);
    }
  });

  return nfts;
};