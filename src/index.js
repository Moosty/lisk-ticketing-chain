import { ExtendedAPIPlugin, TicketAPIPlugin } from "./plugins";
import { Application, configDevnet, genesisBlockDevnet, HTTPAPIPlugin, utils, } from 'lisk-sdk';
import { EventModule, OrganizerModule, TicketModule, SprinklerModule } from "./modules";
import { DPoSModule, KeysModule, SequenceModule, TokenModule } from "lisk-framework";

genesisBlockDevnet.header.asset.accounts = genesisBlockDevnet.header.asset.accounts.map(a => utils.objects.mergeDeep({}, a, {
    organizer: {},
    sprinkler: {
      username: ""
    },
    event: {
      events: [],
    },
    ticket: {
      tickets: [],
    }
  }
));
const customConfig = {
  label: 'lisk-ticketing',
  genesisConfig: {
    communityIdentifier: 'TICKETING',
  },
  logger: {
    consoleLogLevel: 'debug',
  },
  rpc: {
    enable: true,
    port: 5004,
    mode: 'ws',
  },
  network: {
    port: 5005,
  },
  plugins: {
    httpApi: {
      whiteList: ["127.0.0.1"],
      port: 5006,
    },
    ExtendedHTTPAPI: {
      port: 5007,
    }
  }
};

const appConfig = utils.objects.mergeDeep({}, configDevnet, customConfig);

const app = new Application(genesisBlockDevnet, appConfig);

app._registerModule(OrganizerModule, false);
app._registerModule(SprinklerModule, false);
app._registerModule(TokenModule, false);
app._registerModule(SequenceModule, false);
app._registerModule(KeysModule, false);
app._registerModule(DPoSModule, false);
app._registerModule(EventModule, false);
app._registerModule(TicketModule, false);

app.registerPlugin(HTTPAPIPlugin);
app.registerPlugin(TicketAPIPlugin);
app.registerPlugin(ExtendedAPIPlugin);

app.run().then(() => console.info('Ticketing Chain started..')).catch(console.error);

export {
  customConfig as AppConfig
}
