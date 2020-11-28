import { codec, cryptography } from 'lisk-sdk';

const ticketSchema = {
  $id: "lisk/ticket/tickets",
  type: "object",
  required: ["tickets"],
  properties: {
    tickets: {
      type: "array",
      fieldNumber: 1,
      items: {
        type: "object",
        required: ["id", "ownerAddress", "eventId", "typeId", "value", "status"],
        properties: {
          id: {
            dataType: "bytes",
            fieldNumber: 1,
          },
          ownerAddress: {
            dataType: "bytes",
            fieldNumber: 2,
          },
          eventId: {
            dataType: "string",
            fieldNumber: 3,
          },
          typeId: {
            dataType: "uint32",
            fieldNumber: 4,
          },
          value: {
            dataType: "uint64",
            fieldNumber: 5,
          },
          status: {
            dataType: "uint32",
            fieldNumber: 6,
          }
        },
      },
    },
  },
};

/**
 * Ticket status
 * 0: active
 * 1: scanned
 * 2: on market place
 * 3: refunded
 */

const CHAIN_STATE_TICKETS = "tickets:boughtTickets";

const createTicket = ({ownerAddress, nonce, eventId, typeId, value}) => {
  const nonceBuffer = Buffer.alloc(8);
  nonceBuffer.writeBigInt64LE(nonce);
  const seed = Buffer.concat([ownerAddress, new Buffer(eventId), new Buffer(typeId), nonceBuffer]);
  const id = cryptography.hash(seed);

  return {
    id,
    ownerAddress,
    eventId,
    typeId,
    value,
    status: 0,
  };
};

const transferTicket = async ({params, stateStore}) => {
  // todo update ticket owner
}

const updateTicket = async ({params, stateStore}) => {
  // todo update ticket status
}

const refundTicket = async ({params, stateStore}) => {
  // todo refund???
}

const getAllTickets = async stateStore => {
  const boughtTicketsBuffer = await stateStore.chain.get(
    CHAIN_STATE_TICKETS
  );

  if (!boughtTicketsBuffer) {
    return [];
  }

  const boughtTickets = codec.decode(
    ticketSchema,
    boughtTicketsBuffer
  );

  return boughtTickets.tickets;
}

const getTicket = async ({params, stateStore}) => {
  const { id } = params;
  const tickets = await getAllTickets(stateStore);
  return tickets.find(t => t.id === id);
}

const getAllTicketsAsJSON = async dataAccess => {
  const boughtTicketsBuffer = await dataAccess.getChainState(
    CHAIN_STATE_TICKETS
  );

  if (!boughtTicketsBuffer) {
    return [];
  }

  const boughtTickets = codec.decode(
    ticketSchema,
    boughtTicketsBuffer
  );

  const ticketsJSON = codec.toJSON(ticketSchema, boughtTickets);

  return ticketsJSON.tickets;
}

const setAllTickets = async (stateStore, tickets) => {
  const boughtTickets = {
    tickets: tickets.sort((a, b) => a.id.compare(b.id))
  };

  await stateStore.chain.set(
    CHAIN_STATE_TICKETS,
    codec.encode(ticketSchema, boughtTickets)
  );
}

export {
  CHAIN_STATE_TICKETS,
  setAllTickets,
  getAllTickets,
  getAllTicketsAsJSON,
  getTicket,
  createTicket,
  transferTicket,
  updateTicket,
  refundTicket,
  ticketSchema,
}
