import { BaseAsset } from 'lisk-sdk';
import { getAllMarketTickets, setAllMarketTickets } from "../marketplace_assets";
import { getAllTickets, setAllTickets } from "../ticket_assets";

export class BuyMarketTicket extends BaseAsset {
  name = "buyMarketTicket";
  id = 4;
  schema = {
    $id: "lisk/tickets/buymarket",
    type: "object",
    required: ["marketId"],
    properties: {
      marketId: {
        dataType: "bytes",
        fieldNumber: 1,
      },
    }
  };

  apply = async ({asset, stateStore}) => {
    const senderAddress = transaction.senderAddress;
    const senderAccount = await stateStore.account.getOrDefault(senderAddress);
    const allMarketTickets = await getAllMarketTickets(stateStore);
    const marketTicketIndex = allMarketTickets.findIndex(mt => mt.id.equals(asset.marketId));
    if (marketTicketIndex === -1) {
      throw new Error("Market ticket not found");
    }
    const marketTicket = allMarketTickets[marketTicketIndex];

    const allTickets = await getAllTickets(stateStore);
    const ticketIndex = allTickets.findIndex(t => t.id.equals(marketTicket.ticketId));
    if (ticketIndex === -1) {
      throw new Error("Ticket not found");
    }
    const ticket = allTickets[ticketIndex];
    if (ticket.status !== 2) {
      throw new Error("Ticket is not for sale");
    }

    const senderBalance = await reducerHandler.invoke("token:getBalance", {
      address: senderAddress,
    });
    const minRemainingBalance = await reducerHandler.invoke(
      "token:getMinRemainingBalance"
    );

    if (senderBalance < marketTicket.price + minRemainingBalance) {
      throw new Error("Sender balance is not enough to buy this ticket");
    }
    const event = await reducerHandler.invoke("event:getEvent", {
      id: ticket.eventId,
    });
    const ownerAccount = await stateStore.account.get(ticket.ownerAddress);
    await reducerHandler.invoke("token:debit", {
      address: senderAddress,
      amount: marketTicket.price,
    });
    const resellFee = (resellOrganiserFee / 100) * marketTicket.price;
    await reducerHandler.invoke("token:credit", {
      address: ownerAccount.address,
      amount: marketTicket.price - resellFee,
    });
    await reducerHandler.invoke("token:credit", {
      address: event.ownerAddress,
      amount: resellFee,
    });

    ownerAccount.ticket.tickets.splice(ticketIndex, 1);
    await stateStore.account.set(ticket.ownerAddress, ownerAccount);

    senderAccount.ticket.tickets.push(asset.ticketId);
    await stateStore.account.set(senderAddress, senderAccount);

    ticket.ownerAddress = senderAddress;
    ticket.status = 0;
    ticket.value = marketTicket.price - resellFee;
    allTickets[ticketStoreIndex] = ticket;
    await setAllTickets(stateStore, allTickets);

    allMarketTickets.splice(marketTicketIndex, 1);
    await setAllMarketTickets(stateStore, allMarketTickets);
  }
}
