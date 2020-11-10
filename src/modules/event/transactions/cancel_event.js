import { BaseAsset } from 'lisk-sdk';
import { setAllTickets } from "../../ticket/ticket_assets";

export class CancelEvent extends BaseAsset {
  name = "cancelEvent";
  id = 1;
  schema = {
    $id: "lisk/event/cancel",
    type: "object",
    required: ["event"],
    properties: {
      id: {
        dataType: "string",
        fieldNumber: 1,
      }
    }
  };

  apply = async ({asset, stateStore, reducerHandler, transaction}) => {
    const senderAddress = transaction.senderAddress;
    const event = reducerHandler.invoke("event:getEvent", {
      id: asset.id,
    });
    if (!event) {
      throw new Error('Event not found');
    }
    if (event.ownerAddress !== senderAddress) {
      throw new Error('Only owner can cancel event');
    }
    const allTickets = await getAllTickets(stateStore);
    const allEventTickets = allTickets.filter(t => t.eventId === asset.id);
    const totalDebt = allEventTickets.reduce((sum, t) =>
      sum + event.ticketData.find(tt => tt.id.equals(t.typeId)).price,
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
  }
}
