import { codec, cryptography } from 'lisk-sdk';

const eventSchema = {
  $id: "lisk/events/event",
  type: "object",
  required: ["events"],
  properties: {
    events: {
      type: "array",
      fieldNumber: 1,
      items: {
        type: "object",
        required: ["id", "organizationId", "eventData", "ticketData", "resellData"],
        properties: {
          id: {
            dataType: "bytes",
            fieldNumber: 1,
          },
          organizationId: {
            dataType: "bytes",
            fieldNumber: 2,
          },
          eventData: {
            type: "object",
            fieldNumber: 3,
            required: ["title", "status", "location", "date", "duration"],
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
              status: {
                dataType: "uint32",
                fieldNumber: 8,
              },
            },
          },
          ticketData: {
            type: "array",
            minItems: 1,
            maxItems: 20,
            fieldNumber: 4,
            items: {
              type: "object",
              required: ["startSellTimestamp", "id", "name", "price", "amount", "sold"],
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
            fieldNumber: 5,
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
        },
      },
    },
  },
};

const CHAIN_STATE_EVENTS = "events:registeredEvents";

const createEvent = ({nonce, organizationId, assets}) => {
  const nonceBuffer = Buffer.alloc(8);
  nonceBuffer.writeBigInt64LE(nonce);
  const seed = Buffer.concat([organizationId, nonceBuffer]);
  const id = cryptography.hash(seed);

  return {
    id,
    organizationId,
    ...assets,
  };
};

const getAllEvents = async stateStore => {
  const registeredEventsBuffer = await stateStore.chain.get(
    CHAIN_STATE_EVENTS
  );

  if (!registeredEventsBuffer) {
    return [];
  }

  const registeredEvents = codec.decode(
    eventSchema,
    registeredEventsBuffer
  );

  return registeredEvents.events;
}

const getEvent = async ({params, stateStore}) => {
  const { id } = params;
  const events = await getAllEvents(stateStore);
  return events.find(e => e.id.toString('hex') === id);
}

const getEvents = async ({stateStore}) => {
  return await getAllEvents(stateStore);
}

const cancelEvent = async ({params, stateStore}) => {
  // todo refund all tickets
}

const ticketPrice = async ({params, stateStore}) => {
  const { eventId, typeId } = params;
  const registeredEventsBuffer = await stateStore.chain.get(
    CHAIN_STATE_EVENTS
  );

  if (!registeredEventsBuffer) {
    throw new Error('No events found');
  }

  const registeredEvents = codec.decode(
    eventSchema,
    registeredEventsBuffer
  );

  const eventIndex = registeredEvents.events.findIndex(e => e.id.toString('hex') === eventId);
  if (eventIndex === -1) {
    throw new Error('Event not found');
  }
  const typeIndex = registeredEvents.events[eventIndex].ticketData.findIndex(t => t.id === typeId);
  if (typeIndex === -1) {
    throw new Error('Ticket type not found');
  }

  return registeredEvents.events[eventIndex].ticketData[typeIndex].price;
}

const availableTickets = async ({params, stateStore}) => {
  const { eventId, typeId } = params;
  const registeredEventsBuffer = await stateStore.chain.get(
    CHAIN_STATE_EVENTS
  );

  if (!registeredEventsBuffer) {
    throw new Error('No events found');
  }

  const registeredEvents = codec.decode(
    eventSchema,
    registeredEventsBuffer
  );
  console.log(registeredEvents, eventId, new Buffer(eventId))
  const eventIndex = registeredEvents.events.findIndex(e => e.id.toString('hex') === eventId);
  if (eventIndex === -1) {
    throw new Error('Event not found');
  }
  const typeIndex = registeredEvents.events[eventIndex].ticketData.findIndex(t => t.id === typeId);
  if (typeIndex === -1) {
    throw new Error('Ticket type not found');
  }

  return registeredEvents.events[eventIndex].ticketData[typeIndex].amount - registeredEvents.events[eventIndex].ticketData[typeIndex].sold;
}

const soldTicket = async ({params, stateStore}) => {
  const { eventId, typeId } = params;
  const registeredEventsBuffer = await stateStore.chain.get(
    CHAIN_STATE_EVENTS
  );

  if (!registeredEventsBuffer) {
    throw new Error('No events found');
  }

  const registeredEvents = codec.decode(
    eventSchema,
    registeredEventsBuffer
  );

  const eventIndex = registeredEvents.events.findIndex(e =>e.id.toString('hex') === eventId);
  if (eventIndex === -1) {
    throw new Error('Event not found');
  }
  const typeIndex = registeredEvents.events[eventIndex].ticketData.findIndex(t => t.id === typeId);
  if (typeIndex === -1) {
    throw new Error('Ticket type not found');
  }

  registeredEvents.events[eventIndex].ticketData[typeIndex].sold++;
  await setAllEvents(stateStore, registeredEvents.events);
}

const getAllEventsAsJSON = async dataAccess => {
  const registeredEventsBuffer = await dataAccess.getChainState(
    CHAIN_STATE_EVENTS
  );

  if (!registeredEventsBuffer) {
    return [];
  }

  const registeredEvents = codec.decode(
    eventSchema,
    registeredEventsBuffer
  );

  const eventJSON = codec.toJSON(eventSchema, registeredEvents);

  return eventJSON.events;
}

const setAllEvents = async (stateStore, events) => {
  console.log(events)
  const registeredEvents = {
    events: events.sort((a, b) => a.id.compare(b.id))
  };
  console.log(registeredEvents)

  await stateStore.chain.set(
    CHAIN_STATE_EVENTS,
    codec.encode(eventSchema, registeredEvents)
  );
}

export {
  CHAIN_STATE_EVENTS,
  setAllEvents,
  getAllEvents,
  getAllEventsAsJSON,
  createEvent,
  getEvent,
  getEvents,
  cancelEvent,
  soldTicket,
  availableTickets,
  ticketPrice,
  eventSchema,
}
