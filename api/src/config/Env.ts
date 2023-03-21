import { JSONSchemaType } from "ajv";

export interface Env {
  PORT?: number;
}

export const EnvSchema: JSONSchemaType<Env> = {
  type: "object",
  properties: {
    PORT: {
      type: "integer",
      default: 4000,
      nullable: true,
    },
  },
  additionalProperties: true,
};
