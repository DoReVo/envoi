import { JSONSchemaType } from "ajv";

export interface PostRouteBody {
  path: string;
  targets: Targets[];
  tags?: string[];
}

type Targets = { value: string };

export const AUTH_HEADER_SCHEMA: JSONSchemaType<{ authorization: string }> = {
  type: "object",
  required: ["authorization"],
  properties: {
    authorization: {
      type: "string",
    },
  },
};

export const POST_ROUTE_SCHEMA: JSONSchemaType<PostRouteBody> = {
  type: "object",
  required: ["targets", "path"],
  properties: {
    path: {
      type: "string",
    },
    targets: {
      type: "array",
      items: {
        type: "object",
        required: ["value"],
        properties: {
          value: {
            type: "string",
            format: "uri",
          },
        },
      },
    },
    tags: {
      type: "array",
      items: {
        type: "string",
      },
      nullable: true,
    },
  },
};
