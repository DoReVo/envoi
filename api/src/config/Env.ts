import { JSONSchemaType } from "ajv";

export interface Env {
  PORT?: number;
  API_TOKEN: string;
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
  },
  additionalProperties: true,
};
