import { Queue } from "bullmq";
import { FastifyInstance } from "fastify";
import * as ws from "ws";

import { Env } from "../config/Env";

declare module "fastify" {
  interface FastifyInstance {
    env: Env;
    queue: {
      forwardWebhookQ: Queue;
    };
  }
}

declare namespace WebhookEntry {
  interface Data {
    url: string;
    targets: Target[];
    tags: string[];
    created: string;
  }

  interface Target {
    value: string;
  }
}

declare module "ws" {
  export interface WebSocket extends ws {
    META_DATA: MetaData;
  }
}

interface MetaData {
  id: string;
  token?: string;
}