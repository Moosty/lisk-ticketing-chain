import { BaseAsset } from 'lisk-sdk';
import { getAllTickets, setAllTickets } from "../ticket_assets";

export class ScanTicket extends BaseAsset {
  name = "scanTicket";
  id = 2;
  schema = {
    $id: "lisk/tickets/scan",
    type: "object",
    required: ["ticketId", "ownerId"],
    properties: {
      ticketId: {
        dataType: "bytes",
        fieldNumber: 1,
      },
      ownerId: {
        dataType: "bytes",
        fieldNumber: 2,
      },
    }
  };

  apply = async ({asset, stateStore}) => {
    // todo check if event owner is scanner!

    const allTickets = await getAllTickets(stateStore);
    const ticketStoreIndex = allTickets.findIndex(t => t.id.equals(asset.ticketId));
    if (ticketStoreIndex === -1) {
      throw new Error("Ticket not found");
    }

    const ticket = allTickets[ticketStoreIndex];
    if (ticket && !ticket.ownerAddress.equals(asset.ownerId)) {
      throw new Error("Ticket owner incorrect");
    }

    // Update all tickets store
    ticket.status = 1;
    allTickets[ticketStoreIndex] = ticket;
    await setAllTickets(stateStore, allTickets);
  }
}
