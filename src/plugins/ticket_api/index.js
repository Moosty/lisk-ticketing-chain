import express from "express";
import cors from "cors";
import { BasePlugin } from "lisk-sdk";
import pJSON from "../../../package.json";

export class TicketAPIPlugin extends BasePlugin {
  _server = undefined;
  _app = undefined;
  _channel = undefined;

  static get alias() {
    return "TicketHttpApi";
  }

  static get info() {
    return {
      author: pJSON.author,
      version: pJSON.version,
      name: pJSON.name,
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

    this._channel.once("app:ready", () => {
      this._app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT"] }));
      this._app.use(express.json());

      this._app.get("/api/organizers", async (_req, res) => {
        const organizerAccounts = await this._channel.invoke("organizer:getAllOrganizerAccounts");

        res.json({ data: organizerAccounts });
      });

      this._app.get("/api/events", async (_req, res) => {
        const items = await this._channel.invoke("event:getAllEvents");

        res.json({ data: items });
      });
      this._app.get("/api/tickets", async (_req, res) => {
        const items = await this._channel.invoke("ticket:getAllTickets");

        res.json({ data: items });
      });
      this._app.get("/api/market", async (_req, res) => {
        const items = await this._channel.invoke("ticket:getAllMarketTickets");

        res.json({ data: items });
      });


      this._app.get("/api/event/:id", async (req, res) => {
        const events = await this._channel.invoke("event:getAllEvents");
        console.log({ events, id: req.params.id });

        const event = events.find((e) => e.id === req.params.id);

        res.json({ data: event });
      });

      this._app.get("/api/market/:id", async (req, res) => {
        const items = await this._channel.invoke("ticket:getAllMarketTickets");
        const item = items.find((i) => i.id === req.params.id);

        res.json({ data: item });
      });

      this._app.get("/api/ticket/:id", async (req, res) => {
        const items = await this._channel.invoke("ticket:getAllTickets");
        const item = items.find((i) => i.id === req.params.id);

        res.json({ data: item });
      });

      this._app.get("/api/organizer/:id", async (req, res) => {
        const organizerAccounts = await this._channel.invoke("organizer:getAllOrganizerAccounts");
        console.log({ organizerAccounts, id: req.params.id });

        const organizer = organizerAccounts.find((t) => t.id === req.params.id);

        res.json({ data: organizer });
      });

      this._server = this._app.listen(5008, "0.0.0.0");
    });
  }

  async unload() {
    await new Promise((resolve, reject) => {
      this._server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}

