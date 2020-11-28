import { BaseModule } from 'lisk-sdk';
import { getAllOrganizerAccountsAsJSON, getOrganization, getOrganizationById } from './organizer_account';
import { CreateOrganizer } from "./transactions";

export class OrganizerModule extends BaseModule {
  name = "organizer";
  id = 1000;
  transactionAssets = [ new CreateOrganizer(), ];

  accountSchema = {
    type: "object",
    required: [],
    properties: {
      organization: {
        dataType: "bytes",
        fieldNumber: 1,
      },
    },
    default: {}
  };

  actions = {
    getAllOrganizerAccounts: async () => getAllOrganizerAccountsAsJSON(this._dataAccess),
  };

  reducers = {
    getOrganization: async (params, stateStore) => getOrganization({params, stateStore}),
    getOrganizationById: async (params, stateStore) => getOrganizationById({params, stateStore}),
  }

  beforeTransactionApply = async ({ transaction, stateStore, reducerHandler}) => {
    if (transaction.moduleID === 1000) {
      const sender = await stateStore.account.getOrDefault(transaction.senderAddress);
      await stateStore.account.set(transaction.senderAddress, sender);
      // todo: check if account was empty
      await reducerHandler.invoke("token:credit", {
        address: transaction.senderAddress,
        amount: BigInt(6000000),
      });
    }
  }
}
