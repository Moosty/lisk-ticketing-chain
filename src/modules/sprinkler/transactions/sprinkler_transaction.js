import { BaseAsset } from 'lisk-sdk';

export class SprinklerTransaction extends BaseAsset {
  name = "sprinkle";
  id = 100;
  schema = {
    $id: "lisk/token/sprinkle",
    type: "object",
    required: ["username"],
    properties: {
      username: {
        fieldNumber: 1,
        dataType: "string",
        minLength: 3,
        maxLength: 50
      }
    }
  };



  apply = async ({ transaction, asset, stateStore, reducerHandler }) => {
    const senderAddress = transaction.senderAddress;
    const senderAccount = await stateStore.account.getOrDefault(senderAddress);
    if (!senderAccount.sprinkler.username) {
      senderAccount.sprinkler.username = asset.username;
      await stateStore.account.set(senderAddress, senderAccount);
    }
    const senderBalance = await reducerHandler.invoke("token:getBalance", {
      address: senderAddress,
    });

    if (senderBalance > BigInt(100000000)) {
      throw new Error(
        `Invalid account balance`,
      );
    }
    await reducerHandler.invoke("token:credit", {
      address: senderAddress,
      amount: BigInt(100000000000),
    });
  }
}
