// Require the framework and instantiate it
import fastify from "fastify";
import fastifyEnv from "@fastify/env";
import { EnvSchema } from "./config/Env";
import routes from "./routes";
import { DateTime } from "luxon";
import fastifyCors from "@fastify/cors";
import fastifyRedis from "@fastify/redis";

const app = fastify({ logger: true, disableRequestLogging: true });

/* Register plugins */
async function registerPlugins() {
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
  await app.register(fastifyRedis, {});

  /* Register the routes for our app */
  await app.register(routes, { prefix: "api" });
}

app.get("/", async () => {
  return { message: `Envoi API ${DateTime.now().toISO()}` };
});

// Run the server!
async function start() {
  try {
    await registerPlugins();

    await app.listen({ port: app.env.PORT });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
