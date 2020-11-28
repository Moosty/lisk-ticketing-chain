import { BaseAsset } from 'lisk-sdk';
import { getAllTickets, setAllTickets } from "../../ticket/ticket_assets";
import { setAllEvents } from "../event_assets";

export class CancelEvent extends BaseAsset {
  name = "cancelEvent";
  id = 1;
  schema = {
    $id: "lisk/event/cancel",
    type: "object",
    required: ["id"],
    properties: {
      id: {
        dataType: "string",
        fieldNumber: 1,
      }
    }
  };
  // todo: check valid current status
  apply = async ({asset, stateStore, reducerHandler, transaction}) => {
    const senderAddress = transaction.senderAddress;
    const event = await reducerHandler.invoke("event:getEvent", {
      id: asset.id,
    });
    if (!event) {
      throw new Error('Event not found');
    }

    const organization = await reducerHandler.invoke("organizer:getOrganization", {
      address: senderAddress,
    })

    if (event.organizationId.toString('hex') !== organization.toString('hex')) {
      throw new Error('Only owner can cancel event');
    }

    const allTickets = await getAllTickets(stateStore);
    const allEventTickets = allTickets.filter(t => t.eventId === asset.id);
    const totalDebt = allEventTickets.reduce((sum, t) =>
      sum + event.ticketData.find(tt => tt.id === t.typeId).price,
      BigInt(0)
    );
    const senderBalance = await reducerHandler.invoke("token:getBalance", {
      address: senderAddress,
    });
    const minRemainingBalance = await reducerHandler.invoke(
      "token:getMinRemainingBalance"
    );

    if (senderBalance < totalDebt + minRemainingBalance) {
      throw new Error("Sender balance is not enough to refund all tickets");
    }
    await reducerHandler.invoke("token:debit", {
      address: senderAddress,
      amount: totalDebt,
    });

    let index = 0;
    for (let i = 0; i < allEventTickets.length; i++) {
      await reducerHandler.invoke("token:credit", {
        address: allEventTickets[i].ownerAddress,
        amount: allEventTickets[i].value,
      });
      index = allTickets.findIndex(t => t.id.equals(allEventTickets[i].id));
      allTickets[index].status = 3;
    }
    await setAllTickets(stateStore, allTickets);

    const allEvents = await reducerHandler.invoke("event:getEvents");
    const eventIndex = allEvents.findIndex(e => e.id.toString('hex') === asset.id);
    allEvents[eventIndex].eventData.status = 4;
    await setAllEvents(stateStore, allEvents);
  }
}
