import {AppConfig} from "../../index";
import * as fs_extra from "fs-extra";
import {codec, cryptography, db} from "lisk-sdk";
import os from "os";
import path from "path";

const DB_KEY_TRANSACTIONS = "extended:transactions";

// Schemas
const encodedTransactionSchema = {
  $id: 'extendedapi/encoded/transactions',
  type: 'object',
  required: ['transactions'],
  properties: {
    transactions: {
      type: 'array',
      fieldNumber: 1,
      items: {
        type: 'object',
        properties: {
          tx: {
            fieldNumber: 1,
            dataType: 'bytes'
          },
          height: {
            fieldNumber: 2,
            dataType: 'uint32',
          }
        }
      },
    },
  },
};

const getDBInstance = async (dataPath = `~/.lisk/${AppConfig.label}/`, dbName = 'extended_plugin.db') => {
  const dirPath = path.join(dataPath.replace('~', os.homedir()), 'plugins/data', dbName);
  await fs_extra.ensureDir(dirPath);
  return new db.KVStore(dirPath);
};

const getTransactions = async (db) => {
  try {
    const encodedTransactions = await db.get(DB_KEY_TRANSACTIONS);
    const { transactions } = codec.decode(encodedTransactionSchema, encodedTransactions);
    return transactions;
  }
  catch (error) {
    return [];
  }
};

const getAllTransactions = async (db, registeredSchema) => {
  const savedTransactions = await getTransactions(db);
  const transactions = [];
  for (const trx of savedTransactions) {
    transactions.push({tx: decodeTransaction(trx.tx, registeredSchema), height: trx.height});
  }
  return transactions;
}

const saveTransactions = async (db, payload) => {
  const savedTransactions = await getTransactions(db);
  const transactions = [...savedTransactions, ...payload];

  const encodedTransactions = codec.encode(encodedTransactionSchema, { transactions });
  await db.put(DB_KEY_TRANSACTIONS, encodedTransactions);
};

const decodeTransaction = (
  encodedTransaction,
  registeredSchema,
) => {
  const transaction = codec.decode(registeredSchema.transaction, encodedTransaction);
  const assetSchema = getTransactionAssetSchema(transaction, registeredSchema);
  const asset = codec.decode(assetSchema, transaction.asset);
  const id = cryptography.hash(encodedTransaction);
  return {
    ...codec.toJSON(registeredSchema.transaction, transaction),
    asset: codec.toJSON(assetSchema, asset),
    id: id.toString('hex'),
  };
};

const getTransactionAssetSchema = (
  transaction,
  registeredSchema,
) => {
  const txAssetSchema = registeredSchema.transactionsAssets.find(
    assetSchema =>
      assetSchema.moduleID === transaction.moduleID && assetSchema.assetID === transaction.assetID,
  );
  if (!txAssetSchema) {
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `ModuleID: ${transaction.moduleID} AssetID: ${transaction.assetID} is not registered.`,
    );
  }
  return txAssetSchema.schema;
};

export {
  getDBInstance,
  getAllTransactions,
  getTransactions,
  saveTransactions,
}
