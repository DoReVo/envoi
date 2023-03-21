import { FastifyInstance } from "fastify";
import { Env } from "../config/Env";
declare module "fastify" {
  interface FastifyInstance {
    env: Env;
  }
}
