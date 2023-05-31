import { FastifyPluginCallback } from "fastify";
import {
  AUTH_HEADER_SCHEMA,
  PostRouteBody,
  POST_ROUTE_SCHEMA,
} from "./schemas/index.js";
import {
  PrismaClientRustPanicError,
  PrismaClientValidationError,
  PrismaClientKnownRequestError,
  PrismaClientInitializationError,
  PrismaClientUnknownRequestError,
} from "@prisma/client/runtime/library.js";
import { stripSlashPrefix } from "./utility/index.js";

const routes: FastifyPluginCallback = async (app, _opts) => {
  const { prisma } = app;
  app.get(
    "/route",
    {
      schema: {
        headers: AUTH_HEADER_SCHEMA,
      },
    },
    async () => {
      const routes = await prisma.route.findMany();

      return routes;
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
    async (req, _res) => {
      // Remove / prefix if present
      const path = stripSlashPrefix(req.body.path);

      const dataToSave = {
        ...req.body,
        path,
      };

      const response = await app.prisma.route.create({ data: dataToSave });

      return response;
    }
  );

  app.patch<{ Body: PostRouteBody; Params: { id: string } }>(
    "/route/:id",
    {
      schema: {
        headers: AUTH_HEADER_SCHEMA,
        body: POST_ROUTE_SCHEMA,
      },
    },
    async (req) => {
      // Remove / prefix if present
      const path = stripSlashPrefix(req.body.path);

      const dataToSave = {
        ...req.body,
        path,
      };

      const route = await prisma.route.update({
        where: {
          id: req.params.id,
        },
        data: dataToSave,
      });

      return route;
    }
  );

  app.delete<{ Params: { id: string } }>(
    "/route/:id",
    {
      schema: {
        headers: AUTH_HEADER_SCHEMA,
      },
    },
    async (req) => {
      req.log.info("Deleting route: %s", req.params.id);

      await prisma.route.delete({
        where: {
          id: req.params.id,
        },
      });

      req.log.info("Deleted route: %s", req.params.id);

      return { message: "ok" };
    }
  );

  // Get all events for the given path
  app.get<{ Querystring: { path: PostRouteBody["url"] } }>(
    "/route/events",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["path"],
          properties: {
            path: {
              type: "string",
            },
          },
        },
      },
    },
    async (req) => {
      const { path } = req?.query;

      const {
        server: { redis },
      } = req;

      const key = `event_stream:url:${path}`;

      let data = await redis.xrange(key, "-", "+");

      data = data.reverse();

      data = data.map((entry) => {
        // First element is the streamId,
        // second is our data
        const id = entry[0];
        // First element is the key,
        // Second is the data
        let rawData = entry[1];

        rawData = JSON.parse(rawData[1] as any);

        return { streamId: id, data: rawData };
      }) as any;

      return data;
    }
  );

  app.get("/test", async (req) => {
    return await req.server.queue.forwardWebhookQ.getMetrics("completed");
  });

  /* Really basic auth */
  app.addHook("preHandler", async (req, res) => {
    const token = req?.headers?.authorization;

    if (token !== app.env.API_TOKEN)
      return res
        .code(401)
        .send({ error: { message: "You are not authorized" } });
  });

  app.setErrorHandler((error, _req, res) => {
    const isPrismaError =
      error instanceof PrismaClientRustPanicError ||
      error instanceof PrismaClientValidationError ||
      error instanceof PrismaClientKnownRequestError ||
      error instanceof PrismaClientInitializationError ||
      error instanceof PrismaClientUnknownRequestError;

    if (isPrismaError)
      return res
        .code(400)
        .send({ error: { message: `Prisma Error: ${error?.message}` } });
    else throw error;
  });
};

export default routes;
