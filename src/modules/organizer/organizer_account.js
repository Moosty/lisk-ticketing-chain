import { codec, cryptography } from 'lisk-sdk';

const registeredOrganizerAccountSchema = {
  $id: "lisk/organizer/registeredAccounts",
  type: "object",
  required: ["registeredOrganizerAccounts"],
  properties: {
    registeredOrganizerAccounts: {
      type: "array",
      fieldNumber: 1,
      items: {
        type: "object",
        required: ["id", "organization", "ownerAddress"],
        properties: {
          id: {
            dataType: "bytes",
            fieldNumber: 1,
          },
          organization: {
            dataType: "string",
            fieldNumber: 2,
            minLength: 1,
            maxLength: 50,
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

const CHAIN_STATE_ORGANIZER_ACCOUNT = "organizer:registeredOrganizerAccounts";

const createOrganizerAccount = ({ownerAddress, nonce, organization}) => {
  const nonceBuffer = Buffer.alloc(8);
  nonceBuffer.writeBigInt64LE(nonce);
  const seed = Buffer.concat([ownerAddress, nonceBuffer]);
  const id = cryptography.hash(seed);

  return {
    id,
    ownerAddress,
    organization,
    // organization: new Buffer(organization),
  };
};

const getOrganization = async ({params, stateStore}) => {
  const { address } = params;
  if (!Buffer.isBuffer(address)) {
    throw new Error('Address must be a buffer');
  }
  const account = await stateStore.account.getOrDefault(address);
  return account.organizer.organization;
}

const getOrganizationById = async ({params, stateStore}) => {
  const { id } = params;
  const organizations = await getAllOrganizerAccounts(stateStore);
  return organizations.find(o => o.id.equals(id));
}

const getAllOrganizerAccounts = async stateStore => {
  const registeredAccountsBuffer = await stateStore.chain.get(
    CHAIN_STATE_ORGANIZER_ACCOUNT
  );

  if (!registeredAccountsBuffer) {
    return [];
  }

  const registeredAccounts = codec.decode(
    registeredOrganizerAccountSchema,
    registeredAccountsBuffer
  );

  return registeredAccounts.registeredOrganizerAccounts;
}

const getAllOrganizerAccountsAsJSON = async dataAccess => {
  const registeredAccountsBuffer = await dataAccess.getChainState(
    CHAIN_STATE_ORGANIZER_ACCOUNT
  );

  if (!registeredAccountsBuffer) {
    return [];
  }

  const registeredAccounts = codec.decode(
    registeredOrganizerAccountSchema,
    registeredAccountsBuffer
  );

  const accountJSON = codec.toJSON(registeredOrganizerAccountSchema, registeredAccounts);

  return accountJSON.registeredOrganizerAccounts;
}

const setAllOrganizerAccounts = async (stateStore, organizerAccounts) => {
  const registeredAccounts = {
    registeredOrganizerAccounts: organizerAccounts.sort((a, b) => a.id.compare(b.id))
  };

  await stateStore.chain.set(
    CHAIN_STATE_ORGANIZER_ACCOUNT,
    codec.encode(registeredOrganizerAccountSchema, registeredAccounts)
  );
}

export {
  CHAIN_STATE_ORGANIZER_ACCOUNT,
  setAllOrganizerAccounts,
  getAllOrganizerAccounts,
  getOrganizationById,
  getAllOrganizerAccountsAsJSON,
  createOrganizerAccount,
  getOrganization,
  registeredOrganizerAccountSchema,
}
