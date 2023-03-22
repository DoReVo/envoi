import fastify from "fastify";
import fastifyEnv from "@fastify/env";
import { EnvSchema } from "./config/Env.js";
import routes from "./routes.js";
import { DateTime } from "luxon";
import fastifyCors from "@fastify/cors";
import fastifyRedis from "@fastify/redis";

const app = fastify({
  logger: {
    enabled: true,
    level: "debug",
  },
  disableRequestLogging: true,
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

/* redis plugin */
await app.register(fastifyRedis, {
  host: app.env.REDIS_HOST,
  port: app.env.REDIS_PORT,
  keyPrefix: "envoi:",
});

/* Register the routes for our app */
await app.register(routes, { prefix: "api" });

/* Register plugins */

app.get("/", async () => {
  return { message: `Envoi API ${DateTime.now().toISO()}` };
});

try {
  await app.listen({ port: app.env.PORT });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
