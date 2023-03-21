import { JSONSchemaType } from "ajv";

export interface Env {
  PORT?: number;
  API_TOKEN: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
}

export const EnvSchema: JSONSchemaType<Env> = {
  type: "object",
  required: ["API_TOKEN"],
  properties: {
    PORT: {
      type: "integer",
      default: 4000,
      nullable: true,
    },
    API_TOKEN: {
      type: "string",
    },
    REDIS_HOST: {
      type: "string",
    },
    REDIS_PORT: {
      type: "number",
    },
  },
  additionalProperties: true,
};
