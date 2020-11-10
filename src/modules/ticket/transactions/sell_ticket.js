import { BaseAsset } from 'lisk-sdk';
import { setAllTickets } from "../ticket_assets";
import { createMarketTicket, getAllMarketTickets, setAllMarketTickets } from "../marketplace_assets";

export class SellTicket extends BaseAsset {
  name = "sellTicket";
  id = 3;
  schema = {
    $id: "lisk/tickets/sell",
    type: "object",
    required: ["ticketId", "price"],
    properties: {
      ticketId: {
        dataType: "bytes",
        fieldNumber: 1,
      },
      price: {
        dataType: "uint64",
        fieldNumber: 2,
      },
    }
  };

  apply = async ({asset, stateStore, reducerHandler, transaction}) => {
    const senderAddress = transaction.senderAddress;
    const senderAccount = await stateStore.account.getOrDefault(senderAddress);
    const allTickets = await getAllTickets(stateStore);

    const ticketStoreIndex = allTickets.findIndex(t => t.id.equals(asset.ticketId));
    if (ticketStoreIndex === -1) {
      throw new Error("Ticket not found");
    }

    const ticket = allTickets[ticketStoreIndex];
    if (ticket && !ticket.ownerAddress.equals(senderAddress)) {
      throw new Error("Only owner can sell ticket");
    }

    const ticketIndex = senderAccount.ticket.tickets.findIndex(t => t.equals(asset.ticketId));
    if (ticketIndex === -1) {
      throw new Error("Ticket not found in sender account");
    }

    const event = await reducerHandler.invoke("event:getEvent", {
      id: asset.eventId,
    });
    if (!event) {
      throw new Error("Event is not found");
    }

    if (!event.resellData.allowed) {
      throw new Error("This event doesn't allow reselling tickets");
    }
    const ticketPrice = await reducerHandler.invoke("event:ticketPrice", {
      eventId: ticket.eventId,
      typeId: ticket.typeId,
    });

    if ((event.resellData.maximumResellPercentage / 100) * ticketPrice < asset.price) {
      throw new Error('Resell price is to high');
    }

    ticket.status = 2;
    allTickets[ticketStoreIndex] = ticket;
    await setAllTickets(stateStore, allTickets);

    const allMarketTickets = await getAllMarketTickets(stateStore);
    const marketTicket = await createMarketTicket({
      ticketId: asset.ticketId,
      price: asset.price,
    });
    allMarketTickets.push(marketTicket);
    await setAllMarketTickets(stateStore, allMarketTickets);
  }
}
