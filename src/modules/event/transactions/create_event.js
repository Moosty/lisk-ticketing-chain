import { BaseAsset } from 'lisk-sdk';
import {
  getAllEvents,
  createEvent,
  setAllEvents,
} from '../event_assets';

export class CreateEvent extends BaseAsset {
  name = "createEvent";
  id = 0;
  schema = {
    $id: "lisk/event/create",
    type: "object",
    required: ["eventData", "ticketData", "resellData"],
    properties: {
      eventData: {
        type: "object",
        fieldNumber: 1,
        required: ["title", "location", "date", "duration"],
        properties: {
          title: {
            dataType: "string",
            fieldNumber: 1,
            minLength: 10,
            maxLength: 100,
          },
          location: {
            dataType: "string",
            fieldNumber: 2,
            minLength: 3,
            maxLength: 50,
          },
          date: {
            dataType: "uint64",
            fieldNumber: 3,
          },
          duration: {
            dataType: "uint32",
            fieldNumber: 4
          },
          site: {
            dataType: "string",
            fieldNumber: 5,
            minLength: 0,
            maxLength: 200,
          },
          image: {
            dataType: "string",
            fieldNumber: 6,
            minLength: 0,
            maxLength: 255,
          },
          category: {
            dataType: "uint32",
            fieldNumber: 7,
          },
        },
      },
      ticketData: {
        type: "array",
        minItems: 1,
        maxItems: 20,
        fieldNumber: 2,
        items: {
          type: "object",
          required: ["startSellTimestamp", "id", "name", "price", "amount"],
          properties: {
            startSellTimestamp: {
              fieldNumber: 1,
              dataType: "uint64",
            },
            id: {
              fieldNumber: 2,
              dataType: "uint32",
            },
            name: {
              fieldNumber: 3,
              dataType: "string",
              minLength: 5,
              maxLength: 50,
            },
            price: {
              fieldNumber: 4,
              dataType: "uint64",
            },
            amount: {
              fieldNumber: 5,
              dataType: "uint32",
            },
            sold: {
              fieldNumber: 6,
              dataType: "uint32",
              default: 0,
            },
          },
        },
      },
      resellData: {
        type: "object",
        fieldNumber: 3,
        required: ["allowed", "maximumResellPercentage", "resellOrganiserFee"],
        properties: {
          allowed: {
            fieldNumber: 1,
            dataType: "boolean"
          },
          maximumResellPercentage: {
            fieldNumber: 2,
            dataType: "uint32",
          },
          resellOrganiserFee: {
            fieldNumber: 3,
            dataType: "uint32",
          },
        },
      },
    }
  };

  apply = async ({ asset, stateStore, reducerHandler, transaction }) => {
    const senderAddress = transaction.senderAddress;
    const senderAccount = await stateStore.account.getOrDefault(senderAddress);

    // Lookup organization
    const organization = await reducerHandler.invoke("organizer:getOrganization", { address: senderAddress });
    if (!organization) {
      throw new Error('Sender is no organizer');
    }

    // Create event
    const event = createEvent({
      nonce: transaction.nonce,
      organizationId: organization,
      assets: {
        ...asset,
        eventData: {
          ...asset.eventData,
          status: 0,
        },
      },
    });

    // Add event to senderAccount
    senderAccount.event.events.push(event.id);
    await stateStore.account.set(senderAddress, senderAccount);

    // Update all events store
    const allEvents = await getAllEvents(stateStore);
    allEvents.push(event);
    await setAllEvents(stateStore, allEvents);
  }
}
