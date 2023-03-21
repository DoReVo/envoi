import { JSONSchemaType } from "ajv";
import { FastifyPluginCallback } from "fastify";
import { authHook } from "./hooks";

const AUTH_HEADER_SCHEMA: JSONSchemaType<{ authorization: string }> = {
  type: "object",
  required: ["authorization"],
  properties: {
    authorization: {
      type: "string",
    },
  },
};

const routes: FastifyPluginCallback = async (app, opts) => {
  app.post(
    "/add-route",
    {
      schema: {
        headers: AUTH_HEADER_SCHEMA,
      },
    },
    async (req, res) => {
      return { HEHE: app.env.PORT, LOL: __dirname };
    }
  );

  app.get(
    "/routes",
    {
      schema: {
        headers: AUTH_HEADER_SCHEMA,
      },
    },
    async (req, res) => {
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
