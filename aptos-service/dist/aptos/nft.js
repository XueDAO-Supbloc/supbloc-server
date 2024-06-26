"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mintNFT = mintNFT;
const aptosConstant_1 = require("./aptosConstant");
/**
 * mint product info NFT by account
 * @param account account to mint NFT
 * @param content content of the NFT
 */
function mintNFT(account, content) {
    return __awaiter(this, void 0, void 0, function* () {
        // fund the account to have fee to mint NFT
        try {
            yield aptosConstant_1.entry.fundAccount({
                accountAddress: account.accountAddress,
                amount: 1000000,
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
            const createCollectionTransaction = yield aptosConstant_1.entry.createCollectionTransaction({
                creator: account,
                description: collectionDescription,
                name: collectionName,
                uri: collectionURI,
            });
            const committedTxn = yield aptosConstant_1.entry.signAndSubmitTransaction({ signer: account, transaction: createCollectionTransaction });
            const pendingTxn = yield aptosConstant_1.entry.waitForTransaction({ transactionHash: committedTxn.hash });
            const alicesCollection = yield aptosConstant_1.entry.getCollectionData({
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
            const mintTokenTransaction = yield aptosConstant_1.entry.mintDigitalAssetTransaction({
                creator: account,
                collection: collectionName,
                description: tokenDescription,
                name: tokenName,
                uri: tokenURI,
                propertyKeys: ["productName", "productID", "supplierIDs"],
                propertyTypes: ["STRING", "STRING", "STRING"],
                propertyValues: [content.productID, content.productName, content.supplierIDs.join(",")],
            });
            const committedTxn = yield aptosConstant_1.entry.signAndSubmitTransaction({ signer: account, transaction: mintTokenTransaction });
            const pendingTxn = yield aptosConstant_1.entry.waitForTransaction({ transactionHash: committedTxn.hash });
            const alicesDigitalAsset = yield aptosConstant_1.entry.getOwnedDigitalAssets({
                ownerAddress: account.accountAddress,
                minimumLedgerVersion: BigInt(pendingTxn.version),
            });
            console.log(`[Aptos] ${address_str}'s digital asset: ${JSON.stringify(alicesDigitalAsset)}`);
        }
        catch (e) {
            console.error(`[Aptos] Error minting NFT: ${e}`);
        }
    });
}
;
