import { FastifyPluginCallback } from "fastify";
import { nanoid } from "nanoid";
import { WebSocket } from "ws";

const sockets: FastifyPluginCallback = async (app, _opts) => {
  app
    .get("/", { websocket: true }, async (connection, req) => {
      const id = nanoid();
      const socket = connection.socket as unknown as WebSocket;

      req.log.info({ clientId: id }, "New socket client connection");

      const meta = { id, token: req?.headers?.authorization };
      socket.META_DATA = meta;

      connection.socket.on("message", (data) => {
        req.log.info(
          { clientId: id, message: data.toString("utf8") },
          "New socket message"
        );
      });

      connection.socket.send(JSON.stringify({ message: `Your ID is ${id}` }));
    })
    .addHook("preValidation", async (req, res) => {
      const qs = req.query as any;
      const token = req?.headers?.authorization || qs?.token;

      if (token !== app.env.API_TOKEN)
        return res
          .code(401)
          .send({ error: { message: "You are not authorized" } });
    });
};

export default sockets;
