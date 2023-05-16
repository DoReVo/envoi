import { JSONSchemaType } from "ajv";

export interface Env {
  DOMAIN: string;
  PORT?: number;
  API_TOKEN: string;
  REDIS_URL: string;
}

export const EnvSchema: JSONSchemaType<Env> = {
  type: "object",
  required: ["API_TOKEN"],
  properties: {
    DOMAIN: {
      type: "string",
    },
    PORT: {
      type: "integer",
      default: 4000,
      nullable: true,
    },
    API_TOKEN: {
      type: "string",
    },
    REDIS_URL: {
      type: "string",
    },
  },
  additionalProperties: true,
};
