import { JSONSchemaType } from "ajv";
import { FastifyPluginCallback } from "fastify";

const AUTH_HEADER_SCHEMA: JSONSchemaType<{ authorization: string }> = {
  type: "object",
  required: ["authorization"],
  properties: {
    authorization: {
      type: "string",
    },
  },
};

const routes: FastifyPluginCallback = async (app, _opts) => {
  app.post(
    "/route",
    {
      schema: {
        headers: AUTH_HEADER_SCHEMA,
      },
    },
    async (_req, _res) => {
      return { HEHE: app.env.PORT, LOL: import.meta.url };
    }
  );

  app.get(
    "/route",
    {
      schema: {
        headers: AUTH_HEADER_SCHEMA,
      },
    },
    async (_req, _res) => {
      return { hehe: "boi" };
    }
  );

  /* Really basic auth */
  app.addHook("preHandler", async (req, res) => {
    const token = req?.headers?.authorization;

    if (token !== app.env.API_TOKEN)
      return res.code(401).send({ error: { message: "Not authorized" } });
  });
};

export default routes;
