import { BaseModule } from 'lisk-sdk';
import { BuyMarketTicket, BuyTicket, ScanTicket, SellTicket, TransferTicket } from "./transactions";
import { getAllTicketsAsJSON, getTicket, refundTicket, transferTicket, updateTicket } from './ticket_assets';
import { getAllMarketTicketsAsJSON } from "./marketplace_assets";

export class TicketModule extends BaseModule {
  name = "ticket";
  id = 1200;
  transactionAssets = [ new BuyMarketTicket(), new BuyTicket(), new ScanTicket(), new SellTicket(), new TransferTicket(), ];

  accountSchema = {
    type: "object",
    required: ["tickets"],
    properties: {
      myTickets: {
        dataType: "array",
        fieldNumber: 1,
        items: {
          dataType: "bytes",
        },
      },
    },
    default: {
      tickets: []
    }
  };

  actions = {
    getAllTickets: async () => getAllTicketsAsJSON(this._dataAccess),
    getAllMarketTickets: async () => getAllMarketTicketsAsJSON(this._dataAccess),
  };

  reducers = {
    getTicket: async (params, stateStore) => getTicket({params, stateStore}),
    refundTicket: async (params, stateStore) => refundTicket({params, stateStore}),
    transferTicket: async (params, stateStore) => transferTicket({params, stateStore}),
    updateTicket: async (params, stateStore) => updateTicket({params, stateStore}),
  }

}
