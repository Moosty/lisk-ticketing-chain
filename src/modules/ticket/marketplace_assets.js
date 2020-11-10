import { codec, cryptography } from 'lisk-sdk';

const marketSchema = {
  $id: "lisk/marketplace/tickets",
  type: "object",
  required: ["tickets"],
  properties: {
    tickets: {
      type: "array",
      fieldNumber: 1,
      items: {
        type: "object",
        required: ["id", "ticketId", "price"],
        properties: {
          id: {
            dataType: "bytes",
            fieldNumber: 1,
          },
          ticketId: {
            dataType: "bytes",
            fieldNumber: 2,
          },
          price: {
            dataType: "uint64",
            fieldNumber: 3,
          },
        },
      },
    },
  },
};

const CHAIN_STATE_MARKETPLACE = "marketplace:tickets";

const createMarketTicket = ({ticketId, price}) => {
  const seed = Buffer.concat([ticketId]);
  const id = cryptography.hash(seed);

  return {
    id,
    ticketId,
    price,
  };
};

const getAllMarketTickets = async stateStore => {
  const marketplaceTicketsBuffer = await stateStore.chain.get(
    CHAIN_STATE_MARKETPLACE
  );

  if (!marketplaceTicketsBuffer) {
    return [];
  }

  const marketTickets = codec.decode(
    marketSchema,
    marketplaceTicketsBuffer
  );

  return marketTickets.tickets;
}

const getMarketTicket = async ({params, stateStore}) => {
  const { id } = params;
  const tickets = await getAllTickets(stateStore);
  return tickets.find(t => t.id === id);
}

const getAllMarketTicketsAsJSON = async dataAccess => {
  const marketplaceTicketsBuffer = await dataAccess.getChainState(
    CHAIN_STATE_MARKETPLACE
  );

  if (!marketplaceTicketsBuffer) {
    return [];
  }

  const marketTickets = codec.decode(
    marketSchema,
    marketplaceTicketsBuffer
  );

  const ticketsJSON = codec.toJSON(marketSchema, marketTickets);

  return ticketsJSON.tickets;
}

const setAllMarketTickets = async (stateStore, tickets) => {
  const marketTickets = {
    tickets: tickets.sort((a, b) => a.id.compare(b.id))
  };

  await stateStore.chain.set(
    CHAIN_STATE_MARKETPLACE,
    codec.encode(marketSchema, marketTickets)
  );
}

export {
  CHAIN_STATE_MARKETPLACE,
  setAllMarketTickets,
  createMarketTicket,
  getAllMarketTickets,
  getAllMarketTicketsAsJSON,
  getMarketTicket,
  marketSchema,
}
