import express from 'express';
import cors from 'cors';
import { BasePlugin, codec } from "lisk-sdk";
import { getAllTransactions, getDBInstance, saveTransactions } from "./db";
import { AppConfig } from "../../index";

export class ExtendedAPIPlugin extends BasePlugin {
  _server;
  _app;
  _channel;
  _db;
  _nodeInfo;

  static get alias() {
    return "ExtendedHTTPAPI";
  }

  static get info() {
    return {
      author: "Moosty Team <info@moosty.com>",
      version: "0.0.1",
      name: "Extended HTTP API",
    };
  }

  get defaults() {
    return {};
  }

  get events() {
    return [];
  }

  get actions() {
    return {};
  }

  async load(channel) {
    this._app = express();
    this._channel = channel;
    this._db = await getDBInstance();
    this._nodeInfo = await this._channel.invoke("app:getNodeInfo");

    this._app.use(cors({origin: "*", methods: ["GET", "POST", "PUT"]}));
    this._app.use(express.json());

    this._app.get("/api/transactions", async (_req, res) => {
      const transactions = await getAllTransactions(this._db, this.schemas);

      const data = transactions.map(trx => {
        const module = this._nodeInfo.registeredModules.find(m => m.id === trx.tx.moduleID);
        const asset = module.transactionAssets.find(a => a.id === trx.tx.assetID);
        return {
          ...trx.tx,
          ...trx.tx.asset,
          height: trx.height,
          moduleName: module.name,
          assetName: asset.name,
        }
      })
      res.json({data});
    });

    this._subscribeToChannel();

    this._server = this._app.listen(AppConfig.plugins.ExtendedHTTPAPI.port, "0.0.0.0");
  }

  _subscribeToChannel() {
    // listen to application events and enrich blockchain data for UI/third party application
    this._channel.subscribe('app:block:new', async (eventInfo) => {
      const {block} = eventInfo;
      const {payload, header} = codec.decode(
        this.schemas.block,
        Buffer.from(block, 'hex'),
      );
      const blockHeader = codec.decode(
        this.schemas.blockHeader,
        header
      );
      if (payload.length > 0) {
        await saveTransactions(this._db, payload.map(p => ({tx: p, height: blockHeader.height})));
      }
    });
  }

  async unload() {
    // close http server
    await new Promise((resolve, reject) => {
      this._server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
    // close database connection
    await this._db.close();
  }
}
