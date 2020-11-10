import { TicketAPIPlugin } from "./plugins";
import { Application, configDevnet, genesisBlockDevnet, HTTPAPIPlugin, utils, } from 'lisk-sdk';
import { OrganizerModule } from "./modules";
import { SprinklerModule } from "@moosty/lisk-sprinkler";
import { DPoSModule, KeysModule, SequenceModule, TokenModule } from "lisk-framework";

genesisBlockDevnet.header.asset.accounts = genesisBlockDevnet.header.asset.accounts.map(a => utils.objects.mergeDeep({}, a, {
    organizer: {},
    sprinkler: { username: ""},
  }
));

const appConfig = utils.objects.mergeDeep({}, configDevnet, {
  label: 'lisk-ticketing',
  ipc: {
    enabled: false,
  },
  genesisConfig: {
    communityIdentifier: 'TICKETING',
    logger: {
      consoleLogLevel: 'debug',
    }
  },
  rootPath: './store/',
});

const app = new Application(genesisBlockDevnet, appConfig);

app._registerModule(OrganizerModule, false);
app._registerModule(SprinklerModule, false);
app._registerModule(TokenModule, false);
app._registerModule(SequenceModule, false);
app._registerModule(KeysModule, false);
app._registerModule(DPoSModule, false);

app.registerPlugin(HTTPAPIPlugin);
app.registerPlugin(TicketAPIPlugin);

app.run().then(() => console.info('Ticketing Chain started..')).catch(console.error);
