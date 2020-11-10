import { BaseAsset } from 'lisk-sdk';
import { createTicket, getAllTickets, setAllTickets } from "../ticket_assets";

export class BuyTicket extends BaseAsset {
  name = "buyTicket";
  id = 0;
  schema = {
    $id: "lisk/tickets/buy",
    type: "object",
    required: ["eventId", "typeId", "value"],
    properties: {
      eventId: {
        dataType: "bytes",
        fieldNumber: 1,
      },
      typeId: {
        dataType: "uint32",
        fieldNumber: 2,
      },
      value: {
        dataType: "uint64",
        fieldNumber: 3,
      }
    }
  };


  apply = async ({asset, stateStore, reducerHandler, transaction}) => {
    const senderAddress = transaction.senderAddress;
    const senderAccount = await stateStore.account.getOrDefault(senderAddress);

    const event = await reducerHandler.invoke("event:getEvent", {
      id: asset.eventId,
    });

    if (!event) {
      throw new Error("Event not found");
    }

    const ticketAvailability = await reducerHandler.invoke("event:availableTickets", {
      eventId: asset.eventId,
      typeId: asset.typeId,
    });

    if (ticketAvailability < 1) {
      throw new Error("Ticket not available");
    }

    const ticketPrice = await reducerHandler.invoke("event:ticketPrice", {
      eventId: asset.eventId,
      typeId: asset.typeId,
    });

    if (ticketPrice !== asset.value) {
      throw new Error("Wrong ticket price");
    }

    const senderBalance = await reducerHandler.invoke("token:getBalance", {
      address: senderAddress,
    });
    const minRemainingBalance = await reducerHandler.invoke(
      "token:getMinRemainingBalance"
    );

    if (senderBalance < asset.value + minRemainingBalance) {
      throw new Error("Sender balance is not enough to buy this ticket");
    }

    // Create ticket
    const ticket = createTicket({
      ownerAddress: senderAddress,
      nonce: transaction.nonce,
      eventId: asset.eventId,
      typeId: asset.typeId,
      value: asset.value,
    });

    // Add ticket to senderAccount
    senderAccount.ticket.tickets.push(ticket.id);

    await stateStore.account.set(senderAddress, senderAccount);

    await reducerHandler.invoke("token:debit", {
      address: senderAddress,
      amount: asset.value,
    });

    await reducerHandler.invoke("token:credit", {
      address: event.ownerAddress,
      amount: asset.value,
    })

    // Update all tickets store
    const allTickets = await getAllTickets(stateStore);
    allTickets.push(ticket);
    await setAllTickets(stateStore, allTickets);

    // Update event store
    await reducerHandler.invoke("event:soldTicket", {
      eventId: asset.eventId,
      typeId: asset.typeId,
    });
  }
}
