import { JSONSchemaType } from "ajv";
import { FastifyPluginCallback } from "fastify";
import {
  DeleteRouteBody,
  DELETE_ROUTE_SCHEMA,
  PostRouteBody,
  POST_ROUTE_SCHEMA,
} from "./schemas/index.js";

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
  app.get(
    "/route",
    {
      schema: {
        headers: AUTH_HEADER_SCHEMA,
      },
    },
    async () => {
      const { redis } = app;

      let data = await redis.keys("envoi:url:*");
      // remove envoi
      data = data.map((key) => key.slice(6));

      const proms = await Promise.all(data.map((key) => redis.smembers(key)));
      // remove url:
      data = data.map((key) => key.slice(4));

      let res: PostRouteBody[] = [];
      data.forEach((key, index) => {
        res.push({ url: key, target: proms[index] ?? [] });
      });

      return res;
    }
  );
  app.post<{ Body: PostRouteBody }>(
    "/route",
    {
      schema: {
        headers: AUTH_HEADER_SCHEMA,
        body: POST_ROUTE_SCHEMA,
      },
    },
    async (req) => {
      const { redis } = app;
      const { target, url } = req.body;

      await redis.sadd(`url:${url}`, target);

      return { message: "ok" };
    }
  );

  app.patch<{ Params: { url: string }; Body: PostRouteBody }>(
    "/route",
    {
      schema: {
        headers: AUTH_HEADER_SCHEMA,
        body: POST_ROUTE_SCHEMA,
      },
    },
    async (req) => {
      const { redis } = app;
      const { target, url } = req.body;

      const key = `url:${url}`;
      await redis.del(key);
      await redis.sadd(key, target);

      return { message: "ok" };
    }
  );

  app.delete<{ Body: DeleteRouteBody }>(
    "/route",
    {
      schema: {
        headers: AUTH_HEADER_SCHEMA,
        body: DELETE_ROUTE_SCHEMA,
      },
    },
    async (req) => {
      const { redis } = app;
      const { url } = req.body;

      await redis.del(`url:${url}`);

      return { message: "ok" };
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
