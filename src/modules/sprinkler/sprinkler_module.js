import { BaseModule } from 'lisk-sdk';
import { SprinklerTransaction } from "./transactions";
import { getAllUsernamesAsJSON } from './sprinkler_asset';

export class SprinklerModule extends BaseModule {
  name = "sprinkler";
  id = 6666;
  transactionAssets = [new SprinklerTransaction()];

  accountSchema = {
    type: "object",
    required: ["username"],
    properties: {
      username: {
        dataType: "string",
        fieldNumber: 1,
      }
    },
    default: {
      username: ""
    },
  };

  actions = {
    getAllUsernames: async () => getAllUsernamesAsJSON(this._dataAccess),
  };

  beforeTransactionApply = async ({ transaction, stateStore, reducerHandler}) => {
    if (transaction.moduleID === 6666) {
      const sender = await stateStore.account.getOrDefault(transaction.senderAddress);
      await stateStore.account.set(transaction.senderAddress, sender);
      await reducerHandler.invoke("token:credit", {
        address: transaction.senderAddress,
        amount: BigInt(6000000),
      });
    }
  }
}
