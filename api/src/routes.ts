import { FastifyPluginCallback } from "fastify";

const routes: FastifyPluginCallback = async (app, opts) => {
  app.get("/add-route", async (req, res) => {
    return { HEHE: app.env.PORT, LOL: __dirname };
  });
};

export default routes;
