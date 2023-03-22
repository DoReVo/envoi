import { JSONSchemaType } from "ajv";

export interface PostRouteBody {
  url: string;
  targets: string[];
  tags?: string[];
}

export const POST_ROUTE_SCHEMA: JSONSchemaType<PostRouteBody> = {
  type: "object",
  required: ["targets", "url"],
  properties: {
    url: {
      type: "string",
    },
    targets: {
      type: "array",
      items: {
        type: "string",
        format: "uri",
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
