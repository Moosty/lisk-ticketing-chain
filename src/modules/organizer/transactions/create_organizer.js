import { BaseAsset } from 'lisk-sdk';
import {
  getAllOrganizerAccounts,
  createOrganizerAccount,
  setAllOrganizerAccounts,
} from '../organizer_account';

export class CreateOrganizer extends BaseAsset {
  name = "createOrganizer";
  id = 0;
  schema = {
    $id: "lisk/organizer/create",
    type: "object",
    required: ["organization"],
    properties: {
      organization: {
        dataType: "string",
        fieldNumber: 1,
        minLength: 1,
        maxLength: 50,
      }
    }
  };

  apply = async ({ asset, stateStore, reducerHandler, transaction }) => {
    const senderAddress = transaction.senderAddress;
    const senderAccount = await stateStore.account.getOrDefault(senderAddress);

    const organizerAccount = createOrganizerAccount({
      ownerAddress: senderAddress,
      nonce: transaction.nonce,
      organization: asset.organization,
    });

    senderAccount.organizer.organization = organizerAccount.id;
    await stateStore.account.set(senderAddress, senderAccount);
    await reducerHandler.invoke("token:credit", {
      address: senderAddress,
      amount: BigInt('10000000000000'),
    });

    const allOrganizers = await getAllOrganizerAccounts(stateStore);
    allOrganizers.push(organizerAccount);
    await setAllOrganizerAccounts(stateStore, allOrganizers);
  }
}
