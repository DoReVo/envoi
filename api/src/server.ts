import fastify, { FastifyLoggerOptions } from "fastify";
import fastifyEnv from "@fastify/env";
import { EnvSchema } from "./config/Env.js";
import routes from "./routes.js";
import { DateTime } from "luxon";
import fastifyCors from "@fastify/cors";
import fastifyRedis from "@fastify/redis";
import customRoutes from "./customRoutes.js";
import { nanoid } from "nanoid";
import websocketPlugin from "@fastify/websocket";
import sockets from "./socket.js";
import queue from "./queue/index.js";
import prismaPlugin from "./plugins/prisma.js";

interface EnvOptions {
  development: {
    transport: {
      target: "string";
      options: {
        translateTime: string;
        ignore: string;
      };
    };
  };
  production: boolean;
  test: boolean;
}

const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
  test: false,
};

const environment: keyof EnvOptions =
  (process.env.NODE_ENV as keyof EnvOptions) ??
  ("production" as keyof EnvOptions);

const app = fastify({
  logger: (envToLogger?.[environment] as FastifyLoggerOptions) ?? true,
  disableRequestLogging: true,
  genReqId: () => nanoid(),
});

/* Environment variable plugin */
await app.register(fastifyEnv, {
  schema: EnvSchema,
  dotenv: true,
  confKey: "env",
});

/* CORS plugin */
await app.register(fastifyCors, {
  origin: "*",
});

const redisUrl = new URL(app.env.REDIS_URL);

/* redis plugin */
await app.register(fastifyRedis, {
  url: app.env.REDIS_URL,
  username: redisUrl?.username,
  password: redisUrl?.password,
  keyPrefix: "envoi:",
});

await app.register(prismaPlugin);

await app.register(queue);

await app.register(websocketPlugin);

/* Register custom routes added by users */
await app.register(customRoutes, { prefix: "webhook" });

/* Register the routes for our app */
await app.register(routes, { prefix: "api" });
await app.register(sockets, { prefix: "socket" });

/* Graceful shutdown stuff */
/* ---------------------------------------------------------- */
const signals = {
  SIGHUP: 1,
  SIGINT: 2,
  SIGTERM: 15,
};

// Create a listener for each of the signals that we want to handle
Object.keys(signals).forEach((signal) => {
  process.on(signal, async () => {
    app.log.info("Shutdown process started, signal given: %s", signal);

    app.log.info("Server | Forward Webhook Queue is shutting down");
    await app.queue.forwardWebhookQ.close();
    app.log.info("Server | Forward Webhook Queue is closed");

    app.log.info("Server | Forward Webhook Worker is shutting down");
    await app.worker.forwardWebhookWorker.close();
    app.log.info("Server | Forward Webhook Worker is closed");

    app.log.info("HTTP Server is shutting down");
    await app.close();
    app.log.info("HTTP Server is closed");

    app.log.info("Shutdown process finished, signal given: %s", signal);

    process.exit(0);
  });
});

/* ---------------------------------------------------------- */

app.get("/", async () => {
  return { message: `Envoi API ${DateTime.now().toISO()}` };
});

try {
  await app.listen({ port: app.env.PORT, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
