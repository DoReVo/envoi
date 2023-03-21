import { JSONSchemaType } from "ajv";

export interface PostRouteBody {
  url: string;
  target: string[];
}

export const POST_ROUTE_SCHEMA: JSONSchemaType<PostRouteBody> = {
  type: "object",
  required: ["target", "url"],
  properties: {
    url: {
      type: "string",
      format: "uri",
    },
    target: {
      type: "array",
      items: {
        type: "string",
        format: "uri",
      },
    },
  },
};

export type DeleteRouteBody = Pick<PostRouteBody, "url">;

export const DELETE_ROUTE_SCHEMA: JSONSchemaType<DeleteRouteBody> = {
  type: "object",
  required: ["url"],
  properties: {
    url: {
      type: "string",
      format: "uri",
    },
  },
};
