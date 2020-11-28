import { BaseModule } from 'lisk-sdk';
import { availableTickets, cancelEvent, getAllEventsAsJSON, getEvent, getEvents, soldTicket, ticketPrice } from './event_assets';
import { CreateEvent, CancelEvent } from "./transactions";

export class EventModule extends BaseModule {
  name = "event";
  id = 1100;
  transactionAssets = [ new CreateEvent(), new CancelEvent(), ];

  accountSchema = {
    type: "object",
    required: ["events"],
    properties: {
      events: {
        type: "array",
        fieldNumber: 1,
        items: {
          dataType: "bytes",
        }
      },
    },
    default: {
      events: [],
    }
  };

  actions = {
    getAllEvents: async () => getAllEventsAsJSON(this._dataAccess),
  };

  reducers = {
    getEvent: async (params, stateStore) => getEvent({params, stateStore}),
    getEvents: async (params, stateStore) => getEvents({params, stateStore}),
    cancelEvent: async (params, stateStore) => cancelEvent({params, stateStore}),
    soldTicket: async (params, stateStore) => soldTicket({params, stateStore}),
    availableTickets: async (params, stateStore) => availableTickets({params, stateStore}),
    ticketPrice: async (params, stateStore) => ticketPrice({params, stateStore}),
  }
}
