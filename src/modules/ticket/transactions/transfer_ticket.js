import { BaseAsset } from 'lisk-sdk';
import { getAllTickets, setAllTickets } from "../ticket_assets";

export class TransferTicket extends BaseAsset {
  name = "transferTicket";
  id = 1;
  schema = {
    $id: "lisk/tickets/transfer",
    type: "object",
    required: ["ticketId", "recipientAddress"],
    properties: {
      ticketId: {
        dataType: "bytes",
        fieldNumber: 1,
      },
      recipientAddress: {
        dataType: "bytes",
        fieldNumber: 2,
      },
    }
  };

  apply = async ({asset, stateStore, transaction}) => {
    const senderAddress = transaction.senderAddress;
    const senderAccount = await stateStore.account.get(senderAddress);
    const recipientAccount = await stateStore.account.get(asset.recipientAddress);

    const allTickets = await getAllTickets(stateStore);

    const ticketStoreIndex = allTickets.findIndex(t => t.id.equals(asset.ticketId));
    if (ticketStoreIndex === -1) {
      throw new Error("Ticket not found");
    }

    const ticket = allTickets[ticketStoreIndex];
    if (ticket && !ticket.ownerAddress.equals(senderAddress)) {
      throw new Error("Only owner of ticket can transfer ticket");
    }

    const ticketIndex = senderAccount.ticket.tickets.findIndex(t => t.equals(asset.ticketId));
    if (ticketIndex === -1) {
      throw new Error("Ticket not found in sender account");
    }
    senderAccount.ticket.tickets.splice(ticketIndex, 1);
    await stateStore.account.set(senderAddress, senderAccount);

    recipientAccount.ticket.tickets.push(asset.ticketId);
    await stateStore.account.set(asset.recipientAddress, recipientAccount);

    // Update all tickets store
    ticket.ownerAddress = asset.recipientAddress;
    allTickets[ticketStoreIndex] = ticket;
    await setAllTickets(stateStore, allTickets);
  }
}
