import { WebhookEntry } from "../types";

/** JSON to webhook object */
export function deserialize(json: any): WebhookEntry.Data {
  let data: WebhookEntry.Data;

//   if(json?.url && json?.)

  try {
    data = JSON.parse(json);
  } catch (error) {
    throw new Error("Unexpected error when deserializing");
  }

  return data;
}
