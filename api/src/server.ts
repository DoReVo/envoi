// Require the framework and instantiate it
import fastify from "fastify";
import fastifyEnv from "@fastify/env";
import { EnvSchema } from "./config/Env";
import routes from "./routes";
import fastifyStatic from "@fastify/static";
import path from "path";

const app = fastify({ logger: true, disableRequestLogging: true });

/* Register plugins */
async function registerPlugins() {
  /* Environment variable plugin */
  await app.register(fastifyEnv, {
    schema: EnvSchema,
    dotenv: true,
    confKey: "env",
  });

  await app.register(fastifyStatic, {
    root: path.join(__dirname, "public"),
  });
  /* Register the routes for our app */
  await app.register(routes, { prefix: "api" });
}

app.get("/", async (req, res) => {
  return res.sendFile("index.html");
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
