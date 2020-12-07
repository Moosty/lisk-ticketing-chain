import { codec, cryptography } from 'lisk-sdk';

const sprinklerAssetSchema = {
  $id: "lisk/sprinkler/usernames",
  type: "object",
  required: ["registeredUsernames"],
  properties: {
    registeredUsernames: {
      type: "array",
      fieldNumber: 1,
      items: {
        type: "object",
        required: ["id", "username", "ownerAddress"],
        properties: {
          id: {
            dataType: "bytes",
            fieldNumber: 1,
          },
          username: {
            dataType: "string",
            fieldNumber: 2,
          },
          ownerAddress: {
            dataType: "bytes",
            fieldNumber: 3,
          },
        },
      },
    },
  },
};

const CHAIN_STATE_SPRINKLER = "sprinkler:usernames";

const createSprinklerAccount = ({ownerAddress, nonce, username}) => {
  const nonceBuffer = Buffer.alloc(8);
  nonceBuffer.writeBigInt64LE(nonce);
  const seed = Buffer.concat([ownerAddress, nonceBuffer]);
  const id = cryptography.hash(seed);

  return {
    id,
    ownerAddress,
    username,
  };
};

const getAllSprinklerAccounts = async stateStore => {
  const registeredAccountsBuffer = await stateStore.chain.get(
    CHAIN_STATE_SPRINKLER
  );

  if (!registeredAccountsBuffer) {
    return [];
  }

  const registeredAccounts = codec.decode(
    sprinklerAssetSchema,
    registeredAccountsBuffer
  );

  return registeredAccounts.registeredUsernames;
}

const getAllUsernamesAsJSON = async dataAccess => {
  const registeredAccountsBuffer = await dataAccess.getChainState(
    CHAIN_STATE_SPRINKLER
  );

  if (!registeredAccountsBuffer) {
    return [];
  }

  const registeredAccounts = codec.decode(
    sprinklerAssetSchema,
    registeredAccountsBuffer
  );

  const accountJSON = codec.toJSON(sprinklerAssetSchema, registeredAccounts);

  return accountJSON.registeredUsernames;
}

const setAllSprinklerAccounts = async (stateStore, sprinklerAccounts) => {
  const registeredAccounts = {
    registeredSprinklerAccounts: sprinklerAccounts.sort((a, b) => a.id.compare(b.id))
  };

  await stateStore.chain.set(
    CHAIN_STATE_SPRINKLER,
    codec.encode(sprinklerAssetSchema, registeredAccounts)
  );
}

export {
  CHAIN_STATE_SPRINKLER,
  setAllSprinklerAccounts,
  getAllSprinklerAccounts,
  getAllUsernamesAsJSON,
  createSprinklerAccount,
  sprinklerAssetSchema,
}
