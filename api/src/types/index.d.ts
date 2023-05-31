import { Queue, Worker } from "bullmq";
import { FastifyInstance } from "fastify";
import * as ws from "ws";

import { Env } from "../config/Env";
import { PrismaClient } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    env: Env;
    queue: {
      forwardWebhookQ: Queue;
    };
    worker: {
      forwardWebhookWorker: Worker;
    };
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
